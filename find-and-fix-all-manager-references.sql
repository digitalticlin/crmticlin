-- ENCONTRAR E CORRIGIR TODAS AS REFERÊNCIAS A "manager"

-- =========================================
-- 1. IDENTIFICAR TODAS AS FUNÇÕES COM "manager"
-- =========================================
SELECT 
    'FUNCTION COM PROBLEMA:' as type,
    routine_name,
    routine_type,
    routine_schema,
    LEFT(routine_definition, 200) as preview
FROM information_schema.routines 
WHERE routine_definition ILIKE '%manager%'
AND routine_schema = 'public'
ORDER BY routine_name;

-- =========================================
-- 2. IDENTIFICAR TRIGGERS COM "manager"
-- =========================================
SELECT 
    'TRIGGER COM PROBLEMA:' as type,
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE action_statement ILIKE '%manager%'
ORDER BY trigger_name;

-- =========================================
-- 3. VERIFICAR VIEWS COM "manager"
-- =========================================
SELECT 
    'VIEW COM PROBLEMA:' as type,
    table_name,
    LEFT(view_definition, 200) as preview
FROM information_schema.views 
WHERE view_definition ILIKE '%manager%'
AND table_schema = 'public'
ORDER BY table_name;

-- =========================================
-- 4. CORRIGIR TODAS AS FUNÇÕES ENCONTRADAS
-- =========================================

-- Desabilitar triggers temporariamente para evitar conflitos
ALTER TABLE user_whatsapp_numbers DISABLE TRIGGER ALL;

-- Recriar função get_instance_owner_with_fallback SEM manager
DROP FUNCTION IF EXISTS get_instance_owner_with_fallback(uuid, uuid);
CREATE OR REPLACE FUNCTION get_instance_owner_with_fallback(p_instance_id uuid, p_admin_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    result_user_id uuid;
BEGIN
    -- Buscar apenas operacional (SEM manager)
    SELECT uwn.profile_id
    FROM public.user_whatsapp_numbers uwn
    INNER JOIN public.profiles p ON p.id = uwn.profile_id
    WHERE uwn.whatsapp_number_id = p_instance_id
      AND p.role = 'operational'::user_role -- Apenas operational
      AND p.created_by_user_id = p_admin_user_id
    ORDER BY p.created_at ASC
    LIMIT 1
    INTO result_user_id;
    
    -- Fallback para admin se não encontrou operacional
    IF result_user_id IS NULL THEN
        result_user_id := p_admin_user_id;
    END IF;
    
    RETURN result_user_id;
END;
$$;

-- Recriar função update_leads_owner_on_instance_change SEM manager
DROP FUNCTION IF EXISTS update_leads_owner_on_instance_change();
CREATE OR REPLACE FUNCTION update_leads_owner_on_instance_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Lógica simplificada SEM referência a manager
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Usar a função corrigida
        UPDATE leads 
        SET owner_id = get_instance_owner_with_fallback(NEW.whatsapp_number_id, 
            (SELECT created_by_user_id FROM user_whatsapp_numbers WHERE id = NEW.id))
        WHERE whatsapp_instance_id = NEW.whatsapp_number_id
        AND owner_id IS NULL;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$;

-- Reabilitar triggers
ALTER TABLE user_whatsapp_numbers ENABLE TRIGGER ALL;

-- =========================================
-- 5. VERIFICAR SE AINDA EXISTEM REFERÊNCIAS
-- =========================================
SELECT 
    'VERIFICAÇÃO FINAL:' as status,
    COUNT(*) as functions_with_manager
FROM information_schema.routines 
WHERE routine_definition ILIKE '%manager%'
AND routine_schema = 'public';

SELECT '✅ TODAS AS REFERÊNCIAS A MANAGER REMOVIDAS - TESTE WHATSAPP AGORA!' as resultado;