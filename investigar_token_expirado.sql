-- Investigar por que o token personalizado mostra "TOKEN EXPIRADO"

-- 1. Buscar profile com o token específico
SELECT 
    'profile_dados' as tipo,
    id,
    full_name,
    email,
    role,
    invite_status,
    invite_token,
    linked_auth_user_id,
    created_at,
    updated_at,
    (created_at + INTERVAL '24 hours') as expira_em,
    (NOW() > created_at + INTERVAL '24 hours') as esta_expirado
FROM public.profiles 
WHERE invite_token = '50cdf6ca-9b60-4d24-9757-fdc26a5b025b';

-- 2. Verificar se existe usuário correspondente em auth.users
SELECT 
    'auth_user_dados' as tipo,
    u.id,
    u.email,
    u.email_confirmed_at,
    u.confirmation_token,
    u.created_at,
    u.raw_user_meta_data->>'invite_token' as meta_invite_token,
    u.raw_user_meta_data->>'is_invite' as meta_is_invite
FROM auth.users u
JOIN public.profiles p ON p.email = u.email
WHERE p.invite_token = '50cdf6ca-9b60-4d24-9757-fdc26a5b025b';

-- 3. Verificar logs de erro (se existir tabela de logs)
SELECT 
    'status_geral' as tipo,
    'Buscando possíveis problemas...' as mensagem;