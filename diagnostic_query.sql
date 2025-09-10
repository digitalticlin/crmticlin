-- ====================================================================
-- DIAGNÓSTICO COMPLETO DO PROBLEMA DE TIMEOUT NA DELEÇÃO
-- ====================================================================
-- Execute este SQL diretamente no Supabase SQL Editor para investigar

-- 1. VERIFICAR SE O TRIGGER PROBLEMÁTICO EXISTE
SELECT 
    'TRIGGER CHECK' as type,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement,
    trigger_schema
FROM information_schema.triggers 
WHERE event_object_table = 'whatsapp_instances'
ORDER BY trigger_name;

-- 2. VERIFICAR ÍNDICES NA TABELA whatsapp_instances
SELECT 
    'INDEX CHECK' as type,
    indexname,
    indexdef,
    tablename
FROM pg_indexes 
WHERE tablename = 'whatsapp_instances'
ORDER BY indexname;

-- 3. VERIFICAR FOREIGN KEYS E CONSTRAINTS
SELECT 
    'CONSTRAINT CHECK' as type,
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'whatsapp_instances'
ORDER BY tc.constraint_name;

-- 4. VERIFICAR TRANSAÇÕES E LOCKS ATIVOS
SELECT 
    'ACTIVE LOCKS' as type,
    pid,
    query,
    state,
    query_start,
    wait_event_type,
    wait_event
FROM pg_stat_activity 
WHERE query ILIKE '%whatsapp_instances%'
   AND state != 'idle'
ORDER BY query_start DESC;

-- 5. VERIFICAR ESTATÍSTICAS E PERFORMANCE DA TABELA
SELECT 
    'TABLE STATS' as type,
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename = 'whatsapp_instances';

-- 6. VERIFICAR TAMANHO DA TABELA E FRAGMENTAÇÃO
SELECT 
    'TABLE SIZE' as type,
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables
WHERE tablename = 'whatsapp_instances';

-- 7. VERIFICAR CONFIGURAÇÕES DE TIMEOUT
SELECT 
    'TIMEOUT CONFIG' as type,
    name,
    setting,
    unit,
    context
FROM pg_settings 
WHERE name IN (
    'statement_timeout',
    'idle_in_transaction_session_timeout',
    'lock_timeout'
);

-- 8. TESTE DE PERFORMANCE - SIMULAR SELECT que seria executado antes do DELETE
EXPLAIN (ANALYZE, BUFFERS) 
SELECT *
FROM whatsapp_instances 
WHERE id = 'd4752160-37c3-4243-887a-5419465d0cd3'
  AND created_by_user_id IS NOT NULL;

-- 9. VERIFICAR SE HÁ DEPENDÊNCIAS QUE PODEM CAUSAR CASCATA
SELECT 
    'DEPENDENCIES' as type,
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'whatsapp_instances';

-- 10. RESUMO FINAL
SELECT 
    'SUMMARY' as type,
    'Diagnostic completed - Check results above' as message,
    NOW() as timestamp;