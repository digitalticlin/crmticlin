-- ====================================================================
-- SCRIPT SEGURO PARA REMOVER BROADCAST DO BANCO DE DADOS
-- ====================================================================
-- Baseado na investigação real do banco de dados
-- Data: 2025-10-12
-- ====================================================================

-- RECURSOS IDENTIFICADOS:
-- ✓ 4 Tabelas: broadcast_campaigns, broadcast_history, broadcast_queue, broadcast_rate_limits
-- ✓ 3 Funções: create_broadcast_queue, get_user_broadcast_campaigns (+ broadcast_changes do realtime)
-- ✓ 2 Triggers: update_broadcast_campaigns_updated_at, update_broadcast_queue_updated_at
-- ✓ 10 Policies RLS
-- ✓ 7 Foreign Keys
-- ✓ Múltiplos Índices

BEGIN;

-- ====================================================================
-- PASSO 1: DESABILITAR TRIGGERS TEMPORARIAMENTE
-- ====================================================================
SET session_replication_role = replica;

RAISE NOTICE '==================================================';
RAISE NOTICE 'INICIANDO REMOÇÃO DA ESTRUTURA DE BROADCAST';
RAISE NOTICE '==================================================';

-- ====================================================================
-- PASSO 2: DROPAR POLICIES (RLS) - 10 policies identificadas
-- ====================================================================
RAISE NOTICE 'Removendo Policies RLS...';

-- broadcast_campaigns (2 policies)
DROP POLICY IF EXISTS "Service role can access all campaigns" ON public.broadcast_campaigns CASCADE;
DROP POLICY IF EXISTS "Users can manage their own campaigns" ON public.broadcast_campaigns CASCADE;

-- broadcast_history (2 policies)
DROP POLICY IF EXISTS "Service role can manage all history" ON public.broadcast_history CASCADE;
DROP POLICY IF EXISTS "Users can view their campaign history" ON public.broadcast_history CASCADE;

-- broadcast_queue (2 policies)
DROP POLICY IF EXISTS "Service role can manage all queue" ON public.broadcast_queue CASCADE;
DROP POLICY IF EXISTS "Users can view their campaign queue" ON public.broadcast_queue CASCADE;

-- broadcast_rate_limits (2 policies)
DROP POLICY IF EXISTS "Service role can manage all rate limits" ON public.broadcast_rate_limits CASCADE;
DROP POLICY IF EXISTS "Users can manage their own rate limits" ON public.broadcast_rate_limits CASCADE;

RAISE NOTICE '✓ Policies removidas';

-- ====================================================================
-- PASSO 3: DROPAR TRIGGERS - 2 triggers identificados
-- ====================================================================
RAISE NOTICE 'Removendo Triggers...';

DROP TRIGGER IF EXISTS update_broadcast_campaigns_updated_at ON public.broadcast_campaigns CASCADE;
DROP TRIGGER IF EXISTS update_broadcast_queue_updated_at ON public.broadcast_queue CASCADE;

RAISE NOTICE '✓ Triggers removidos';

-- ====================================================================
-- PASSO 4: DROPAR FUNÇÕES - 2 funções custom (não tocar na do realtime)
-- ====================================================================
RAISE NOTICE 'Removendo Funções...';

-- Função create_broadcast_queue
DROP FUNCTION IF EXISTS public.create_broadcast_queue(p_campaign_id uuid, p_user_id uuid) CASCADE;

-- Função get_user_broadcast_campaigns
DROP FUNCTION IF EXISTS public.get_user_broadcast_campaigns(p_user_id uuid) CASCADE;

-- NOTA: NÃO remover realtime.broadcast_changes - é função do sistema Supabase

RAISE NOTICE '✓ Funções removidas';

-- ====================================================================
-- PASSO 5: DROPAR FOREIGN KEYS - 7 FKs identificadas
-- ====================================================================
RAISE NOTICE 'Removendo Foreign Keys...';

-- broadcast_campaigns (1 FK)
ALTER TABLE IF EXISTS public.broadcast_campaigns
  DROP CONSTRAINT IF EXISTS broadcast_campaigns_created_by_user_id_fkey CASCADE;

-- broadcast_history (3 FKs)
ALTER TABLE IF EXISTS public.broadcast_history
  DROP CONSTRAINT IF EXISTS broadcast_history_campaign_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.broadcast_history
  DROP CONSTRAINT IF EXISTS broadcast_history_lead_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.broadcast_history
  DROP CONSTRAINT IF EXISTS broadcast_history_queue_id_fkey CASCADE;

-- broadcast_queue (3 FKs)
ALTER TABLE IF EXISTS public.broadcast_queue
  DROP CONSTRAINT IF EXISTS broadcast_queue_campaign_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.broadcast_queue
  DROP CONSTRAINT IF EXISTS broadcast_queue_whatsapp_instance_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.broadcast_queue
  DROP CONSTRAINT IF EXISTS broadcast_queue_lead_id_fkey CASCADE;

