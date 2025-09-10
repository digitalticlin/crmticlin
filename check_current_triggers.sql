-- Verificar triggers ativos na instância production
SELECT 
    trigger_name,
    event_object_table,
    action_statement,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created'
   OR trigger_name LIKE '%new_user%'
   OR trigger_name LIKE '%invite%'
ORDER BY trigger_name;

-- Verificar se handle_new_user ainda está ativa
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'handle_new_user';