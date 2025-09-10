-- DEBUGAR: Ver se usuário existe no Auth para Nathi

-- 1. Ver dados completos do profile da Nathi
SELECT 
    id,
    full_name,
    email,
    linked_auth_user_id,
    invite_status,
    invite_token
FROM profiles 
WHERE email = 'nathirosa26@gmail.com';

-- 2. Se linked_auth_user_id existir, verificar se usuario existe no auth
-- (Esta query só funciona se tivermos acesso a auth.users - pode dar erro)
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE email = 'nathirosa26@gmail.com';

-- 3. Resetar profile da Nathi para testar limpamente
UPDATE profiles 
SET 
    linked_auth_user_id = NULL,
    invite_status = 'invite_sent',
    invite_token = '0612826f-d353-4156-8189-d7c4d5b95f73'::uuid  -- ← FORÇAR conversão para UUID
WHERE email = 'nathirosa26@gmail.com';

-- 4. Verificar se funcionou
SELECT 
    id,
    full_name,
    email,
    linked_auth_user_id,
    invite_status,
    invite_token,
    pg_typeof(invite_token) as token_type
FROM profiles 
WHERE email = 'nathirosa26@gmail.com';