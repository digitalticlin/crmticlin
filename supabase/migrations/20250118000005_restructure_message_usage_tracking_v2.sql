-- =====================================================
-- MIGRATION: Reestruturar message_usage_tracking (VERSÃO CORRETA)
-- Data: 2025-01-18
-- Objetivo: Estrutura simplificada para contagem de mensagens
-- =====================================================

-- ESTRUTURA DEFINIDA:
-- ✅ total_messages_lifetime   : Total desde criação (NUNCA zera)
-- ✅ monthly_messages_count    : Contador mensal (zera ao renovar)
-- ✅ plan_limit               : Limite do plano atual
-- ✅ status                   : 'active' | 'exceeded'

-- LÓGICA:
-- - Todos agentes de IA do usuário somam em monthly_messages_count
-- - Quando monthly_messages_count >= plan_limit → status = 'exceeded'
-- - Ao renovar período: monthly_messages_count = 0, status = 'active'
-- - total_messages_lifetime continua acumulando (histórico)

-- =====================================================
-- PASSO 1: Backup de dados antes de alterar
-- =====================================================

-- Criar coluna temporária com dados atuais
ALTER TABLE message_usage_tracking
  ADD COLUMN IF NOT EXISTS backup_ai_messages_sent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS backup_manual_messages_sent INTEGER DEFAULT 0;

UPDATE message_usage_tracking
SET
  backup_ai_messages_sent = COALESCE(ai_messages_sent, 0),
  backup_manual_messages_sent = COALESCE(manual_messages_sent, 0);

-- =====================================================
-- PASSO 2: Adicionar novas colunas
-- =====================================================

ALTER TABLE message_usage_tracking
  ADD COLUMN IF NOT EXISTS total_messages_lifetime INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_messages_count INTEGER DEFAULT 0;

-- =====================================================
-- PASSO 3: Migrar dados existentes
-- =====================================================

-- Migrar ai_messages_sent para as novas colunas
UPDATE message_usage_tracking
SET
  monthly_messages_count = COALESCE(ai_messages_sent, 0),
  total_messages_lifetime = COALESCE(ai_messages_sent, 0)
WHERE monthly_messages_count = 0;

-- =====================================================
-- PASSO 4: Remover colunas antigas/redundantes
-- =====================================================

ALTER TABLE message_usage_tracking
  DROP COLUMN IF EXISTS ai_messages_sent,
  DROP COLUMN IF EXISTS manual_messages_sent,
  DROP COLUMN IF EXISTS messages_sent_count,
  DROP COLUMN IF EXISTS messages_received_count,
  DROP COLUMN IF EXISTS total_messages_count,
  DROP COLUMN IF EXISTS backup_ai_messages_sent,
  DROP COLUMN IF EXISTS backup_manual_messages_sent;

-- =====================================================
-- PASSO 5: Ajustar coluna status (remover 'warning', manter apenas 'active' e 'exceeded')
-- =====================================================

-- Converter 'warning' para 'active'
UPDATE message_usage_tracking
SET status = 'active'
WHERE status = 'warning';

