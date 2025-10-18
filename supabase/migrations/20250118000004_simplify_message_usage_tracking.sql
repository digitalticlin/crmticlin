-- =====================================================
-- MIGRATION: Simplificar message_usage_tracking
-- Data: 2025-01-18
-- Objetivo: Remover colunas redundantes e corrigir lógica
-- =====================================================

-- PROBLEMA IDENTIFICADO:
-- 1. total_messages_count: Valor incorreto (200 vs esperado 50)
-- 2. messages_received_count: Sempre 0, não conta no plano
-- 3. messages_sent_count: Duplica ai_messages_sent + manual_messages_sent

-- COLUNAS A MANTER:
-- ✅ ai_messages_sent: Contador principal para limite do plano
-- ✅ manual_messages_sent: Estatística (não conta no limite)

-- COLUNAS A REMOVER:
-- ❌ messages_sent_count
-- ❌ messages_received_count
-- ❌ total_messages_count

-- =====================================================
-- PASSO 1: Corrigir dados inconsistentes ANTES de remover
-- =====================================================

-- Zerar valores inconsistentes para garantir limpeza
UPDATE message_usage_tracking
SET
  messages_sent_count = COALESCE(ai_messages_sent, 0) + COALESCE(manual_messages_sent, 0),
  messages_received_count = 0,
  total_messages_count = COALESCE(ai_messages_sent, 0) + COALESCE(manual_messages_sent, 0)
WHERE
  messages_sent_count != (COALESCE(ai_messages_sent, 0) + COALESCE(manual_messages_sent, 0))
  OR total_messages_count != (COALESCE(ai_messages_sent, 0) + COALESCE(manual_messages_sent, 0));

-- =====================================================
-- PASSO 2: Atualizar RPC check_and_increment_ai_usage
-- =====================================================

CREATE OR REPLACE FUNCTION check_and_increment_ai_usage(
  p_user_id UUID,
  p_increment BOOLEAN DEFAULT false
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription RECORD;
  v_usage RECORD;
  v_effective_limit INTEGER;
  v_current_usage INTEGER;
BEGIN
  -- Buscar plano ativo do usuário
  SELECT * INTO v_subscription
  FROM plan_subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Se não tem plano ativo, bloquear
  IF v_subscription IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'NO_ACTIVE_PLAN',
      'used', 0,
      'limit', 0,
      'percentage', 0,
      'remaining', 0
    );
  END IF;

  -- Verificar se plataforma está bloqueada
  IF v_subscription.platform_blocked_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'PLATFORM_BLOCKED',
      'blocked_since', v_subscription.platform_blocked_at,
      'used', 0,
      'limit', 0,
      'percentage', 0,
      'remaining', 0
    );
  END IF;

  -- Buscar ou criar registro de uso
  SELECT * INTO v_usage
  FROM message_usage_tracking
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Se não existe, criar automaticamente
  IF v_usage IS NULL THEN
    INSERT INTO message_usage_tracking (
      user_id,
      plan_subscription_id,
      period_start,
      period_end,
      ai_messages_sent,
      manual_messages_sent,
      plan_limit,
      status
    ) VALUES (
      p_user_id,
      v_subscription.id,
      NOW(),
      NOW() + INTERVAL '30 days',
      0,
      0,
      v_subscription.message_limit,
      'active'
    )
    RETURNING * INTO v_usage;
  END IF;

  -- Calcular limite efetivo (plan_limit + custom_limit + bonus)
  v_effective_limit := COALESCE(v_usage.custom_limit, v_usage.plan_limit, 0)
                     + COALESCE(v_usage.bonus_messages, 0);

  v_current_usage := COALESCE(v_usage.ai_messages_sent, 0);

  -- Verificar se já atingiu o limite
  IF v_current_usage >= v_effective_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'LIMIT_EXCEEDED',
      'used', v_current_usage,
      'limit', v_effective_limit,
      'percentage', (v_current_usage::float / v_effective_limit * 100),
      'remaining', 0,
      'status', 'exceeded'
    );
  END IF;

  -- Incrementar contador se solicitado
  IF p_increment THEN
    UPDATE message_usage_tracking
    SET
      ai_messages_sent = COALESCE(ai_messages_sent, 0) + 1,
      status = CASE
        WHEN (COALESCE(ai_messages_sent, 0) + 1) >= v_effective_limit THEN 'exceeded'
        WHEN (COALESCE(ai_messages_sent, 0) + 1) >= v_effective_limit * 0.9 THEN 'warning'
        ELSE 'active'
      END,
      updated_at = NOW()
    WHERE id = v_usage.id;

    v_current_usage := v_current_usage + 1;
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'used', v_current_usage,
    'limit', v_effective_limit,
    'percentage', (v_current_usage::float / v_effective_limit * 100),
    'remaining', v_effective_limit - v_current_usage,
    'status', v_usage.status,
    'is_trial', false
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PASSO 3: Atualizar RPC reset_monthly_usage
-- =====================================================

