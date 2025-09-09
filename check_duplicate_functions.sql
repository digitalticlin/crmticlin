-- =====================================================
-- 🔍 VERIFICAÇÃO COMPLETA DE FUNÇÕES DUPLICADAS
-- =====================================================
-- Execute no Supabase SQL Editor para identificar interferências

-- 1. LISTAR TODAS AS FUNÇÕES RELACIONADAS A WHATSAPP/MESSAGE
SELECT 
    routine_name,
    routine_type,
    data_type as return_type,
    routine_definition IS NOT NULL as has_definition,
    specific_name,
    created as created_date
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (
    routine_name ILIKE '%whatsapp%' 
    OR routine_name ILIKE '%message%'
    OR routine_name ILIKE '%save%'
)
ORDER BY routine_name, specific_name;

-- 2. VERIFICAR ESPECIFICAMENTE FUNÇÕES save_whatsapp_message*
SELECT 
    routine_name,
    routine_type,
    data_type as return_type,
    specific_name,
    CASE WHEN routine_definition IS NOT NULL THEN 'HAS_DEFINITION' ELSE 'NO_DEFINITION' END as status,
    LENGTH(routine_definition) as definition_length
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%save_whatsapp_message%'
ORDER BY routine_name;

-- 3. OBTER ASSINATURAS (PARÂMETROS) DE TODAS AS VERSÕES
SELECT 
    r.routine_name,
    r.specific_name,
    STRING_AGG(
        p.parameter_name || ' ' || p.data_type || 
        CASE WHEN p.parameter_default IS NOT NULL THEN ' DEFAULT ' || p.parameter_default ELSE '' END,
        ', ' ORDER BY p.ordinal_position
    ) as parameters
FROM information_schema.routines r
LEFT JOIN information_schema.parameters p ON r.specific_name = p.specific_name
WHERE r.routine_schema = 'public' 
AND r.routine_name LIKE '%save_whatsapp_message%'
GROUP BY r.routine_name, r.specific_name
ORDER BY r.routine_name;

-- 4. VERIFICAR SE HÁ MÚLTIPLAS VERSÕES COM OVERLOADING
SELECT 
    routine_name,
    COUNT(*) as versions_count,
    STRING_AGG(specific_name, ', ') as all_versions
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%save_whatsapp_message%'
GROUP BY routine_name
HAVING COUNT(*) > 1;  -- Mostrar apenas se há duplicatas

-- 5. VERIFICAR TRIGGERS QUE POSSAM ESTAR CHAMANDO OUTRAS FUNÇÕES
SELECT 
    trigger_name,
    event_object_table,
    trigger_schema,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND (
    action_statement ILIKE '%save_whatsapp_message%'
    OR action_statement ILIKE '%whatsapp%'
    OR event_object_table IN ('messages', 'leads', 'whatsapp_instances')
);

-- 6. VERIFICAR PROCEDURES/FUNCTIONS QUE CHAMAM save_whatsapp_message
SELECT 
    routine_name,
    routine_type,
    CASE WHEN routine_definition ILIKE '%save_whatsapp_message%' THEN 'CALLS_SAVE_FUNCTION' ELSE 'NO_CALLS' END as calls_save_function
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_definition ILIKE '%save_whatsapp_message%'
AND routine_name NOT LIKE '%save_whatsapp_message%';  -- Excluir a própria função

-- 7. VERIFICAR RLS (ROW LEVEL SECURITY) POLICIES QUE PODEM INTERFERIR
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('messages', 'leads', 'whatsapp_instances');

-- 8. VERIFICAR ÚLTIMAS EXECUÇÕES DA FUNÇÃO (SE HOUVER LOG)
-- Esta query pode não funcionar dependendo das configurações de log
SELECT 
    schemaname,
    funcname,
    calls,
    total_time,
    mean_time,
    self_time,
    mean_self_time
FROM pg_stat_user_functions 
WHERE schemaname = 'public'
AND funcname LIKE '%save_whatsapp_message%';

-- 9. TESTE PRÁTICO: CHAMAR A FUNÇÃO E VER QUAL É EXECUTADA
-- DESCOMENTE E SUBSTITUA OS VALORES PARA TESTAR
/*
SELECT 
    'TESTE_FUNCAO' as teste,
    save_whatsapp_message_service_role(
        'test_instance_id'::text,
        '5562999999999@c.us'::text,
        'Mensagem de teste para verificar função'::text,
        false::boolean,
        'text'::text,
        null::text,
        ('test_msg_' || extract(epoch from now()))::text,
        'Nome Perfil Teste'::text,  -- Deve ser IGNORADO
        null::text
    ) as resultado;
*/

-- 10. VERIFICAR GRANTS/PERMISSÕES DA FUNÇÃO
SELECT 
    routine_name,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
AND routine_name LIKE '%save_whatsapp_message%';