-- VERIFICAR se a função process_accepted_invite existe

-- 1. Verificar se função existe
SELECT 
    p.proname as function_name,
    p.prosrc as function_code,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'process_accepted_invite' AND n.nspname = 'public';

-- 2. Ver todas as funções que começam com 'process'
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE 'process%' AND n.nspname = 'public';

-- 3. Ver todas as funções relacionadas a convite
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE (p.proname LIKE '%invite%' OR p.proname LIKE '%accept%') 
AND n.nspname = 'public';

-- 4. Se não existir, verificar permissões para RPC
SELECT 
    has_function_privilege('public.process_accepted_invite(uuid,uuid,text)', 'EXECUTE') as can_execute,
    current_user as current_user_name;