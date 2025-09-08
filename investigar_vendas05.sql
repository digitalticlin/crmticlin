-- INVESTIGAR situação do vendas05@geuniformes.com.br

-- 1. Ver status no profiles
SELECT 
    id,
    full_name,
    email,
    linked_auth_user_id,
    invite_status,
    invite_token,
    created_at,
    invite_sent_at
FROM profiles 
WHERE email = 'vendas05@geuniformes.com.br';

-- 2. Ver se existe no Auth
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at
FROM auth.users 
WHERE email = 'vendas05@geuniformes.com.br';

-- 3. CORREÇÃO: Se o usuário já existe no Auth mas status está errado
-- Primeiro verifique os IDs acima, depois execute:
/*
UPDATE profiles 
SET 
    invite_status = 'accepted',
    linked_auth_user_id = '<<<COLE_O_ID_DO_AUTH_AQUI>>>',
    invite_token = NULL
WHERE email = 'vendas05@geuniformes.com.br';
*/

-- 4. Para TODOS os casos similares (usuários no Auth mas com invite_status errado)
SELECT 
    p.email,
    p.invite_status,
    p.linked_auth_user_id,
    a.id as auth_id,
    a.email_confirmed_at
FROM profiles p
LEFT JOIN auth.users a ON a.email = p.email
WHERE p.invite_status = 'invite_sent' 
AND a.id IS NOT NULL; -- Existe no Auth mas status está errado