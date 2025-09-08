-- SQL para listar todos os usuários em auth.users

SELECT 
    'usuarios_auth' as tipo,
    id,
    email,
    email_confirmed_at,
    created_at,
    CASE 
        WHEN email_confirmed_at IS NULL THEN 'PENDENTE'
        ELSE 'CONFIRMADO'
    END as status,
    raw_user_meta_data->>'is_invite' as is_invite_flag,
    raw_user_meta_data->>'full_name' as full_name
FROM auth.users 
ORDER BY created_at DESC;

-- Contar total de usuários
SELECT 
    'resumo' as tipo,
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as pendentes,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmados
FROM auth.users;