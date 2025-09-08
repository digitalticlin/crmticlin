-- =====================================================
-- CORREÇÃO CRÍTICA: Trigger estava alterando created_by_user_id incorretamente
-- Deve alterar apenas owner_id, mantendo created_by_user_id intacto
-- =====================================================

-- 1. CORRIGIR AS FUNÇÕES QUE ESTAVAM ERRADAS

-- Corrigir função de mudança de funil
CREATE OR REPLACE FUNCTION update_leads_owner_on_funnel_change()
RETURNS TRIGGER AS $$
DECLARE
    new_owner_id uuid;
BEGIN
    -- Determinar novo owner do funil
    SELECT get_funnel_owner(COALESCE(NEW.funnel_id, OLD.funnel_id)) INTO new_owner_id;
    
    -- CORREÇÃO: Atualizar apenas owner_id, NÃO created_by_user_id
    UPDATE leads 
    SET owner_id = new_owner_id  -- ✅ CORRIGIDO: apenas owner_id
    WHERE funnel_id = COALESCE(NEW.funnel_id, OLD.funnel_id);
    
    RAISE LOG 'Updated leads OWNER (not creator) for funnel % to user %', COALESCE(NEW.funnel_id, OLD.funnel_id), new_owner_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Corrigir função de mudança de WhatsApp
CREATE OR REPLACE FUNCTION update_leads_owner_on_whatsapp_change()
RETURNS TRIGGER AS $$
DECLARE
    new_owner_id uuid;
    whatsapp_id uuid;
BEGIN
    whatsapp_id := COALESCE(NEW.whatsapp_number_id, OLD.whatsapp_number_id);
    
    -- Determinar novo owner da instância WhatsApp
    SELECT get_whatsapp_owner(whatsapp_id) INTO new_owner_id;
    
    -- CORREÇÃO: Atualizar apenas owner_id, NÃO created_by_user_id
    UPDATE leads 
    SET owner_id = new_owner_id  -- ✅ CORRIGIDO: apenas owner_id
    WHERE whatsapp_instance_id = whatsapp_id;
    
    RAISE LOG 'Updated leads OWNER (not creator) for WhatsApp % to user %', whatsapp_id, new_owner_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Corrigir função de mudança de atribuição (versão mais recente)
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
        AND p.invite_status IN ('accepted', 'invite_sent')
        ORDER BY uf.created_at DESC
        LIMIT 1;
        
        -- Se não encontrou operacional, buscar admin dono do funil
        IF new_owner_id IS NULL THEN
            SELECT created_by_user_id INTO new_owner_id
            FROM funnels WHERE id = affected_funnel_id;
        END IF;
        
        -- CORREÇÃO: Atualizar apenas owner_id
        UPDATE leads 
        SET owner_id = new_owner_id  -- ✅ CORRIGIDO
        WHERE funnel_id = affected_funnel_id;
        
        GET DIAGNOSTICS leads_updated = ROW_COUNT;
        RAISE LOG 'Funil % teve owner alterado para %. % leads atualizados', 
            affected_funnel_id, new_owner_id, leads_updated;
            
    ELSIF TG_TABLE_NAME = 'user_whatsapp_numbers' THEN
        affected_whatsapp_id := COALESCE(NEW.whatsapp_number_id, OLD.whatsapp_number_id);
        
        -- Buscar novo owner do WhatsApp
        SELECT p.linked_auth_user_id INTO new_owner_id
        FROM user_whatsapp_numbers uwn
        JOIN profiles p ON uwn.profile_id = p.id
        WHERE uwn.whatsapp_number_id = affected_whatsapp_id
        AND p.linked_auth_user_id IS NOT NULL
        AND p.role = 'operational'
        AND p.invite_status IN ('accepted', 'invite_sent')
        ORDER BY uwn.created_at DESC
        LIMIT 1;
        
        -- Se não encontrou operacional, buscar admin dono da instância
        IF new_owner_id IS NULL THEN
            SELECT created_by_user_id INTO new_owner_id
            FROM whatsapp_instances WHERE id = affected_whatsapp_id;
        END IF;
        
        -- CORREÇÃO: Atualizar apenas owner_id
        UPDATE leads 
        SET owner_id = new_owner_id  -- ✅ CORRIGIDO
        WHERE whatsapp_instance_id = affected_whatsapp_id;
        
        GET DIAGNOSTICS leads_updated = ROW_COUNT;
        RAISE LOG 'WhatsApp % teve owner alterado para %. % leads atualizados', 
            affected_whatsapp_id, new_owner_id, leads_updated;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 2. CRIAR PERFIL PARA O USUÁRIO 9936ae64-b78c-48fe-97e8-bf67623349c6
-- Este é um dos principais admins com 2.317 leads
INSERT INTO profiles (
    linked_auth_user_id,
    email,
    role,
    full_name,
    created_at,
    updated_at
) VALUES (
    '9936ae64-b78c-48fe-97e8-bf67623349c6',
    'admin.empresa1@sistema.com.br', -- Email genérico, ajuste se souber o correto
    'admin',
    'Admin Empresa 1',
    NOW(),
    NOW()
)
ON CONFLICT (linked_auth_user_id) 
DO UPDATE SET 
    role = 'admin',
    updated_at = NOW();

-- 3. RESTAURAR created_by_user_id PARA LEADS MIGRADOS INCORRETAMENTE
-- Restaurar leads da nathirosa para o admin correto (digitalticlin)
UPDATE leads 
SET created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4' -- digitalticlin
WHERE owner_id = '9fb02aac-79d7-4238-a85b-dcfc3d05a92e' -- nathirosa
AND created_by_user_id = '9fb02aac-79d7-4238-a85b-dcfc3d05a92e'; -- onde foi incorretamente alterado

-- 4. GARANTIR QUE owner_id NUNCA SEJA NULL
UPDATE leads 
SET owner_id = created_by_user_id 
WHERE owner_id IS NULL 
AND created_by_user_id IS NOT NULL;

-- 5. Adicionar comentários para documentação
COMMENT ON FUNCTION update_leads_owner_on_funnel_change() IS 
'Atualiza APENAS owner_id dos leads quando funil é atribuído. NÃO altera created_by_user_id.';

COMMENT ON FUNCTION update_leads_owner_on_whatsapp_change() IS 
'Atualiza APENAS owner_id dos leads quando WhatsApp é atribuído. NÃO altera created_by_user_id.';

COMMENT ON FUNCTION update_leads_owner_on_assignment_change() IS 
'Função principal para atualizar APENAS owner_id quando recursos são atribuídos a operacionais.';