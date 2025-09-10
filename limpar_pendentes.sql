-- Limpar todos os usuários pendentes de confirmação

-- 1. Ver quantos usuários pendentes existem
SELECT 
    'usuarios_pendentes' as status,
    COUNT(*) as total,
    array_agg(email) as emails
FROM auth.users 
WHERE email_confirmed_at IS NULL;

-- 2. Listar os IDs que serão deletados (para usar na edge function)
SELECT 
    'IDs_para_deletar' as tipo,
    id,
    email,
    created_at
FROM auth.users 
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- 3. Após confirmar, usar a edge function delete_auth_user para cada ID
-- Ou execute este comando direto (CUIDADO - só execute se tiver certeza):
/*
DELETE FROM auth.users 
WHERE email_confirmed_at IS NULL
AND created_at > '2025-07-01'::timestamp; -- Só usuários criados após julho
*/