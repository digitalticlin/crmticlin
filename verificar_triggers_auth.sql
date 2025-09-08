-- Verificar todos os triggers na tabela auth.users
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing,
    action_condition
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- Verificar funções relacionadas a convites
SELECT 
    p.proname as function_name,
    p.prosrc as function_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (p.proname LIKE '%invite%' OR p.proname LIKE '%handle%user%')
ORDER BY p.proname;

-- Verificar se existe função handle_invite_acceptance
SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'handle_invite_acceptance' AND n.nspname = 'public'
) as function_exists;