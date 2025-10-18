-- ============================================
-- MIGRATION: Remover tabelas Puppeteer e Broadcast (NÃO UTILIZADAS)
-- Data: 2025-01-18
-- Motivo: Sistema Puppeteer não será utilizado + Broadcast não implementado
-- ============================================

-- ============================================
-- PARTE 1: REMOVER INSTANCES_PUPPETEER
-- ============================================

-- 1.1: Remover triggers
DROP TRIGGER IF EXISTS update_instances_puppeteer_updated_at ON public.instances_puppeteer;

-- 1.2: Remover função do trigger
DROP FUNCTION IF EXISTS update_instances_puppeteer_updated_at();

-- 1.3: Remover políticas RLS
DROP POLICY IF EXISTS "Users can view their own puppeteer sessions" ON public.instances_puppeteer;
DROP POLICY IF EXISTS "Users can insert their own puppeteer sessions" ON public.instances_puppeteer;
DROP POLICY IF EXISTS "Users can update their own puppeteer sessions" ON public.instances_puppeteer;
DROP POLICY IF EXISTS "Users can delete their own puppeteer sessions" ON public.instances_puppeteer;

-- 1.4: Remover índices
DROP INDEX IF EXISTS public.idx_instances_puppeteer_instance_id;
DROP INDEX IF EXISTS public.idx_instances_puppeteer_user_id;
DROP INDEX IF EXISTS public.idx_instances_puppeteer_session_id;
DROP INDEX IF EXISTS public.idx_instances_puppeteer_status;

-- 1.5: REMOVER TABELA instances_puppeteer
DROP TABLE IF EXISTS public.instances_puppeteer CASCADE;

-- ============================================
-- PARTE 2: REMOVER TABELAS BROADCAST
-- ============================================

-- 2.1: Remover tabelas broadcast (se existirem)

-- broadcast_logs (pode ter sido criada como broadcast_history)
DROP TABLE IF EXISTS public.broadcast_logs CASCADE;
DROP TABLE IF EXISTS public.broadcast_history CASCADE;

-- broadcast_queue
DROP TABLE IF EXISTS public.broadcast_queue CASCADE;

-- broadcast_campaigns
DROP TABLE IF EXISTS public.broadcast_campaigns CASCADE;

-- broadcast_rate_limits
DROP TABLE IF EXISTS public.broadcast_rate_limits CASCADE;

-- ============================================
-- PARTE 3: ATUALIZAR EDGE FUNCTION delete_account
-- ============================================
-- NOTA: O código da edge function delete_account/index.ts precisa ser atualizado
-- para remover as linhas 55-134 que tentam deletar tabelas broadcast

-- ============================================
-- PARTE 4: VERIFICAÇÃO FINAL
-- ============================================

-- Verificar se tabelas foram removidas com sucesso
DO $$
DECLARE
  v_puppeteer_exists BOOLEAN;
  v_broadcast_logs_exists BOOLEAN;
  v_broadcast_queue_exists BOOLEAN;
  v_broadcast_campaigns_exists BOOLEAN;
  v_broadcast_rate_limits_exists BOOLEAN;
BEGIN
  -- Verificar instances_puppeteer
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'instances_puppeteer'
  ) INTO v_puppeteer_exists;

  -- Verificar broadcast_logs
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'broadcast_logs'
  ) INTO v_broadcast_logs_exists;

  -- Verificar broadcast_queue
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'broadcast_queue'
  ) INTO v_broadcast_queue_exists;

  -- Verificar broadcast_campaigns
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'broadcast_campaigns'
  ) INTO v_broadcast_campaigns_exists;

  -- Verificar broadcast_rate_limits
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'broadcast_rate_limits'
  ) INTO v_broadcast_rate_limits_exists;

  -- Logar resultados
  RAISE NOTICE '=== VERIFICAÇÃO DE REMOÇÃO ===';
  RAISE NOTICE 'instances_puppeteer removida: %', NOT v_puppeteer_exists;
  RAISE NOTICE 'broadcast_logs removida: %', NOT v_broadcast_logs_exists;
  RAISE NOTICE 'broadcast_queue removida: %', NOT v_broadcast_queue_exists;
  RAISE NOTICE 'broadcast_campaigns removida: %', NOT v_broadcast_campaigns_exists;
  RAISE NOTICE 'broadcast_rate_limits removida: %', NOT v_broadcast_rate_limits_exists;

  -- Avisar se alguma ainda existe
  IF v_puppeteer_exists THEN
    RAISE WARNING 'Tabela instances_puppeteer ainda existe!';
  END IF;

  IF v_broadcast_logs_exists THEN
    RAISE WARNING 'Tabela broadcast_logs ainda existe!';
  END IF;

  IF v_broadcast_queue_exists THEN
    RAISE WARNING 'Tabela broadcast_queue ainda existe!';
  END IF;

  IF v_broadcast_campaigns_exists THEN
    RAISE WARNING 'Tabela broadcast_campaigns ainda existe!';
  END IF;

  IF v_broadcast_rate_limits_exists THEN
    RAISE WARNING 'Tabela broadcast_rate_limits ainda existe!';
  END IF;

  -- Sucesso total
  IF NOT (v_puppeteer_exists OR v_broadcast_logs_exists OR v_broadcast_queue_exists OR v_broadcast_campaigns_exists OR v_broadcast_rate_limits_exists) THEN
    RAISE NOTICE '✅ Todas as tabelas foram removidas com sucesso!';
  END IF;
END $$;

-- FIM DA MIGRATION
