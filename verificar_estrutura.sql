-- ============================================
-- VERIFICAR ESTRUTURA DAS TABELAS
-- Execute este SQL primeiro para ver as colunas
-- ============================================

-- 1. ESTRUTURA DA TABELA plan_subscriptions
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'plan_subscriptions'
ORDER BY ordinal_position;

-- 2. ESTRUTURA DA TABELA free_trial_usage
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'free_trial_usage'
ORDER BY ordinal_position;