-- =====================================================
-- PASSO 6: Atualizar RPC check_and_increment_ai_usage
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
  -- 1️⃣ Buscar plano ativo do usuário
  SELECT * INTO v_subscription
  FROM plan_subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  -- 2️⃣ Se não tem plano ativo, bloquear
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

  -- 3️⃣ Verificar se plataforma está bloqueada
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

  -- 4️⃣ Buscar ou criar registro de uso
  SELECT * INTO v_usage
  FROM message_usage_tracking
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- 5️⃣ Se não existe, criar automaticamente
  IF v_usage IS NULL THEN
    INSERT INTO message_usage_tracking (
      user_id,
      plan_subscription_id,
      period_start,
      period_end,
      monthly_messages_count,
      total_messages_lifetime,
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

  -- 6️⃣ Calcular limite efetivo (plan_limit ou custom_limit)
  v_effective_limit := COALESCE(v_usage.custom_limit, v_usage.plan_limit, 0)
                     + COALESCE(v_usage.bonus_messages, 0);

  v_current_usage := COALESCE(v_usage.monthly_messages_count, 0);

  -- 7️⃣ Verificar se período expirou (auto-reset mensal)
  IF v_usage.period_end < NOW() THEN
    UPDATE message_usage_tracking
    SET
      monthly_messages_count = 0,
      status = 'active',
      period_start = NOW(),
      period_end = NOW() + INTERVAL '30 days',
      last_reset_at = NOW(),
      updated_at = NOW()
    WHERE id = v_usage.id;

    v_current_usage := 0;

    RAISE NOTICE '[check_and_increment_ai_usage] ✅ Período renovado automaticamente para user_id=%', p_user_id;
  END IF;

  -- 8️⃣ Verificar se já atingiu o limite
  IF v_current_usage >= v_effective_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'LIMIT_EXCEEDED',
      'used', v_current_usage,
      'limit', v_effective_limit,
      'percentage', ROUND((v_current_usage::float / v_effective_limit * 100)::numeric, 2),
      'remaining', 0,
      'status', 'exceeded'
    );
  END IF;

  -- 9️⃣ Incrementar contador se solicitado
  IF p_increment THEN
    UPDATE message_usage_tracking
    SET
      monthly_messages_count = monthly_messages_count + 1,
      total_messages_lifetime = total_messages_lifetime + 1,
      status = CASE
        WHEN (monthly_messages_count + 1) >= v_effective_limit THEN 'exceeded'
        ELSE 'active'
      END,
      updated_at = NOW()
    WHERE id = v_usage.id;

    v_current_usage := v_current_usage + 1;
  END IF;

  -- 🔟 Retornar resultado
  RETURN jsonb_build_object(
    'allowed', true,
    'used', v_current_usage,
    'limit', v_effective_limit,
    'percentage', ROUND((v_current_usage::float / v_effective_limit * 100)::numeric, 2),
    'remaining', v_effective_limit - v_current_usage,
    'status', v_usage.status,
    'is_trial', v_subscription.plan_type = 'free_200'
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PASSO 7: Atualizar RPC reset_monthly_usage
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
      monthly_messages_count = 0,
      status = 'active',
      period_start = NOW(),
      period_end = NOW() + INTERVAL '30 days',
      last_reset_at = NOW(),
      updated_at = NOW()
    WHERE user_id = p_user_id
      AND status IN ('active', 'exceeded');

    GET DIAGNOSTICS v_count = ROW_COUNT;
  ELSE
    -- Reset para todos os usuários ativos (executar via CRON)
    UPDATE message_usage_tracking
    SET
      monthly_messages_count = 0,
      status = 'active',
      period_start = NOW(),
      period_end = NOW() + INTERVAL '30 days',
      last_reset_at = NOW(),
      updated_at = NOW()
    WHERE period_end <= NOW()
      AND status IN ('active', 'exceeded');

    GET DIAGNOSTICS v_count = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'reset_count', v_count,
    'message', format('Reset mensal executado para %s usuários', v_count)
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PASSO 8: Adicionar comentários para documentação
-- =====================================================

COMMENT ON COLUMN message_usage_tracking.monthly_messages_count IS
  '⭐ Contador MENSAL: Mensagens AI enviadas no período atual (zera ao renovar)';

COMMENT ON COLUMN message_usage_tracking.total_messages_lifetime IS
  '📊 Contador TOTAL: Total acumulado desde a criação da conta (nunca zera)';

COMMENT ON COLUMN message_usage_tracking.plan_limit IS
  '🎯 Limite do plano atual (200, 5000, 15000)';

COMMENT ON COLUMN message_usage_tracking.status IS
  '🚦 Status: active (pode enviar) | exceeded (bloqueado por limite)';

-- =====================================================
-- PASSO 9: Verificação final
-- =====================================================

DO $$
DECLARE
  v_has_monthly BOOLEAN;
  v_has_lifetime BOOLEAN;
  v_has_old_columns BOOLEAN;
BEGIN
  -- Verificar se novas colunas existem
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'message_usage_tracking'
    AND column_name = 'monthly_messages_count'
  ) INTO v_has_monthly;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'message_usage_tracking'
    AND column_name = 'total_messages_lifetime'
  ) INTO v_has_lifetime;

  -- Verificar se colunas antigas foram removidas
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'message_usage_tracking'
    AND column_name IN ('ai_messages_sent', 'manual_messages_sent', 'messages_sent_count')
  ) INTO v_has_old_columns;

  IF v_has_monthly AND v_has_lifetime AND NOT v_has_old_columns THEN
    RAISE NOTICE '✅ Migration concluída com sucesso!';
    RAISE NOTICE '✅ Novas colunas criadas: monthly_messages_count, total_messages_lifetime';
    RAISE NOTICE '✅ Colunas antigas removidas';
    RAISE NOTICE '✅ RPCs atualizadas: check_and_increment_ai_usage, reset_monthly_usage';
    RAISE NOTICE '✅ Lógica: monthly_messages_count >= plan_limit → status = exceeded';
  ELSE
    RAISE WARNING '⚠️ Algo deu errado na migration';
    RAISE WARNING 'v_has_monthly: %, v_has_lifetime: %, v_has_old_columns: %', v_has_monthly, v_has_lifetime, v_has_old_columns;
  END IF;
END $$;
