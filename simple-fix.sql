-- CORREÇÃO SIMPLES - Execute linha por linha se necessário

-- 1. Corrigir função principal
CREATE OR REPLACE FUNCTION get_instance_owner_with_fallback(p_instance_id uuid, p_admin_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    result_user_id uuid;
BEGIN
    SELECT uwn.profile_id
    FROM public.user_whatsapp_numbers uwn
    INNER JOIN public.profiles p ON p.id = uwn.profile_id
    WHERE uwn.whatsapp_number_id = p_instance_id
      AND p.role = 'operational'::user_role
      AND p.created_by_user_id = p_admin_user_id
    ORDER BY p.created_at ASC
    LIMIT 1
    INTO result_user_id;
    
    IF result_user_id IS NULL THEN
        result_user_id := p_admin_user_id;
    END IF;
    
    RETURN result_user_id;
END;
$$;