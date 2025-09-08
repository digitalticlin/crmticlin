-- Comandos para deletar usuários de teste via edge function delete_auth_user

-- 1. Usuário: teste@teste.com
-- ID: 9a80287c-f00c-454f-821c-b51efc09a25d
/*
Payload para edge function delete_auth_user:
{
  "user_id": "9a80287c-f00c-454f-821c-b51efc09a25d",
  "email": "teste@teste.com"
}
*/

-- 2. Usuário: umarketing506@gmail.com  
-- ID: bc263276-3c13-4571-b293-31e72e49b76d
/*
Payload para edge function delete_auth_user:
{
  "user_id": "bc263276-3c13-4571-b293-31e72e49b76d",
  "email": "umarketing506@gmail.com"
}
*/

-- 3. Usuário: inaciodomrua@gmail.com
-- ID: 2c490521-8bf9-425f-973d-4759ed6959cd
/*
Payload para edge function delete_auth_user:
{
  "user_id": "2c490521-8bf9-425f-973d-4759ed6959cd",
  "email": "inaciodomrua@gmail.com"
}
*/

-- 4. Comando para verificar após as exclusões
SELECT 
    'usuarios_restantes' as tipo,
    COUNT(*) as total,
    string_agg(email, ', ') as emails_restantes
FROM auth.users 
WHERE email IN ('teste@teste.com', 'umarketing506@gmail.com', 'inaciodomrua@gmail.com');