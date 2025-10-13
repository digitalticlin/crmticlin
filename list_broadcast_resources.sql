-- ====================================================================
-- SCRIPT PARA LISTAR TODOS OS RECURSOS DE BROADCAST NO BANCO DE DADOS
-- ====================================================================

-- 1. LISTAR TODAS AS TABELAS RELACIONADAS A BROADCAST
SELECT
    'TABLE' as resource_type,
    schemaname,
    tablename as resource_name,
    tableowner as owner
FROM pg_tables
WHERE tablename LIKE '%broadcast%'
ORDER BY tablename;

-- 2. LISTAR TODAS AS VIEWS RELACIONADAS A BROADCAST
SELECT
    'VIEW' as resource_type,
    schemaname,
    viewname as resource_name,
    viewowner as owner
FROM pg_views
WHERE viewname LIKE '%broadcast%'
ORDER BY viewname;

-- 3. LISTAR TODAS AS FUNÇÕES/PROCEDURES RELACIONADAS A BROADCAST
SELECT
    'FUNCTION' as resource_type,
    n.nspname as schema,
    p.proname as resource_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '%broadcast%'
ORDER BY p.proname;

-- 4. LISTAR TODOS OS TRIGGERS RELACIONADOS A BROADCAST
SELECT
    'TRIGGER' as resource_type,
    trigger_schema,
    trigger_name as resource_name,
    event_object_table as table_name,
    action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%broadcast%'
   OR event_object_table LIKE '%broadcast%'
ORDER BY trigger_name;

-- 5. LISTAR TODAS AS POLICIES (RLS) RELACIONADAS A BROADCAST
SELECT
    'POLICY' as resource_type,
    schemaname,
    tablename,
    policyname as resource_name,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename LIKE '%broadcast%'
   OR policyname LIKE '%broadcast%'
ORDER BY tablename, policyname;

-- 6. LISTAR ÍNDICES RELACIONADOS A BROADCAST
SELECT
    'INDEX' as resource_type,
    schemaname,
    tablename,
    indexname as resource_name,
    indexdef
FROM pg_indexes
WHERE tablename LIKE '%broadcast%'
   OR indexname LIKE '%broadcast%'
ORDER BY indexname;

-- 7. LISTAR FOREIGN KEYS QUE REFERENCIAM TABELAS DE BROADCAST
SELECT
    'FOREIGN_KEY' as resource_type,
    tc.table_schema,
    tc.table_name,
    tc.constraint_name as resource_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (tc.table_name LIKE '%broadcast%'
   OR ccu.table_name LIKE '%broadcast%')
ORDER BY tc.table_name;

-- 8. LISTAR SEQUENCES RELACIONADAS A BROADCAST
SELECT
    'SEQUENCE' as resource_type,
    schemaname,
    sequencename as resource_name,
    last_value,
    start_value,
    increment_by
FROM pg_sequences
WHERE sequencename LIKE '%broadcast%'
ORDER BY sequencename;

-- 9. VERIFICAR COLUNAS EM OUTRAS TABELAS QUE FAZEM REFERÊNCIA A BROADCAST
SELECT DISTINCT
    'COLUMN_REFERENCE' as resource_type,
    table_schema,
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE (column_name LIKE '%broadcast%'
   OR table_name LIKE '%broadcast%')
  AND table_schema = 'public'
ORDER BY table_name, column_name;

-- 10. LISTAR EXTENSÕES/DEPENDENCIES
SELECT DISTINCT
    'DEPENDENCY' as resource_type,
    objid::regclass as dependent_object,
    refobjid::regclass as referenced_object,
    deptype
FROM pg_depend d
JOIN pg_class c ON d.objid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname LIKE '%broadcast%'
   OR refobjid::regclass::text LIKE '%broadcast%'
ORDER BY dependent_object;
