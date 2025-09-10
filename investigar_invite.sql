-- SQL para investigar o comportamento do inviteUserByEmail()

-- 1. Verificar tabelas disponíveis no schema auth
SELECT 
    'tabelas_auth' as tipo,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'auth'
ORDER BY table_name;

-- 2. Verificar se existem usuários pendentes de confirmação
SELECT 
    'usuarios_pendentes' as tipo,
    id,
    email,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    created_at,
    raw_user_meta_data->>'is_invite' as is_invite_flag,
    raw_user_meta_data->>'invite_token' as custom_invite_token
FROM auth.users 
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- 3. Verificar templates de email (se existir tabela)
SELECT 
    'email_templates' as tipo,
    *
FROM information_schema.tables 
WHERE table_schema = 'auth' 
AND table_name LIKE '%template%' OR table_name LIKE '%mail%';

-- 4. Verificar se há alguma função relacionada a convites
SELECT 
    'funcoes_invite' as tipo,
    proname as nome_funcao,
    proargnames as argumentos
FROM pg_proc 
WHERE proname ILIKE '%invite%' OR prosrc ILIKE '%invite%'
ORDER BY proname;

-- 5. Verificar logs da função (se existir tabela de logs)
SELECT 
    'logs_functions' as tipo,
    *
FROM information_schema.tables 
WHERE table_schema IN ('public', 'auth', 'supabase_functions')
AND table_name ILIKE '%log%';

-- 6. Verificar configurações específicas do Auth
SELECT 
    'auth_settings' as tipo,
    n.nspname as schema_name,
    c.relname as table_name,
    a.attname as coluna,
    t.typname as tipo
FROM pg_attribute a
JOIN pg_type t ON a.atttypid = t.oid
JOIN pg_class c ON a.attrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' 
AND c.relname IN ('users', 'instances')
AND a.attnum > 0
AND NOT a.attisdropped
ORDER BY c.relname, a.attname;