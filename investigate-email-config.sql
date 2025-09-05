-- SQL PARA INVESTIGAR CONFIGURAÇÕES DE EMAIL NO SUPABASE
-- Execute estes comandos para entender como estão as configurações

-- =========================================
-- 1. VERIFICAR CONFIGURAÇÕES DE AUTH
-- =========================================

-- Verificar configurações de site URL e redirect URLs
SELECT 'Site URL Configuration' as info;

-- Verificar templates de email configurados (se acessível via SQL)
SELECT 'Email Templates Info' as info;

-- =========================================
-- 2. VERIFICAR DADOS DE CONVITES EXISTENTES
-- =========================================

-- Ver perfis com convites pendentes
SELECT 
    'Convites Pendentes' as status,
    id,
    full_name,
    email,
    invite_status,
    invite_sent_at,
    invite_token,
    linked_auth_user_id
FROM profiles 
WHERE invite_status IN ('pending', 'invite_sent')
ORDER BY invite_sent_at DESC;

-- Verificar se existem usuários duplicados
SELECT 
    'Usuários por Email' as info,
    email,
    COUNT(*) as quantidade,
    array_agg(id) as profile_ids,
    array_agg(invite_status) as statuses
FROM profiles 
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- =========================================
-- 3. VERIFICAR CONFIGURAÇÃO DE AUTH USERS
-- =========================================

-- Verificar conexão entre profiles e auth.users
SELECT 
    'Profiles vs Auth Users' as info,
    p.id as profile_id,
    p.full_name,
    p.email,
    p.invite_status,
    p.linked_auth_user_id,
    CASE 
        WHEN p.linked_auth_user_id IS NOT NULL THEN 'Linked'
        ELSE 'Not Linked'
    END as auth_status
FROM profiles p
WHERE p.created_by_user_id IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 10;

-- =========================================
-- 4. VERIFICAR FUNÇÃO ACCEPT_TEAM_INVITE_SAFELY
-- =========================================

-- Ver se a função existe
SELECT 
    'Function Info' as info,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name LIKE '%invite%'
AND routine_schema = 'public';

-- =========================================
-- 5. VERIFICAR CONFIGURAÇÕES DE DOMÍNIO/SMTP
-- =========================================

-- Tentar acessar configurações de autenticação (pode não funcionar por permissões)
SELECT 'Auth Config Check' as info;

-- =========================================
-- 6. TESTAR SITUAÇÃO ESPECÍFICA DE USUÁRIO CONVIDADO
-- =========================================

-- Ver último convite enviado
SELECT 
    'Último Convite' as info,
    id,
    full_name, 
    email,
    invite_status,
    invite_token,
    linked_auth_user_id,
    invite_sent_at,
    created_at
FROM profiles 
WHERE invite_token IS NOT NULL
ORDER BY invite_sent_at DESC NULLS LAST, created_at DESC
LIMIT 3;

-- Verificar se existem tokens expirados ou duplicados
SELECT 
    'Tokens de Convite' as info,
    invite_token,
    COUNT(*) as quantidade,
    array_agg(full_name) as nomes,
    array_agg(invite_status) as statuses
FROM profiles 
WHERE invite_token IS NOT NULL
GROUP BY invite_token
ORDER BY quantidade DESC;