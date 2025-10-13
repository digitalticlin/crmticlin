-- ====================================================================
-- SCRIPT FINAL PARA REMOVER TODA ESTRUTURA DE BROADCAST
-- ====================================================================
-- COPIE E COLE ESTE ARQUIVO COMPLETO NO SUPABASE SQL EDITOR
-- ====================================================================

BEGIN;

SET session_replication_role = replica;

-- ====================================================================
-- REMOVENDO POLICIES RLS (10 policies)
-- ====================================================================

DROP POLICY IF EXISTS "Service role can access all campaigns" ON public.broadcast_campaigns CASCADE;
DROP POLICY IF EXISTS "Users can manage their own campaigns" ON public.broadcast_campaigns CASCADE;
DROP POLICY IF EXISTS "Service role can manage all history" ON public.broadcast_history CASCADE;
DROP POLICY IF EXISTS "Users can view their campaign history" ON public.broadcast_history CASCADE;
DROP POLICY IF EXISTS "Service role can manage all queue" ON public.broadcast_queue CASCADE;
DROP POLICY IF EXISTS "Users can view their campaign queue" ON public.broadcast_queue CASCADE;
DROP POLICY IF EXISTS "Service role can manage all rate limits" ON public.broadcast_rate_limits CASCADE;
DROP POLICY IF EXISTS "Users can manage their own rate limits" ON public.broadcast_rate_limits CASCADE;

-- ====================================================================
-- REMOVENDO TRIGGERS (2 triggers)
-- ====================================================================

DROP TRIGGER IF EXISTS update_broadcast_campaigns_updated_at ON public.broadcast_campaigns CASCADE;
DROP TRIGGER IF EXISTS update_broadcast_queue_updated_at ON public.broadcast_queue CASCADE;

-- ====================================================================
-- REMOVENDO FUNÇÕES CUSTOM (2 funções)
-- ====================================================================

DROP FUNCTION IF EXISTS public.create_broadcast_queue(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_broadcast_campaigns(uuid) CASCADE;

-- ====================================================================
-- REMOVENDO FOREIGN KEYS (7 FKs)
-- ====================================================================

ALTER TABLE IF EXISTS public.broadcast_campaigns
  DROP CONSTRAINT IF EXISTS broadcast_campaigns_created_by_user_id_fkey CASCADE;

ALTER TABLE IF EXISTS public.broadcast_history
  DROP CONSTRAINT IF EXISTS broadcast_history_campaign_id_fkey CASCADE;

ALTER TABLE IF EXISTS public.broadcast_history
  DROP CONSTRAINT IF EXISTS broadcast_history_lead_id_fkey CASCADE;

ALTER TABLE IF EXISTS public.broadcast_history
  DROP CONSTRAINT IF EXISTS broadcast_history_queue_id_fkey CASCADE;

ALTER TABLE IF EXISTS public.broadcast_queue
  DROP CONSTRAINT IF EXISTS broadcast_queue_campaign_id_fkey CASCADE;

ALTER TABLE IF EXISTS public.broadcast_queue
  DROP CONSTRAINT IF EXISTS broadcast_queue_whatsapp_instance_id_fkey CASCADE;

ALTER TABLE IF EXISTS public.broadcast_queue
  DROP CONSTRAINT IF EXISTS broadcast_queue_lead_id_fkey CASCADE;

-- ====================================================================
-- REMOVENDO ÍNDICES (7+ índices)
-- ====================================================================

DROP INDEX IF EXISTS public.idx_broadcast_rate_limits_unique CASCADE;
DROP INDEX IF EXISTS public.idx_broadcast_campaigns_user CASCADE;
DROP INDEX IF EXISTS public.idx_broadcast_campaigns_status CASCADE;
DROP INDEX IF EXISTS public.idx_broadcast_queue_campaign CASCADE;
DROP INDEX IF EXISTS public.idx_broadcast_queue_status CASCADE;
DROP INDEX IF EXISTS public.idx_broadcast_queue_scheduled CASCADE;
DROP INDEX IF EXISTS public.idx_broadcast_history_campaign CASCADE;

-- ====================================================================
-- REMOVENDO TABELAS (4 tabelas - ordem correta de dependências)
-- ====================================================================

DROP TABLE IF EXISTS public.broadcast_history CASCADE;
DROP TABLE IF EXISTS public.broadcast_queue CASCADE;
DROP TABLE IF EXISTS public.broadcast_campaigns CASCADE;
DROP TABLE IF EXISTS public.broadcast_rate_limits CASCADE;

-- ====================================================================
-- REABILITAR TRIGGERS
-- ====================================================================

SET session_replication_role = DEFAULT;

-- ====================================================================
-- VERIFICAÇÃO FINAL
-- ====================================================================

DO $$
DECLARE
    v_tables INTEGER;
    v_functions INTEGER;
    v_policies INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_tables FROM pg_tables WHERE tablename LIKE '%broadcast%' AND schemaname = 'public';
    SELECT COUNT(*) INTO v_functions FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname LIKE '%broadcast%' AND n.nspname = 'public';
    SELECT COUNT(*) INTO v_policies FROM pg_policies WHERE tablename LIKE '%broadcast%' OR policyname LIKE '%broadcast%';

    RAISE NOTICE '==================================================';
    RAISE NOTICE 'VERIFICAÇÃO FINAL:';
    RAISE NOTICE 'Tabelas restantes: %', v_tables;
    RAISE NOTICE 'Funções restantes: %', v_functions;
    RAISE NOTICE 'Policies restantes: %', v_policies;
    RAISE NOTICE '==================================================';

    IF v_tables = 0 AND v_functions = 0 AND v_policies = 0 THEN
        RAISE NOTICE 'SUCCESS: Todas as estruturas de broadcast foram removidas!';
    ELSE
        RAISE WARNING 'ATENÇÃO: Ainda existem recursos de broadcast no banco!';
    END IF;
END $$;

COMMIT;

-- ====================================================================
-- FIM - ESTRUTURA DE BROADCAST REMOVIDA COM SUCESSO!
-- ====================================================================
