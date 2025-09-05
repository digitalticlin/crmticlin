-- Migration: Corrigir função de sincronização para aceitar invite_status = 'invite_sent'
-- O problema é que a função só aceita 'accepted', mas os usuários ativos têm 'invite_sent'

-- ===============================
-- 1. CORRIGIR FUNÇÃO DE SINCRONIZAÇÃO
-- ===============================

CREATE OR REPLACE FUNCTION sync_lead_ownership()
RETURNS TABLE(
    total_leads INTEGER,
    leads_synced INTEGER,
    funnel_assignments INTEGER,
    whatsapp_assignments INTEGER,
    admin_fallback INTEGER
) AS $$
DECLARE
    total_count INTEGER;
    synced_count INTEGER := 0;
    funnel_count INTEGER := 0;
    whatsapp_count INTEGER := 0;
    admin_count INTEGER := 0;
    lead_record RECORD;
BEGIN
    -- Contar total de leads
    SELECT COUNT(*) INTO total_count FROM leads;
    
    RAISE NOTICE '🔄 Iniciando sincronização de % leads...', total_count;
    
    -- Loop através de todos os leads sem owner_id
    FOR lead_record IN 
        SELECT l.id, l.funnel_id, l.whatsapp_number_id, l.created_by_user_id
        FROM leads l 
        WHERE l.owner_id IS NULL
    LOOP
        DECLARE
            assigned_user_id uuid := NULL;
        BEGIN
            -- 1. Tentar encontrar usuário atribuído ao funil
            IF lead_record.funnel_id IS NOT NULL THEN
                SELECT p.linked_auth_user_id INTO assigned_user_id
                FROM user_funnels uf
                JOIN profiles p ON uf.profile_id = p.id
                WHERE uf.funnel_id = lead_record.funnel_id
                AND p.linked_auth_user_id IS NOT NULL
                AND p.role = 'operational'
                AND p.invite_status IN ('accepted', 'invite_sent') -- 🔧 CORREÇÃO: aceitar ambos status
                ORDER BY uf.created_at DESC
                LIMIT 1;
                
                IF assigned_user_id IS NOT NULL THEN
                    funnel_count := funnel_count + 1;
                    RAISE NOTICE '✅ FUNIL: Lead % → Owner %', lead_record.id, assigned_user_id;
                END IF;
            END IF;
            
            -- 2. Se não encontrou no funil, tentar WhatsApp
            IF assigned_user_id IS NULL AND lead_record.whatsapp_number_id IS NOT NULL THEN
                SELECT p.linked_auth_user_id INTO assigned_user_id
                FROM user_whatsapp_numbers uwn
                JOIN profiles p ON uwn.profile_id = p.id
                WHERE uwn.whatsapp_number_id = lead_record.whatsapp_number_id
                AND p.linked_auth_user_id IS NOT NULL
                AND p.role = 'operational'
                AND p.invite_status IN ('accepted', 'invite_sent') -- 🔧 CORREÇÃO: aceitar ambos status
                ORDER BY uwn.created_at DESC
                LIMIT 1;
                
                IF assigned_user_id IS NOT NULL THEN
                    whatsapp_count := whatsapp_count + 1;
                    RAISE NOTICE '✅ WHATSAPP: Lead % → Owner %', lead_record.id, assigned_user_id;
                END IF;
            END IF;
            
            -- 3. Fallback: usar created_by_user_id (admin)
            IF assigned_user_id IS NULL THEN
                assigned_user_id := lead_record.created_by_user_id;
                admin_count := admin_count + 1;
                RAISE NOTICE '⚠️ FALLBACK: Lead % → Admin Owner %', lead_record.id, assigned_user_id;
            END IF;
            
            -- 4. Atualizar lead com owner_id
            UPDATE leads 
            SET owner_id = assigned_user_id,
                updated_at = now()
            WHERE id = lead_record.id;
            
            synced_count := synced_count + 1;
            
            -- Log a cada 1000 leads processados
            IF synced_count % 1000 = 0 THEN
                RAISE NOTICE '📊 Progresso: % leads processados...', synced_count;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '❌ Erro ao sincronizar lead %: %', lead_record.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '✅ Sincronização concluída!';
    RAISE NOTICE '📊 ESTATÍSTICAS FINAIS:';
    RAISE NOTICE '   Total leads: %', total_count;
    RAISE NOTICE '   Leads sincronizados: %', synced_count;
    RAISE NOTICE '   Via atribuição funil: %', funnel_count;
    RAISE NOTICE '   Via atribuição WhatsApp: %', whatsapp_count;
    RAISE NOTICE '   Fallback para admin: %', admin_count;
    
    RETURN QUERY SELECT total_count, synced_count, funnel_count, whatsapp_count, admin_count;
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- 2. ATUALIZAR TRIGGERS TAMBÉM
-- ===============================

