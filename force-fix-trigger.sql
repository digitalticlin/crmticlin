-- FORÇA CORREÇÃO DO TRIGGER - Aplicar no Supabase SQL Editor
-- Este SQL força a correção da função que estava causando o erro

-- 1. Recriar a função com a correção definitiva
DROP FUNCTION IF EXISTS update_leads_owner_on_assignment_change() CASCADE;

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
        
        -- 🔧 CORREÇÃO CRÍTICA: Usar whatsapp_number_id (coluna correta da tabela leads)
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

-- 2. Recriar os triggers
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

-- 3. Dar permissões
GRANT EXECUTE ON FUNCTION update_leads_owner_on_assignment_change() TO authenticated;

-- 4. Comentário
COMMENT ON FUNCTION update_leads_owner_on_assignment_change() IS 
'Atualiza owner_id dos leads quando atribuições de funil/WhatsApp mudam. CORRIGIDO: usa whatsapp_number_id em vez de whatsapp_instance_id';

-- 5. CORRIGIR A SEGUNDA FUNÇÃO QUE TAMBÉM TEM O PROBLEMA
DROP FUNCTION IF EXISTS update_leads_owner_on_whatsapp_change() CASCADE;

CREATE OR REPLACE FUNCTION update_leads_owner_on_whatsapp_change()
RETURNS TRIGGER AS $$
DECLARE
    new_owner_id uuid;
    whatsapp_id uuid;
BEGIN
    whatsapp_id := COALESCE(NEW.whatsapp_number_id, OLD.whatsapp_number_id);
    
    -- Determinar novo owner da instância WhatsApp
    SELECT get_whatsapp_owner(whatsapp_id) INTO new_owner_id;
    
    -- 🔧 CORREÇÃO CRÍTICA: Usar whatsapp_number_id em vez de whatsapp_instance_id
    UPDATE leads 
    SET created_by_user_id = new_owner_id
    WHERE whatsapp_number_id = whatsapp_id;
    
    RAISE LOG 'Updated leads owner for WhatsApp % to user %', whatsapp_id, new_owner_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 6. Recriar triggers para a segunda função
DROP TRIGGER IF EXISTS trigger_update_whatsapp_leads_owner_insert_old ON user_whatsapp_numbers;
CREATE TRIGGER trigger_update_whatsapp_leads_owner_insert_old
    AFTER INSERT ON user_whatsapp_numbers
    FOR EACH ROW
    EXECUTE FUNCTION update_leads_owner_on_whatsapp_change();

DROP TRIGGER IF EXISTS trigger_update_whatsapp_leads_owner_delete_old ON user_whatsapp_numbers;
CREATE TRIGGER trigger_update_whatsapp_leads_owner_delete_old
    AFTER DELETE ON user_whatsapp_numbers
    FOR EACH ROW
    EXECUTE FUNCTION update_leads_owner_on_whatsapp_change();

-- 7. Dar permissões na segunda função
GRANT EXECUTE ON FUNCTION update_leads_owner_on_whatsapp_change() TO authenticated;

-- 8. Comentário na segunda função
COMMENT ON FUNCTION update_leads_owner_on_whatsapp_change() IS 
'Atualiza created_by_user_id dos leads quando vinculação de WhatsApp muda. CORRIGIDO: usa whatsapp_number_id em vez de whatsapp_instance_id';

-- 9. Verificação final
SELECT 'Ambas as funções corrigidas com sucesso!' as status;