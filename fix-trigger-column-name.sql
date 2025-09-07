-- Fix trigger function column name issue
-- The leads table uses whatsapp_number_id, not whatsapp_instance_id

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
        
        -- 🔧 FIX: Use whatsapp_number_id instead of whatsapp_instance_id
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