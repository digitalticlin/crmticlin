-- ====================================================================
-- SCRIPT PARA REMOVER TODOS OS RECURSOS DE BROADCAST DO BANCO DE DADOS
-- ====================================================================
-- ATENÇÃO: Este script irá DELETAR permanentemente todos os recursos
-- relacionados a broadcast. Execute com cuidado!
-- ====================================================================

BEGIN;

-- 1. DESABILITAR TRIGGERS TEMPORARIAMENTE (para evitar problemas de cascade)
SET session_replication_role = replica;

-- 2. DROPAR TODAS AS POLICIES (RLS) RELACIONADAS A BROADCAST
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename, policyname
        FROM pg_policies
        WHERE tablename LIKE '%broadcast%'
           OR policyname LIKE '%broadcast%'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I CASCADE', r.policyname, r.tablename);
        RAISE NOTICE 'Dropped policy: % on table %', r.policyname, r.tablename;
    END LOOP;
END $$;

-- 3. DROPAR TODOS OS TRIGGERS RELACIONADOS A BROADCAST
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT trigger_schema, trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE trigger_name LIKE '%broadcast%'
           OR event_object_table LIKE '%broadcast%'
    ) LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I CASCADE',
            r.trigger_name, r.trigger_schema, r.event_object_table);
        RAISE NOTICE 'Dropped trigger: % on table %', r.trigger_name, r.event_object_table;
    END LOOP;
END $$;

-- 4. DROPAR TODAS AS FUNÇÕES/PROCEDURES RELACIONADAS A BROADCAST
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT n.nspname as schema, p.proname as function_name,
               pg_get_function_identity_arguments(p.oid) as arguments
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname LIKE '%broadcast%'
    ) LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE',
            r.schema, r.function_name, r.arguments);
        RAISE NOTICE 'Dropped function: %.%', r.schema, r.function_name;
    END LOOP;
END $$;

-- 5. DROPAR FOREIGN KEYS QUE REFERENCIAM TABELAS DE BROADCAST
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tc.table_schema, tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND (tc.table_name LIKE '%broadcast%'
           OR ccu.table_name LIKE '%broadcast%')
    ) LOOP
        EXECUTE format('ALTER TABLE IF EXISTS %I.%I DROP CONSTRAINT IF EXISTS %I CASCADE',
            r.table_schema, r.table_name, r.constraint_name);
        RAISE NOTICE 'Dropped FK constraint: % on table %', r.constraint_name, r.table_name;
    END LOOP;
END $$;

-- 6. DROPAR TODAS AS VIEWS RELACIONADAS A BROADCAST
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, viewname
        FROM pg_views
        WHERE viewname LIKE '%broadcast%'
    ) LOOP
        EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', r.schemaname, r.viewname);
        RAISE NOTICE 'Dropped view: %', r.viewname;
    END LOOP;
END $$;

-- 7. DROPAR TODAS AS TABELAS RELACIONADAS A BROADCAST
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE tablename LIKE '%broadcast%'
        ORDER BY tablename DESC  -- Ordem reversa para evitar problemas de dependência
    ) LOOP
        EXECUTE format('DROP TABLE IF EXISTS %I.%I CASCADE', r.schemaname, r.tablename);
        RAISE NOTICE 'Dropped table: %', r.tablename;
    END LOOP;
END $$;

-- 8. DROPAR SEQUENCES RELACIONADAS A BROADCAST
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, sequencename
        FROM pg_sequences
        WHERE sequencename LIKE '%broadcast%'
    ) LOOP
        EXECUTE format('DROP SEQUENCE IF EXISTS %I.%I CASCADE', r.schemaname, r.sequencename);
        RAISE NOTICE 'Dropped sequence: %', r.sequencename;
    END LOOP;
END $$;

-- 9. DROPAR ÍNDICES ÓRFÃOS (se houver)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, indexname
        FROM pg_indexes
        WHERE indexname LIKE '%broadcast%'
          AND tablename NOT LIKE '%broadcast%'  -- Apenas índices órfãos
    ) LOOP
        EXECUTE format('DROP INDEX IF EXISTS %I.%I CASCADE', r.schemaname, r.indexname);
        RAISE NOTICE 'Dropped index: %', r.indexname;
    END LOOP;
END $$;

-- 10. LIMPAR COLUNAS DE REFERÊNCIA A BROADCAST EM OUTRAS TABELAS
-- ATENÇÃO: Esta seção precisa ser personalizada manualmente!
-- Liste abaixo as tabelas que têm colunas FK para broadcast:

-- Exemplo (descomente e ajuste conforme necessário):
-- ALTER TABLE public.some_table DROP COLUMN IF EXISTS broadcast_campaign_id CASCADE;

-- 11. REABILITAR TRIGGERS
SET session_replication_role = DEFAULT;

-- 12. VERIFICAÇÃO FINAL - Listar recursos restantes
SELECT 'Remaining tables:' as check_type, tablename as name
FROM pg_tables
WHERE tablename LIKE '%broadcast%'
UNION ALL
SELECT 'Remaining functions:', p.proname
FROM pg_proc p
WHERE p.proname LIKE '%broadcast%'
UNION ALL
SELECT 'Remaining views:', viewname
FROM pg_views
WHERE viewname LIKE '%broadcast%';

COMMIT;

-- ====================================================================
-- FIM DO SCRIPT
-- ====================================================================
-- IMPORTANTE: Execute o script list_broadcast_resources.sql ANTES
-- deste script para ter um backup completo de todos os recursos.
-- ====================================================================
