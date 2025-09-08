-- SQL para verificar se o usuário nathirosa26@gmail.com foi totalmente removido

-- 1. Verificar auth.users
SELECT 'auth.users' as tabela, COUNT(*) as registros 
FROM auth.users 
WHERE email = 'nathirosa26@gmail.com';

-- 2. Verificar profiles
SELECT 'profiles' as tabela, COUNT(*) as registros 
FROM public.profiles 
WHERE email = 'nathirosa26@gmail.com';

-- 3. Busca detalhada se ainda existir algum registro
SELECT 'DETALHES auth.users' as tipo, id, email, created_at, raw_user_meta_data
FROM auth.users 
WHERE email = 'nathirosa26@gmail.com'
UNION ALL
SELECT 'DETALHES profiles' as tipo, id::text, email, created_at::text, invite_status::text
FROM public.profiles 
WHERE email = 'nathirosa26@gmail.com';

-- 4. Resultado esperado: todos devem retornar 0 registros