CREATE OR REPLACE FUNCTION set_lead_owner_on_insert()
RETURNS TRIGGER AS $$
DECLARE
    assigned_user_id uuid := NULL;
    funnel_owner_id uuid := NULL;
    whatsapp_owner_id uuid := NULL;
BEGIN
    RAISE NOTICE '🎯 TRIGGER: Definindo owner_id para novo lead % (funnel: %, whatsapp: %)', 
                 NEW.id, NEW.funnel_id, NEW.whatsapp_number_id;

    -- ESTRATÉGIA 1: Buscar usuário operacional atribuído ao FUNIL
    IF NEW.funnel_id IS NOT NULL THEN
        SELECT p.linked_auth_user_id INTO funnel_owner_id
        FROM user_funnels uf
        JOIN profiles p ON uf.profile_id = p.id
        WHERE uf.funnel_id = NEW.funnel_id
        AND p.linked_auth_user_id IS NOT NULL
        AND p.role = 'operational'
        AND p.invite_status IN ('accepted', 'invite_sent') -- 🔧 CORREÇÃO
        ORDER BY uf.created_at DESC
        LIMIT 1;
        
        IF funnel_owner_id IS NOT NULL THEN
            assigned_user_id := funnel_owner_id;
            RAISE NOTICE '✅ Owner encontrado via FUNIL: % para lead %', assigned_user_id, NEW.id;
        END IF;
    END IF;
    
    -- ESTRATÉGIA 2: Se não encontrou no funil, buscar no WHATSAPP
    IF assigned_user_id IS NULL AND NEW.whatsapp_number_id IS NOT NULL THEN
        SELECT p.linked_auth_user_id INTO whatsapp_owner_id
        FROM user_whatsapp_numbers uwn
        JOIN profiles p ON uwn.profile_id = p.id
        WHERE uwn.whatsapp_number_id = NEW.whatsapp_number_id
        AND p.linked_auth_user_id IS NOT NULL
        AND p.role = 'operational'
        AND p.invite_status IN ('accepted', 'invite_sent') -- 🔧 CORREÇÃO
        ORDER BY uwn.created_at DESC
        LIMIT 1;
        
        IF whatsapp_owner_id IS NOT NULL THEN
            assigned_user_id := whatsapp_owner_id;
            RAISE NOTICE '✅ Owner encontrado via WHATSAPP: % para lead %', assigned_user_id, NEW.id;
        END IF;
    END IF;
    
    -- ESTRATÉGIA 3: FALLBACK - usar o admin criador
    IF assigned_user_id IS NULL THEN
        assigned_user_id := NEW.created_by_user_id;
        RAISE NOTICE '⚠️ FALLBACK: Usando admin criador % como owner para lead %', assigned_user_id, NEW.id;
    END IF;
    
    -- DEFINIR o owner_id no lead
    NEW.owner_id := assigned_user_id;
    
    RAISE NOTICE '🎯 RESULTADO: Lead % terá owner_id = %', NEW.id, NEW.owner_id;
    
    RETURN NEW;

EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ ERRO no trigger set_lead_owner_on_insert para lead %: %', NEW.id, SQLERRM;
    -- Em caso de erro, usar admin criador como fallback
    NEW.owner_id := NEW.created_by_user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- 3. ATUALIZAR FUNÇÃO DE MUDANÇAS DE ATRIBUIÇÃO
-- ===============================

CREATE OR REPLACE FUNCTION update_leads_owner_on_assignment_change()
RETURNS TRIGGER AS $$
DECLARE
    affected_funnel_id uuid := NULL;
    affected_whatsapp_id uuid := NULL;
    new_owner_id uuid := NULL;
    leads_updated INTEGER := 0;
