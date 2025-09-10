-- FASE 1: CORRIGIR FUNCTIONS QUE REFERENCIAM "manager"

-- 1. Identificar functions com problema
SELECT 
    routine_name,
    routine_type,
    routine_schema
FROM information_schema.routines 
WHERE routine_definition ILIKE '%manager%'
AND routine_schema = 'public';

-- 2. Corrigir função get_instance_owner_with_fallback
CREATE OR REPLACE FUNCTION get_instance_owner_with_fallback(p_instance_id uuid, p_admin_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    result_user_id uuid;
BEGIN
    -- Buscar operacional vinculado à instância
    SELECT uwn.profile_id
    FROM public.user_whatsapp_numbers uwn
    INNER JOIN public.profiles p ON p.id = uwn.profile_id
    WHERE uwn.whatsapp_number_id = p_instance_id
      AND p.role = 'operational' -- Apenas operacional (sem manager)
      AND p.created_by_user_id = p_admin_user_id
    ORDER BY p.created_at ASC
    LIMIT 1
    INTO result_user_id;
    
    -- Se não encontrou operacional, retorna o admin
    IF result_user_id IS NULL THEN
        result_user_id := p_admin_user_id;
    END IF;
    
    RETURN result_user_id;
END;
$$;

-- 3. Corrigir trigger update_leads_owner_on_instance_change se existir
CREATE OR REPLACE FUNCTION update_leads_owner_on_instance_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Lógica sem referência a "manager"
    -- Usar apenas 'admin' e 'operational'
    
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Atualizar owner_id dos leads baseado na nova vinculação
        UPDATE leads 
        SET owner_id = NEW.profile_id
        WHERE whatsapp_instance_id = NEW.whatsapp_number_id
        AND owner_id IS NULL; -- Apenas leads sem owner
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$;

SELECT '✅ Functions corrigidas - agora teste WhatsApp assignments' as status;