RAISE NOTICE '✓ Foreign Keys removidas';

-- ====================================================================
-- PASSO 6: DROPAR ÍNDICES EXPLICITAMENTE (antes das tabelas)
-- ====================================================================
RAISE NOTICE 'Removendo Índices...';

-- Índices de broadcast_rate_limits
DROP INDEX IF EXISTS public.idx_broadcast_rate_limits_unique CASCADE;

-- Índices de broadcast_campaigns
DROP INDEX IF EXISTS public.idx_broadcast_campaigns_user CASCADE;
DROP INDEX IF EXISTS public.idx_broadcast_campaigns_status CASCADE;

-- Índices de broadcast_queue
DROP INDEX IF EXISTS public.idx_broadcast_queue_campaign CASCADE;
DROP INDEX IF EXISTS public.idx_broadcast_queue_status CASCADE;
DROP INDEX IF EXISTS public.idx_broadcast_queue_scheduled CASCADE;

-- Índices de broadcast_history
DROP INDEX IF EXISTS public.idx_broadcast_history_campaign CASCADE;

RAISE NOTICE '✓ Índices removidos';

-- ====================================================================
-- PASSO 7: DROPAR TABELAS - ordem correta de dependências
-- ====================================================================
RAISE NOTICE 'Removendo Tabelas...';

-- Ordem: history primeiro (depende de queue e campaigns),
-- depois queue (depende de campaigns),
-- depois campaigns e rate_limits (independentes)

DROP TABLE IF EXISTS public.broadcast_history CASCADE;
RAISE NOTICE '✓ Tabela broadcast_history removida';

DROP TABLE IF EXISTS public.broadcast_queue CASCADE;
RAISE NOTICE '✓ Tabela broadcast_queue removida';

DROP TABLE IF EXISTS public.broadcast_campaigns CASCADE;
RAISE NOTICE '✓ Tabela broadcast_campaigns removida';

DROP TABLE IF EXISTS public.broadcast_rate_limits CASCADE;
RAISE NOTICE '✓ Tabela broadcast_rate_limits removida';

-- ====================================================================
-- PASSO 8: REABILITAR TRIGGERS
-- ====================================================================
SET session_replication_role = DEFAULT;

RAISE NOTICE '==================================================';
RAISE NOTICE 'VERIFICAÇÃO FINAL';
RAISE NOTICE '==================================================';

-- ====================================================================
-- PASSO 9: VERIFICAÇÃO FINAL
-- ====================================================================

-- Verificar se ainda existem tabelas de broadcast
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM pg_tables
    WHERE tablename LIKE '%broadcast%'
      AND schemaname = 'public';

    IF v_count > 0 THEN
        RAISE WARNING 'ATENÇÃO: Ainda existem % tabelas de broadcast!', v_count;
    ELSE
        RAISE NOTICE '✓ Nenhuma tabela de broadcast encontrada';
    END IF;
END $$;

-- Verificar se ainda existem funções de broadcast (exceto realtime)
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname LIKE '%broadcast%'
      AND n.nspname = 'public';

    IF v_count > 0 THEN
        RAISE WARNING 'ATENÇÃO: Ainda existem % funções de broadcast!', v_count;
    ELSE
        RAISE NOTICE '✓ Nenhuma função de broadcast encontrada em public schema';
    END IF;
END $$;

-- Verificar se ainda existem policies de broadcast
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE tablename LIKE '%broadcast%'
       OR policyname LIKE '%broadcast%';

    IF v_count > 0 THEN
        RAISE WARNING 'ATENÇÃO: Ainda existem % policies de broadcast!', v_count;
    ELSE
        RAISE NOTICE '✓ Nenhuma policy de broadcast encontrada';
    END IF;
END $$;

-- Listar recursos restantes (se houver)
SELECT
    'REMAINING_RESOURCE' as status,
    tablename as name,
    'TABLE' as type
FROM pg_tables
WHERE tablename LIKE '%broadcast%'
  AND schemaname = 'public'
UNION ALL
SELECT
    'REMAINING_RESOURCE' as status,
    p.proname as name,
    'FUNCTION' as type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '%broadcast%'
  AND n.nspname = 'public'
UNION ALL
SELECT
    'REMAINING_RESOURCE' as status,
    policyname as name,
    'POLICY' as type
FROM pg_policies
WHERE tablename LIKE '%broadcast%'
   OR policyname LIKE '%broadcast%';

RAISE NOTICE '==================================================';
RAISE NOTICE 'REMOÇÃO COMPLETA!';
RAISE NOTICE 'Todas as estruturas de broadcast foram removidas.';
RAISE NOTICE '==================================================';

-- ====================================================================
-- COMMIT OU ROLLBACK?
-- ====================================================================
-- Se tudo estiver OK, remova o comentário da linha abaixo:
COMMIT;

-- Se algo deu errado, execute:
-- ROLLBACK;

-- ====================================================================
-- FIM DO SCRIPT
-- ====================================================================
