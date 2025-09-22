-- ============================================
-- VERIFICAR ESTRUTURA DAS TABELAS
-- Data: 2025-09-22
-- ============================================

-- 1. VERIFICAR ESTRUTURA DA TABELA plan_subscriptions
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'plan_subscriptions'
ORDER BY ordinal_position;

-- 2. VERIFICAR ESTRUTURA DA TABELA free_trial_usage
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'free_trial_usage'
ORDER BY ordinal_position;

-- 3. VERIFICAR SE AS TABELAS EXISTEM
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('plan_subscriptions', 'free_trial_usage');

-- 4. VERIFICAR CONSTRAINTS E ÍNDICES
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.plan_subscriptions'::regclass;

-- 5. VERIFICAR DADOS EXISTENTES (se houver)
SELECT COUNT(*) as total_plan_subscriptions FROM public.plan_subscriptions;
SELECT COUNT(*) as total_free_trials FROM public.free_trial_usage;