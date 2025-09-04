-- Migration: Manual ownership reassignment functions
-- Allow admins to manually reassign leads and fix ownership issues

-- ✅ 1. Function to manually reassign all leads of a funnel
CREATE OR REPLACE FUNCTION reassign_funnel_leads(
    p_funnel_id uuid,
    p_new_owner_id uuid DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    updated_count integer;
    final_owner_id uuid;
BEGIN
    -- If no owner specified, use the automatic owner detection
    IF p_new_owner_id IS NULL THEN
        SELECT get_funnel_owner(p_funnel_id) INTO final_owner_id;
    ELSE
        final_owner_id := p_new_owner_id;
    END IF;
    
    -- Update all leads for this funnel
    UPDATE leads 
    SET created_by_user_id = final_owner_id
    WHERE funnel_id = p_funnel_id;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'funnel_id', p_funnel_id,
        'new_owner_id', final_owner_id,
        'updated_leads_count', updated_count
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ 2. Function to manually reassign all leads of a WhatsApp instance
CREATE OR REPLACE FUNCTION reassign_whatsapp_leads(
    p_whatsapp_id uuid,
    p_new_owner_id uuid DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    updated_count integer;
    final_owner_id uuid;
BEGIN
    -- If no owner specified, use the automatic owner detection
    IF p_new_owner_id IS NULL THEN
        SELECT get_whatsapp_owner(p_whatsapp_id) INTO final_owner_id;
    ELSE
        final_owner_id := p_new_owner_id;
    END IF;
    
    -- Update all leads for this WhatsApp instance
    UPDATE leads 
    SET created_by_user_id = final_owner_id
    WHERE whatsapp_instance_id = p_whatsapp_id;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'whatsapp_id', p_whatsapp_id,
        'new_owner_id', final_owner_id,
        'updated_leads_count', updated_count
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ 3. Function to fix all ownership issues (run once after migration)
CREATE OR REPLACE FUNCTION fix_all_leads_ownership()
RETURNS JSON AS $$
DECLARE
    funnel_record RECORD;
    whatsapp_record RECORD;
    total_updated integer := 0;
    funnel_updated integer;
    whatsapp_updated integer;
BEGIN
    -- Fix ownership for all funnels
    FOR funnel_record IN 
        SELECT DISTINCT id FROM funnels 
    LOOP
        SELECT (reassign_funnel_leads(funnel_record.id))->>'updated_leads_count' INTO funnel_updated;
        total_updated := total_updated + COALESCE(funnel_updated::integer, 0);
    END LOOP;
    
    -- Fix ownership for all WhatsApp instances
    FOR whatsapp_record IN 
        SELECT DISTINCT id FROM whatsapp_instances 
    LOOP
        SELECT (reassign_whatsapp_leads(whatsapp_record.id))->>'updated_leads_count' INTO whatsapp_updated;
        total_updated := total_updated + COALESCE(whatsapp_updated::integer, 0);
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Ownership fixed for all leads',
        'total_updated_leads', total_updated
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ 4. Grant permissions
GRANT EXECUTE ON FUNCTION reassign_funnel_leads(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION reassign_whatsapp_leads(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION fix_all_leads_ownership() TO authenticated;

-- ✅ 5. Add helpful comments
COMMENT ON FUNCTION reassign_funnel_leads(uuid, uuid) IS 
'Reatribui manualmente todos os leads de um funil para um owner específico ou detecta automaticamente';

COMMENT ON FUNCTION reassign_whatsapp_leads(uuid, uuid) IS 
'Reatribui manualmente todos os leads de uma instância WhatsApp para um owner específico ou detecta automaticamente';

COMMENT ON FUNCTION fix_all_leads_ownership() IS 
'Corrige ownership de todos os leads do sistema baseado nas vinculações atuais';