BEGIN
    -- Determinar qual recurso foi alterado (funil ou whatsapp)
    IF TG_TABLE_NAME = 'user_funnels' THEN
        affected_funnel_id := COALESCE(NEW.funnel_id, OLD.funnel_id);
        
        -- Buscar novo owner do funil
        SELECT p.linked_auth_user_id INTO new_owner_id
        FROM user_funnels uf
        JOIN profiles p ON uf.profile_id = p.id
        WHERE uf.funnel_id = affected_funnel_id
        AND p.linked_auth_user_id IS NOT NULL
        AND p.role = 'operational'
        AND p.invite_status IN ('accepted', 'invite_sent') -- 🔧 CORREÇÃO
        ORDER BY uf.created_at DESC
        LIMIT 1;
        
        -- Se não encontrou operacional, buscar admin dono do funil
        IF new_owner_id IS NULL THEN
            SELECT created_by_user_id INTO new_owner_id
            FROM funnels WHERE id = affected_funnel_id;
        END IF;
        
        -- Atualizar leads do funil
        UPDATE leads 
        SET owner_id = new_owner_id,
            updated_at = now()
        WHERE funnel_id = affected_funnel_id;
        
        GET DIAGNOSTICS leads_updated = ROW_COUNT;
        RAISE NOTICE '📊 FUNIL %: % leads atualizados para owner %', affected_funnel_id, leads_updated, new_owner_id;
        
    ELSIF TG_TABLE_NAME = 'user_whatsapp_numbers' THEN
        affected_whatsapp_id := COALESCE(NEW.whatsapp_number_id, OLD.whatsapp_number_id);
        
        -- Buscar novo owner do whatsapp
        SELECT p.linked_auth_user_id INTO new_owner_id
        FROM user_whatsapp_numbers uwn
        JOIN profiles p ON uwn.profile_id = p.id
        WHERE uwn.whatsapp_number_id = affected_whatsapp_id
        AND p.linked_auth_user_id IS NOT NULL
        AND p.role = 'operational'
        AND p.invite_status IN ('accepted', 'invite_sent') -- 🔧 CORREÇÃO
        ORDER BY uwn.created_at DESC
        LIMIT 1;
        
        -- Se não encontrou operacional, buscar admin dono da instância
        IF new_owner_id IS NULL THEN
            SELECT created_by_user_id INTO new_owner_id
            FROM whatsapp_instances WHERE id = affected_whatsapp_id;
        END IF;
        
        -- Atualizar leads da instância WhatsApp
        UPDATE leads 
        SET owner_id = new_owner_id,
            updated_at = now()
        WHERE whatsapp_number_id = affected_whatsapp_id;
        
        GET DIAGNOSTICS leads_updated = ROW_COUNT;
        RAISE NOTICE '📊 WHATSAPP %: % leads atualizados para owner %', affected_whatsapp_id, leads_updated, new_owner_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);

EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ ERRO no trigger update_leads_owner: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- 4. EXECUTAR SINCRONIZAÇÃO CORRIGIDA
-- ===============================

-- Executar a função corrigida
SELECT 'EXECUTING CORRECTED SYNC' as status, * FROM sync_lead_ownership();

-- ===============================
-- 5. VERIFICAR RESULTADOS
-- ===============================

-- Verificar distribuição após correção
SELECT 
    'CORRECTED RESULTS' as status,
    COUNT(*) as total_leads,
    COUNT(owner_id) as leads_with_owner,
    COUNT(*) - COUNT(owner_id) as leads_without_owner,
    ROUND(COUNT(owner_id) * 100.0 / COUNT(*), 2) as percentage_synced
FROM leads;

-- Verificar distribuição por usuário
SELECT 
    'OWNER DISTRIBUTION CORRECTED' as status,
    COALESCE(p.full_name, 'ADMIN DIRETO') as owner_name,
    p.role,
    COUNT(l.id) as leads_count
FROM leads l
LEFT JOIN profiles p ON l.owner_id = p.linked_auth_user_id
GROUP BY p.full_name, p.role
ORDER BY leads_count DESC;

RAISE NOTICE '✅ Correção de invite_status aplicada com sucesso!';