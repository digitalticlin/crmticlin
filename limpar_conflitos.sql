-- SQL para limpar qualquer usuário conflitante para o email nathirosa26@gmail.com

-- 1. Verificar se existe algum usuário com este email em auth.users
SELECT 
    id,
    email,
    created_at,
    raw_user_meta_data->>'is_invite' as is_invite_flag
FROM auth.users 
WHERE email = 'nathirosa26@gmail.com';

-- 2. Verificar se existe algum profile com este email
SELECT 
    id,
    email,
    full_name,
    role,
    invite_status,
    invite_token,
    linked_auth_user_id
FROM public.profiles 
WHERE email = 'nathirosa26@gmail.com';

-- 3. Se existir algum registro, execute os comandos de limpeza abaixo:

-- LIMPEZA (só execute se encontrar registros acima):
/*
-- Deletar profile se existir
DELETE FROM public.profiles WHERE email = 'nathirosa26@gmail.com';

-- Para deletar do auth.users, use a edge function delete_auth_user 
-- Ou execute este RPC se disponível:
-- SELECT auth.admin_delete_user('[USER_ID_AQUI]');
*/

-- 4. Após limpeza, confirmar que está limpo:
SELECT 'auth.users' as tabela, COUNT(*) as registros FROM auth.users WHERE email = 'nathirosa26@gmail.com'
UNION ALL
SELECT 'profiles' as tabela, COUNT(*) as registros FROM public.profiles WHERE email = 'nathirosa26@gmail.com';