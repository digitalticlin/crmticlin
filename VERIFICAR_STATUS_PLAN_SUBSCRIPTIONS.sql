-- ============================================
-- VERIFICAÇÃO RÁPIDA DE STATUS VÁLIDOS
-- Execute APENAS estas queries para descobrir os valores
-- ============================================

-- Query 1: Ver constraint de status
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'plan_subscriptions'::regclass
  AND contype = 'c'
  AND conname LIKE '%status%';

-- Query 2: Ver registros existentes (se houver)
SELECT DISTINCT status
FROM plan_subscriptions
ORDER BY status;

-- Query 3: Ver se status é ENUM
SELECT
    t.typname,
    e.enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname LIKE '%status%' OR t.typname LIKE '%subscription%'
ORDER BY t.typname, e.enumsortorder;