-- Deletar apenas o usuário teste@teste.com

-- 1. Confirmar dados do usuário teste@teste.com
SELECT 
    'usuario_teste' as tipo,
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'teste@teste.com';

-- 2. Deletar apenas este usuário (ID: 9a80287c-f00c-454f-821c-b51efc09a25d)
-- Use a edge function delete_auth_user com este payload:
/*
{
  "user_id": "9a80287c-f00c-454f-821c-b51efc09a25d",
  "email": "teste@teste.com"
}
*/

-- 3. Verificar que foi deletado
SELECT 
    'confirmacao_delecao' as status,
    COUNT(*) as usuarios_restantes
FROM auth.users 
WHERE email = 'teste@teste.com';