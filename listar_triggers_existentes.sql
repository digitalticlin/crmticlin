-- Listar TODOS os triggers na tabela auth.users
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    action_condition
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- Listar TODAS as funções relacionadas a usuários/convites
SELECT 
    p.proname as function_name,
    n.nspname as schema_name,
    pg_get_function_result(p.oid) as return_type,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    p.proname LIKE '%user%' OR 
    p.proname LIKE '%invite%' OR 
    p.proname LIKE '%handle%'
  )
ORDER BY p.proname;

-- Verificar especificamente as funções mais importantes
SELECT 
    p.proname,
    CASE 
        WHEN p.proname = 'handle_new_user' THEN '✅ Principal'
        WHEN p.proname LIKE '%invite%' THEN '🎯 Convite'
        ELSE '📝 Outros'
    END as tipo
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'handle_new_user', 
    'handle_invite_acceptance',
    'process_invite_on_signup'
  )
ORDER BY p.proname;