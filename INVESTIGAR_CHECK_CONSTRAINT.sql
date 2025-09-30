-- ============================================
-- INVESTIGAR CHECK CONSTRAINT plan_subscriptions_status_check
-- ============================================

-- 1. Verificar constraint na tabela plan_subscriptions
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'plan_subscriptions'::regclass
  AND contype = 'c'  -- check constraint
  AND conname LIKE '%status%';

-- 2. Verificar estrutura da tabela plan_subscriptions
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'plan_subscriptions'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar valores válidos para status
SELECT DISTINCT status
FROM plan_subscriptions
ORDER BY status;

-- 4. Verificar se existe ENUM para status
SELECT
    enumlabel
FROM pg_enum
WHERE enumtypid = (
    SELECT oid
    FROM pg_type
    WHERE typname IN ('subscription_status', 'plan_status', 'status')
);

COMANDO 4 SEM RETORNO