CREATE OR REPLACE FUNCTION reset_monthly_usage(p_user_id UUID DEFAULT NULL)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Se user_id específico
  IF p_user_id IS NOT NULL THEN
    UPDATE message_usage_tracking
    SET
      ai_messages_sent = 0,
      manual_messages_sent = 0,
      status = 'active',
      period_start = NOW(),
      period_end = NOW() + INTERVAL '30 days',
      last_reset_at = NOW(),
      updated_at = NOW()
    WHERE user_id = p_user_id
      AND status IN ('active', 'warning', 'exceeded');

    GET DIAGNOSTICS v_count = ROW_COUNT;
  ELSE
    -- Reset para todos os usuários ativos (executar via CRON)
    UPDATE message_usage_tracking
    SET
      ai_messages_sent = 0,
      manual_messages_sent = 0,
      status = 'active',
      period_start = NOW(),
      period_end = NOW() + INTERVAL '30 days',
      last_reset_at = NOW(),
      updated_at = NOW()
    WHERE period_end <= NOW()
      AND status IN ('active', 'warning', 'exceeded');

    GET DIAGNOSTICS v_count = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'reset_count', v_count,
    'message', format('Reset successful for %s users', v_count)
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PASSO 4: Remover colunas redundantes
-- =====================================================

-- Remover colunas desnecessárias
ALTER TABLE message_usage_tracking
  DROP COLUMN IF EXISTS messages_sent_count,
  DROP COLUMN IF EXISTS messages_received_count,
  DROP COLUMN IF EXISTS total_messages_count;

-- =====================================================
-- PASSO 5: Adicionar comentários para documentação
-- =====================================================

COMMENT ON COLUMN message_usage_tracking.ai_messages_sent IS
  '⭐ Contador principal: mensagens enviadas pelo AI (conta no limite do plano)';

COMMENT ON COLUMN message_usage_tracking.manual_messages_sent IS
  'Contador estatístico: mensagens enviadas manualmente pelo usuário (NÃO conta no limite do plano)';

COMMENT ON COLUMN message_usage_tracking.plan_limit IS
  'Limite padrão do plano (200, 5000, 15000)';

COMMENT ON COLUMN message_usage_tracking.custom_limit IS
  'Limite customizado pelo admin (substitui plan_limit quando definido)';

COMMENT ON COLUMN message_usage_tracking.bonus_messages IS
  'Mensagens bônus adicionadas pelo admin (soma ao limite efetivo)';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
  v_has_sent_count BOOLEAN;
  v_has_received_count BOOLEAN;
  v_has_total_count BOOLEAN;
BEGIN
  -- Verificar se colunas foram removidas
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'message_usage_tracking'
    AND column_name = 'messages_sent_count'
  ) INTO v_has_sent_count;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'message_usage_tracking'
    AND column_name = 'messages_received_count'
  ) INTO v_has_received_count;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'message_usage_tracking'
    AND column_name = 'total_messages_count'
  ) INTO v_has_total_count;

  IF NOT v_has_sent_count AND NOT v_has_received_count AND NOT v_has_total_count THEN
    RAISE NOTICE '✅ Migration concluída com sucesso!';
    RAISE NOTICE '✅ Colunas redundantes removidas: messages_sent_count, messages_received_count, total_messages_count';
    RAISE NOTICE '✅ RPCs atualizadas: check_and_increment_ai_usage, reset_monthly_usage';
    RAISE NOTICE '✅ Estrutura simplificada: ai_messages_sent (principal) + manual_messages_sent (estatística)';
  ELSE
    RAISE WARNING '⚠️ Algumas colunas não foram removidas corretamente';
  END IF;
END $$;
