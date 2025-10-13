-- ====================================================================
-- SCRIPT PARA REMOVER EDGE FUNCTIONS DE BROADCAST DO SUPABASE
-- ====================================================================
-- ATENÇÃO: Edge Functions não podem ser removidas via SQL direto!
-- Este script remove INVOCAÇÕES e PERMISSÕES das edge functions
-- Para remover as functions completamente, use o Supabase CLI
-- ====================================================================

BEGIN;

-- ====================================================================
-- REMOVER AGENDAMENTOS (CRON JOBS) DAS EDGE FUNCTIONS
-- ====================================================================

-- Verificar e remover cron jobs relacionados a broadcast
DELETE FROM cron.job
WHERE command LIKE '%broadcast%';

-- ====================================================================
-- REMOVER WEBHOOKS/TRIGGERS QUE CHAMAM EDGE FUNCTIONS DE BROADCAST
-- ====================================================================

-- Remover triggers de database que invocam edge functions
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE action_statement LIKE '%broadcast_campaign_manager%'
           OR action_statement LIKE '%broadcast_messaging_service%'
           OR action_statement LIKE '%broadcast_scheduler%'
           OR action_statement LIKE '%broadcast_sender%'
    ) LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I CASCADE', r.trigger_name, r.event_object_table);
        RAISE NOTICE 'Removido trigger: % da tabela %', r.trigger_name, r.event_object_table;
    END LOOP;
END $$;

-- ====================================================================
-- REMOVER FUNÇÕES QUE INVOCAM AS EDGE FUNCTIONS
-- ====================================================================

-- Procurar e remover funções que chamam edge functions via http
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT n.nspname as schema, p.proname as function_name,
               pg_get_function_identity_arguments(p.oid) as arguments
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE pg_get_functiondef(p.oid) LIKE '%broadcast_campaign_manager%'
           OR pg_get_functiondef(p.oid) LIKE '%broadcast_messaging_service%'
           OR pg_get_functiondef(p.oid) LIKE '%broadcast_scheduler%'
           OR pg_get_functiondef(p.oid) LIKE '%broadcast_sender%'
    ) LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE', r.schema, r.function_name, r.arguments);
        RAISE NOTICE 'Removida função: %.%', r.schema, r.function_name;
    END LOOP;
END $$;

-- ====================================================================
-- LIMPAR LOGS/HISTÓRICO DE EXECUÇÃO (se existir tabela de logs)
-- ====================================================================

-- Se você tem uma tabela de logs de edge functions
DROP TABLE IF EXISTS public.edge_function_logs CASCADE;
DROP TABLE IF EXISTS public.function_invocations CASCADE;

-- ====================================================================
-- VERIFICAÇÃO
-- ====================================================================

DO $$
DECLARE
    v_cron_jobs INTEGER;
    v_triggers INTEGER;
    v_functions INTEGER;
BEGIN
    -- Verificar cron jobs
    SELECT COUNT(*) INTO v_cron_jobs FROM cron.job WHERE command LIKE '%broadcast%';

    -- Verificar triggers
    SELECT COUNT(*) INTO v_triggers
    FROM information_schema.triggers
    WHERE action_statement LIKE '%broadcast%';

    -- Verificar funções que invocam edge functions
    SELECT COUNT(*) INTO v_functions
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE pg_get_functiondef(p.oid) LIKE '%broadcast_%';

    RAISE NOTICE '==================================================';
    RAISE NOTICE 'VERIFICAÇÃO DE REFERÊNCIAS A EDGE FUNCTIONS:';
    RAISE NOTICE 'Cron Jobs restantes: %', v_cron_jobs;
    RAISE NOTICE 'Triggers restantes: %', v_triggers;
    RAISE NOTICE 'Funções que invocam: %', v_functions;
    RAISE NOTICE '==================================================';

    IF v_cron_jobs = 0 AND v_triggers = 0 AND v_functions = 0 THEN
        RAISE NOTICE 'SUCCESS: Todas as referências foram removidas!';
    ELSE
        RAISE WARNING 'ATENÇÃO: Ainda existem referências às edge functions!';
    END IF;
END $$;

COMMIT;

-- ====================================================================
-- COMANDOS CLI PARA REMOVER AS EDGE FUNCTIONS DEFINITIVAMENTE
-- ====================================================================

/*
ATENÇÃO: Edge Functions só podem ser removidas via Supabase CLI ou Dashboard!

OPÇÃO 1 - Via Supabase CLI (Terminal):
------------------------------------------
npx supabase functions delete broadcast_campaign_manager
npx supabase functions delete broadcast_messaging_service
npx supabase functions delete broadcast_scheduler
npx supabase functions delete broadcast_sender

OPÇÃO 2 - Via Supabase Dashboard:
------------------------------------------
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em: Edge Functions
4. Para cada função de broadcast:
   - Clique nos 3 pontinhos (...)
   - Clique em "Delete function"
   - Confirme a remoção

EDGE FUNCTIONS A REMOVER:
- broadcast_campaign_manager
- broadcast_messaging_service
- broadcast_scheduler
- broadcast_sender

*/

-- ====================================================================
-- FIM DO SCRIPT
-- ====================================================================
