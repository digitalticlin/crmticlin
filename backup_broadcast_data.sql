-- ====================================================================
-- SCRIPT DE BACKUP DOS DADOS DE BROADCAST
-- ====================================================================
-- Execute ANTES de rodar o script drop_broadcast_SAFE.sql
-- Este script cria tabelas temporárias com os dados existentes
-- ====================================================================

BEGIN;

RAISE NOTICE '==================================================';
RAISE NOTICE 'INICIANDO BACKUP DOS DADOS DE BROADCAST';
RAISE NOTICE '==================================================';

-- ====================================================================
-- CRIAR SCHEMA TEMPORÁRIO PARA BACKUP
-- ====================================================================
CREATE SCHEMA IF NOT EXISTS broadcast_backup;

RAISE NOTICE '✓ Schema broadcast_backup criado';

-- ====================================================================
-- BACKUP DAS TABELAS
-- ====================================================================

-- Backup: broadcast_campaigns
CREATE TABLE broadcast_backup.broadcast_campaigns AS
SELECT * FROM public.broadcast_campaigns;

SELECT COUNT(*) as campaigns_backed_up
FROM broadcast_backup.broadcast_campaigns;

RAISE NOTICE '✓ Backup de broadcast_campaigns concluído';

-- Backup: broadcast_queue
CREATE TABLE broadcast_backup.broadcast_queue AS
SELECT * FROM public.broadcast_queue;

SELECT COUNT(*) as queue_backed_up
FROM broadcast_backup.broadcast_queue;

RAISE NOTICE '✓ Backup de broadcast_queue concluído';

-- Backup: broadcast_history
CREATE TABLE broadcast_backup.broadcast_history AS
SELECT * FROM public.broadcast_history;

SELECT COUNT(*) as history_backed_up
FROM broadcast_backup.broadcast_history;

RAISE NOTICE '✓ Backup de broadcast_history concluído';

-- Backup: broadcast_rate_limits
CREATE TABLE broadcast_backup.broadcast_rate_limits AS
SELECT * FROM public.broadcast_rate_limits;

SELECT COUNT(*) as rate_limits_backed_up
FROM broadcast_backup.broadcast_rate_limits;

RAISE NOTICE '✓ Backup de broadcast_rate_limits concluído';

-- ====================================================================
-- BACKUP DAS DEFINIÇÕES (DDL)
-- ====================================================================

-- Salvar definições das funções
CREATE TABLE broadcast_backup.functions_backup AS
SELECT
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition,
    pg_get_function_identity_arguments(p.oid) as arguments,
    NOW() as backed_up_at
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '%broadcast%'
  AND n.nspname = 'public';

RAISE NOTICE '✓ Backup de definições de funções concluído';

-- ====================================================================
-- ESTATÍSTICAS DO BACKUP
-- ====================================================================

RAISE NOTICE '==================================================';
RAISE NOTICE 'ESTATÍSTICAS DO BACKUP';
RAISE NOTICE '==================================================';

DO $$
DECLARE
    v_campaigns INTEGER;
    v_queue INTEGER;
    v_history INTEGER;
    v_rate_limits INTEGER;
    v_functions INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_campaigns FROM broadcast_backup.broadcast_campaigns;
    SELECT COUNT(*) INTO v_queue FROM broadcast_backup.broadcast_queue;
    SELECT COUNT(*) INTO v_history FROM broadcast_backup.broadcast_history;
    SELECT COUNT(*) INTO v_rate_limits FROM broadcast_backup.broadcast_rate_limits;
    SELECT COUNT(*) INTO v_functions FROM broadcast_backup.functions_backup;

    RAISE NOTICE 'Campanhas: % registros', v_campaigns;
    RAISE NOTICE 'Fila: % registros', v_queue;
    RAISE NOTICE 'Histórico: % registros', v_history;
    RAISE NOTICE 'Rate Limits: % registros', v_rate_limits;
    RAISE NOTICE 'Funções: % definições', v_functions;
    RAISE NOTICE 'Total: % registros', (v_campaigns + v_queue + v_history + v_rate_limits);
END $$;

RAISE NOTICE '==================================================';
RAISE NOTICE 'BACKUP CONCLUÍDO COM SUCESSO!';
RAISE NOTICE 'Dados salvos no schema: broadcast_backup';
RAISE NOTICE '==================================================';

COMMIT;

-- ====================================================================
-- INSTRUÇÕES PARA RESTAURAÇÃO (SE NECESSÁRIO)
-- ====================================================================

/*
PARA RESTAURAR OS DADOS (se necessário):

-- 1. Recriar as tabelas (será necessário recriar manualmente a estrutura)

-- 2. Restaurar os dados:
INSERT INTO public.broadcast_campaigns
SELECT * FROM broadcast_backup.broadcast_campaigns;

INSERT INTO public.broadcast_queue
SELECT * FROM broadcast_backup.broadcast_queue;

INSERT INTO public.broadcast_history
SELECT * FROM broadcast_backup.broadcast_history;

INSERT INTO public.broadcast_rate_limits
SELECT * FROM broadcast_backup.broadcast_rate_limits;

-- 3. Recriar as funções (usar as definições salvas em broadcast_backup.functions_backup)

-- 4. Remover o backup:
DROP SCHEMA broadcast_backup CASCADE;
*/

-- ====================================================================
-- PARA REMOVER O BACKUP DEPOIS:
-- ====================================================================
-- DROP SCHEMA broadcast_backup CASCADE;
