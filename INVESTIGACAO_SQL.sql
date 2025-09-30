-- ============================================
-- INVESTIGAÇÃO SQL - PROBLEMAS DE REGISTRO
-- Execute estas queries em sequência no Supabase
-- ============================================

-- ============================================
-- 1. INVESTIGAR TRIGGERS DE CRIAÇÃO DE FUNIL
-- ============================================

-- 1.1 Verificar TODOS os triggers que podem criar funil após insert em profiles
SELECT
    n.nspname as schema_name,
    c.relname as table_name,
    t.tgname as trigger_name,
    pg_get_triggerdef(t.oid) as trigger_definition,
    CASE t.tgenabled
        WHEN 'O' THEN 'ENABLED'
        WHEN 'D' THEN 'DISABLED'
        ELSE 'OTHER'
    END as trigger_status
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'profiles'
   AND NOT t.tgisinternal
   AND (pg_get_triggerdef(t.oid) ILIKE '%funil%'
        OR pg_get_triggerdef(t.oid) ILIKE '%funnel%'
        OR pg_get_triggerdef(t.oid) ILIKE '%kanban%')
ORDER BY t.tgname;

-- 1.2 Verificar se há mais de um trigger ativo na tabela profiles
SELECT
    n.nspname as schema_name,
    c.relname as table_name,
    t.tgname as trigger_name,
    CASE t.tgenabled
        WHEN 'O' THEN 'ENABLED'
        WHEN 'D' THEN 'DISABLED'
        ELSE 'UNKNOWN'
    END as status
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'profiles'
   AND NOT t.tgisinternal
ORDER BY t.tgname;

-- 1.3 Verificar se o funil foi criado para usuários de teste
SELECT
    p.email,
    p.full_name,
    p.selected_plan,
    p.role,
    f.id as funnel_id,
    f.name as funnel_name,
    f.created_at as funnel_created,
    COUNT(ks.id) as total_stages
FROM profiles p
LEFT JOIN funnels f ON f.created_by_user_id = p.id
LEFT JOIN kanban_stages ks ON ks.funnel_id = f.id
WHERE p.email LIKE '%@gmail.com%'  -- Ajuste para seu email de teste
GROUP BY p.id, p.email, p.full_name, p.selected_plan, p.role, f.id, f.name, f.created_at
ORDER BY p.created_at DESC
LIMIT 10;

-- 1.4 Listar TODAS as etapas do funil criado (como está estruturado)
SELECT
    p.email,
    f.name as funnel_name,
    ks.title as stage_name,
    ks.color,
    ks.order_position,
    ks.is_won,
    ks.is_lost,
    ks.is_fixed,
    ks.created_at as stage_created
FROM profiles p
JOIN funnels f ON f.created_by_user_id = p.id
JOIN kanban_stages ks ON ks.funnel_id = f.id
WHERE p.email LIKE '%@gmail.com%'  -- Seu email de teste
ORDER BY p.created_at DESC, ks.order_position;

-- ============================================
-- 2. DIAGNOSTICAR TRIGGER PROFILES PLANOS PAGOS
-- ============================================

-- 2.1 Verificar se usuário foi criado em auth.users mas não em profiles
SELECT
    au.id as auth_user_id,
    au.email as auth_email,
    au.created_at as auth_created,
    au.raw_user_meta_data->>'selected_plan' as auth_plan,
    au.raw_user_meta_data->>'full_name' as auth_name,
    au.confirmed_at,
    p.id as profile_id,
    p.email as profile_email,
    p.selected_plan as profile_plan,
    p.created_at as profile_created
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE au.email = 'inaciojrdossantos@gmail.com'  -- Seu email de teste
ORDER BY au.created_at DESC;

-- 2.2 Verificar status de TODOS os triggers relacionados ao registro
SELECT
    n.nspname as schema_name,
    c.relname as table_name,
    t.tgname as trigger_name,
    CASE t.tgenabled
        WHEN 'O' THEN 'ATIVO'
        WHEN 'D' THEN 'DESABILITADO'
        ELSE 'DESCONHECIDO'
    END as status
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE NOT t.tgisinternal
   AND (t.tgname IN (
        'handle_new_user_trigger',
        'trigger_activate_plan_on_register',
        'trigger_paid_plan_checkout_redirect'
    ) OR c.relname IN ('profiles', 'users'))
ORDER BY c.relname, t.tgname;

-- 2.3 Verificar se há registros em plan_subscriptions para planos pagos
SELECT
    ps.user_id,
    au.email,
    ps.plan_type,
    ps.status,
    ps.created_at,
    ps.mercadopago_preference_id,
    ps.member_limit,
    ps.current_period_start,
    ps.current_period_end
FROM plan_subscriptions ps
LEFT JOIN auth.users au ON au.id = ps.user_id
WHERE ps.plan_type IN ('pro_5k', 'ultra_15k')
   OR au.email = 'inaciojrdossantos@gmail.com'
ORDER BY ps.created_at DESC
LIMIT 10;

-- ============================================
-- 3. INVESTIGAR EDGE FUNCTION
-- ============================================

-- 3.1 Verificar se há registros de tentativa de checkout
SELECT
    ps.user_id,
    au.email,
    ps.plan_type,
    ps.status,
    ps.mercadopago_preference_id,
    ps.created_at as subscription_created,
    ps.updated_at as subscription_updated
FROM plan_subscriptions ps
LEFT JOIN auth.users au ON au.id = ps.user_id
WHERE au.email = 'inaciojrdossantos@gmail.com'
ORDER BY ps.created_at DESC;

-- 3.2 Verificar todos os registros de payment_history
SELECT
    ph.user_id,
    au.email,
    ph.payment_id,
    ph.status,
    ph.amount,
    ph.gateway,
    ph.created_at
FROM payment_history ph
LEFT JOIN auth.users au ON au.id = ph.user_id
WHERE au.email = 'inaciojrdossantos@gmail.com'
ORDER BY ph.created_at DESC
LIMIT 5;

-- ============================================
-- 4. VERIFICAR CONFIGURAÇÃO COMPLETA DO USUÁRIO
-- ============================================

-- 4.1 Obter ID e dados completos do usuário criado
SELECT
    au.id,
    au.email,
    au.created_at,
    au.confirmed_at,
    au.raw_user_meta_data->>'selected_plan' as selected_plan,
    au.raw_user_meta_data->>'full_name' as full_name,
    au.raw_user_meta_data->>'role' as role,
    -- Verificar se profile existe
    p.id as profile_exists,
    p.selected_plan as profile_plan,
    -- Verificar se tem plano ativo
    ps.status as plan_status,
    ps.plan_type as active_plan,
    -- Verificar se tem funil
    f.id as has_funnel
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
LEFT JOIN plan_subscriptions ps ON ps.user_id = au.id
LEFT JOIN funnels f ON f.created_by_user_id = au.id
WHERE au.email = 'inaciojrdossantos@gmail.com'
ORDER BY au.created_at DESC
LIMIT 1;

-- ============================================
-- 5. VERIFICAR FUNÇÕES QUE PODEM CRIAR FUNILS
-- ============================================

-- 5.1 Buscar todas as funções que mencionam 'funnel' ou 'funil'
SELECT
    routine_name as function_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
   AND (routine_definition ILIKE '%funnel%' OR routine_definition ILIKE '%funil%')
ORDER BY routine_name;

-- ============================================
-- INSTRUÇÕES DE EXECUÇÃO:
-- 1. Execute as queries em ordem
-- 2. Copie todos os resultados
-- 3. Preste atenção especial nas queries 1.2, 2.2 e 4.1
-- ============================================