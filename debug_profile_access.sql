-- DEBUG: Investigar problema de acesso ao profile

-- 1. Verificar se profile existe
SELECT 
    id,
    full_name,
    email,
    role,
    linked_auth_user_id,
    invite_status,
    created_by_user_id
FROM profiles 
WHERE id = '192cb40b-0d99-47a2-9c5f-48e371a9aa9d'
   OR linked_auth_user_id = '192cb40b-0d99-47a2-9c5f-48e371a9aa9d'
   OR email = 'nathirosa26@gmail.com';

-- 2. Verificar políticas RLS na tabela profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 3. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE tablename = 'profiles' AND schemaname = 'public';

-- 4. Testar acesso direto como service_role
SET ROLE service_role;
SELECT 'Service Role Test' as test, count(*) as total FROM profiles;
RESET ROLE;