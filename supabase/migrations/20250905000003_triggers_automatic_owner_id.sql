-- Migration: Triggers automáticos para owner_id em novos leads
-- Define owner_id automaticamente baseado em atribuições

-- ===============================
-- 1. FUNÇÃO PRINCIPAL: DEFINIR OWNER_ID
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
        AND p.invite_status = 'accepted'
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
        AND p.invite_status = 'accepted'
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
-- 2. FUNÇÃO: ATUALIZAR LEADS QUANDO ATRIBUIÇÕES MUDAM
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
        AND p.invite_status = 'accepted'
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
        AND p.invite_status = 'accepted'
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
-- 3. CRIAR OS TRIGGERS
-- ===============================

-- Trigger para NOVOS LEADS (antes de inserir)
DROP TRIGGER IF EXISTS trigger_set_lead_owner_on_insert ON leads;
CREATE TRIGGER trigger_set_lead_owner_on_insert
    BEFORE INSERT ON leads
    FOR EACH ROW
    EXECUTE FUNCTION set_lead_owner_on_insert();

-- Triggers para MUDANÇAS EM ATRIBUIÇÕES DE FUNIL
DROP TRIGGER IF EXISTS trigger_update_funnel_leads_owner_insert ON user_funnels;
CREATE TRIGGER trigger_update_funnel_leads_owner_insert
    AFTER INSERT ON user_funnels
    FOR EACH ROW
    EXECUTE FUNCTION update_leads_owner_on_assignment_change();

DROP TRIGGER IF EXISTS trigger_update_funnel_leads_owner_delete ON user_funnels;
CREATE TRIGGER trigger_update_funnel_leads_owner_delete
    AFTER DELETE ON user_funnels
    FOR EACH ROW
    EXECUTE FUNCTION update_leads_owner_on_assignment_change();

-- Triggers para MUDANÇAS EM ATRIBUIÇÕES DE WHATSAPP
DROP TRIGGER IF EXISTS trigger_update_whatsapp_leads_owner_insert ON user_whatsapp_numbers;
CREATE TRIGGER trigger_update_whatsapp_leads_owner_insert
    AFTER INSERT ON user_whatsapp_numbers
    FOR EACH ROW
    EXECUTE FUNCTION update_leads_owner_on_assignment_change();

DROP TRIGGER IF EXISTS trigger_update_whatsapp_leads_owner_delete ON user_whatsapp_numbers;
CREATE TRIGGER trigger_update_whatsapp_leads_owner_delete
    AFTER DELETE ON user_whatsapp_numbers
    FOR EACH ROW
    EXECUTE FUNCTION update_leads_owner_on_assignment_change();

-- ===============================
-- 4. VERIFICAR SE TRIGGERS ESTÃO ATIVOS
-- ===============================

SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    CASE 
        WHEN trigger_name LIKE '%owner%' THEN '✅ Owner Trigger' 
        ELSE '📋 Other Trigger' 
    END as status
FROM information_schema.triggers 
WHERE trigger_name LIKE '%owner%'
OR trigger_name LIKE '%lead%'
ORDER BY event_object_table, trigger_name;

-- ===============================
-- 5. FUNÇÃO DE TESTE (opcional)
-- ===============================

CREATE OR REPLACE FUNCTION test_owner_assignment()
RETURNS TABLE(
    test_case TEXT,
    result TEXT,
    details TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Total Leads'::TEXT,
        COUNT(*)::TEXT,
        'Leads existentes no sistema'::TEXT
    FROM leads;
    
    RETURN QUERY
    SELECT 
        'Leads com Owner'::TEXT,
        COUNT(*)::TEXT,
        'Leads com owner_id definido'::TEXT
    FROM leads WHERE owner_id IS NOT NULL;
    
    RETURN QUERY
    SELECT 
        'Leads sem Owner'::TEXT,
        COUNT(*)::TEXT,
        'Leads que precisam de sincronização'::TEXT
    FROM leads WHERE owner_id IS NULL;
    
    RETURN QUERY
    SELECT 
        'Atribuições de Funil'::TEXT,
        COUNT(*)::TEXT,
        'User-Funil assignments ativos'::TEXT
    FROM user_funnels;
    
    RETURN QUERY
    SELECT 
        'Atribuições WhatsApp'::TEXT,
        COUNT(*)::TEXT,
        'User-WhatsApp assignments ativos'::TEXT
    FROM user_whatsapp_numbers;
    
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- 6. GRANTS E DOCUMENTAÇÃO
-- ===============================

-- Garantir que as funções podem ser executadas
GRANT EXECUTE ON FUNCTION set_lead_owner_on_insert() TO authenticated;
GRANT EXECUTE ON FUNCTION update_leads_owner_on_assignment_change() TO authenticated;
GRANT EXECUTE ON FUNCTION test_owner_assignment() TO authenticated;

-- Comentários para documentação
COMMENT ON FUNCTION set_lead_owner_on_insert() IS 
'Define owner_id automaticamente para novos leads: 1) Operacional do funil, 2) Operacional do WhatsApp, 3) Admin criador';

COMMENT ON FUNCTION update_leads_owner_on_assignment_change() IS 
'Atualiza owner_id dos leads quando atribuições de funil/WhatsApp mudam';

COMMENT ON FUNCTION test_owner_assignment() IS 
'Função de teste para verificar status dos owner_ids e atribuições';

-- ✅ Triggers automáticos para owner_id configurados com sucesso!

-- ===============================
-- 7. EXECUTAR TESTE INICIAL
-- ===============================

SELECT * FROM test_owner_assignment();