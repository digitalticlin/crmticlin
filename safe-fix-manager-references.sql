-- CORREÇÃO SEGURA SEM DESABILITAR TRIGGERS DO SISTEMA

-- =========================================
-- 1. IDENTIFICAR FUNÇÕES COM "manager"
-- =========================================
SELECT 
    routine_name,
    routine_type,
    LEFT(routine_definition, 500) as preview
FROM information_schema.routines 
WHERE routine_definition ILIKE '%manager%'
AND routine_schema = 'public'
ORDER BY routine_name;

-- =========================================
-- 2. CORRIGIR FUNÇÃO get_instance_owner_with_fallback
-- =========================================
CREATE OR REPLACE FUNCTION get_instance_owner_with_fallback(p_instance_id uuid, p_admin_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    result_user_id uuid;
BEGIN
    -- Buscar apenas 'operational' (SEM 'manager')
    SELECT uwn.profile_id
    FROM public.user_whatsapp_numbers uwn
    INNER JOIN public.profiles p ON p.id = uwn.profile_id
    WHERE uwn.whatsapp_number_id = p_instance_id
      AND p.role = 'operational'::user_role -- APENAS operational
      AND p.created_by_user_id = p_admin_user_id
    ORDER BY p.created_at ASC
    LIMIT 1
    INTO result_user_id;
    
    -- Se não encontrou operacional, retorna admin
    IF result_user_id IS NULL THEN
        result_user_id := p_admin_user_id;
    END IF;
    
    RETURN result_user_id;
END;
$$;

-- =========================================
-- 3. VERIFICAR SE AINDA EXISTEM OUTRAS FUNÇÕES
-- =========================================
SELECT 
    'Funções restantes com manager:' as info,
    routine_name
FROM information_schema.routines 
WHERE routine_definition ILIKE '%manager%'
AND routine_schema = 'public'
AND routine_name != 'get_instance_owner_with_fallback';

-- =========================================
-- 4. TESTE SIMPLES DE INSERT DIRETO
-- =========================================
-- Teste direto para ver se o erro persiste
SELECT 'Testando insert direto...' as status;

-- Limpar dados existentes
DELETE FROM user_whatsapp_numbers 
WHERE profile_id = '6a7826d5-aed7-42aa-a660-4e3dc7b44fc2'
AND whatsapp_number_id = 'c3b6cfe7-bc4e-4b1f-9f18-4573f4232785';

-- Tentar insert direto
INSERT INTO user_whatsapp_numbers (profile_id, whatsapp_number_id, created_by_user_id)
VALUES (
    '6a7826d5-aed7-42aa-a660-4e3dc7b44fc2',
    'c3b6cfe7-bc4e-4b1f-9f18-4573f4232785',
    '712e7708-2299-4a00-9128-577c8f113ca4'
);

-- Verificar se foi inserido
SELECT 'INSERT bem-sucedido:' as resultado, profile_id, whatsapp_number_id
FROM user_whatsapp_numbers 
WHERE profile_id = '6a7826d5-aed7-42aa-a660-4e3dc7b44fc2'
AND whatsapp_number_id = 'c3b6cfe7-bc4e-4b1f-9f18-4573f4232785';

SELECT '✅ Se chegou até aqui, o problema foi resolvido!' as status_final;