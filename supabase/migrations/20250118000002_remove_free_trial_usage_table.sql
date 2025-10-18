-- ============================================
-- MIGRATION: Remover tabela free_trial_usage (REDUNDANTE)
-- Data: 2025-01-18
-- Motivo: Tabela duplica informações já presentes em plan_subscriptions e message_usage_tracking
-- ============================================

-- PASSO 1: Migrar dados existentes antes de remover tabela
-- ========================================================

-- 1.1: Garantir que todos usuários com trial tenham registro em message_usage_tracking
INSERT INTO message_usage_tracking (
  user_id,
  plan_limit,
  ai_messages_sent,
  manual_messages_sent,
  messages_sent_count,
  messages_received_count,
  total_messages_count,
  period_start,
  period_end,
  status,
  last_reset_at,
  created_at,
  updated_at
)
SELECT
  ftu.user_id,
  200,                                                    -- Limite do trial
  COALESCE(ftu.consumed_messages, 0),                    -- Migrar contador
  0,                                                      -- Manual messages
  COALESCE(ftu.consumed_messages, 0),                    -- Total sent
  0,                                                      -- Received
  COALESCE(ftu.consumed_messages, 0),                    -- Total
  ftu.activated_at,                                       -- Period start
  ftu.expires_at,                                         -- Period end
  CASE
    WHEN ftu.consumed_messages >= 200 THEN 'exceeded'
    WHEN ftu.consumed_messages >= 180 THEN 'warning'
    ELSE 'active'
  END,
  ftu.activated_at,                                       -- Last reset
  ftu.created_at,
  ftu.updated_at
FROM free_trial_usage ftu
WHERE NOT EXISTS (
  SELECT 1 FROM message_usage_tracking mut
  WHERE mut.user_id = ftu.user_id
)
ON CONFLICT (user_id) DO NOTHING;

-- 1.2: Garantir que usuários com trial tenham has_used_free_trial = true em plan_subscriptions
UPDATE plan_subscriptions ps
SET has_used_free_trial = true,
    updated_at = NOW()
WHERE EXISTS (
  SELECT 1 FROM free_trial_usage ftu
  WHERE ftu.user_id = ps.user_id
);

-- 1.3: Criar registros de subscription para usuários que têm APENAS trial (sem subscription)
INSERT INTO plan_subscriptions (
  user_id,
  plan_type,
  status,
  current_period_start,
  current_period_end,
  has_used_free_trial,
  member_limit,
  created_at,
  updated_at
)
SELECT
  ftu.user_id,
  'free_200',                                             -- Plano trial
  CASE
    WHEN ftu.expires_at > NOW() THEN 'active'
    ELSE 'expired'
  END,
  ftu.activated_at,                                       -- Period start
  ftu.expires_at,                                         -- Period end
  true,                                                   -- Já usou trial
  0,                                                      -- Trial não permite membros
  ftu.created_at,
  NOW()
FROM free_trial_usage ftu
WHERE NOT EXISTS (
  SELECT 1 FROM plan_subscriptions ps
  WHERE ps.user_id = ftu.user_id
)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- PASSO 2: Atualizar RPC can_use_free_trial
-- ============================================

-- Remover versão antiga que usa free_trial_usage
DROP FUNCTION IF EXISTS can_use_free_trial(UUID);

-- Criar nova versão que usa plan_subscriptions.has_used_free_trial
CREATE OR REPLACE FUNCTION can_use_free_trial(p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se já usou trial (baseado em plan_subscriptions)
  IF EXISTS (
    SELECT 1 FROM plan_subscriptions
    WHERE user_id = p_user_id
    AND has_used_free_trial = true
  ) THEN
    RETURN FALSE;
  END IF;

  -- Verificar se já teve plano pago ativo
  IF EXISTS (
    SELECT 1 FROM plan_subscriptions
    WHERE user_id = p_user_id
    AND plan_type IN ('pro_5k', 'ultra_15k')
    AND status IN ('active', 'past_due', 'canceled')
  ) THEN
    RETURN FALSE;
  END IF;

  -- Usuário pode usar trial
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PASSO 3: Atualizar RPC check_and_increment_ai_usage
-- ============================================

-- Remover lógica que busca free_trial_usage e simplificar
CREATE OR REPLACE FUNCTION check_and_increment_ai_usage(
  p_user_id UUID,
  p_increment BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usage RECORD;
  v_subscription RECORD;
  v_effective_limit INTEGER;
  v_current_usage INTEGER;
  v_plan_limit INTEGER;
BEGIN
  -- Verificar bloqueio por inadimplência
  SELECT * INTO v_subscription
  FROM plan_subscriptions
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_subscription.platform_blocked_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'PLATFORM_BLOCKED',
      'blocked_since', v_subscription.platform_blocked_at,
      'message', 'Plataforma bloqueada por inadimplência'
    );
  END IF;

  -- Buscar uso atual
  SELECT * INTO v_usage
  FROM message_usage_tracking
  WHERE user_id = p_user_id
    AND period_start <= NOW()
    AND period_end >= NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  -- Se não existe tracking, criar baseado no plano ativo
  IF v_usage IS NULL THEN
    -- Verificar se tem plano ativo (trial ou pago)
    IF v_subscription.status = 'active' THEN
      -- Determinar limite baseado no plano
      v_plan_limit := CASE v_subscription.plan_type
        WHEN 'free_200' THEN 200
        WHEN 'pro_5k' THEN 5000
        WHEN 'ultra_15k' THEN 15000
        ELSE 200
      END;

      -- Criar tracking automaticamente
      INSERT INTO message_usage_tracking (
        user_id,
        plan_limit,
        ai_messages_sent,
        manual_messages_sent,
        messages_sent_count,
        messages_received_count,
        total_messages_count,
        period_start,
        period_end,
        status
      ) VALUES (
        p_user_id,
        v_plan_limit,
        0, 0, 0, 0, 0,
        NOW(),
        NOW() + INTERVAL '30 days',
        'active'
      )
      RETURNING * INTO v_usage;
    ELSE
      -- Sem plano ativo
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'NO_ACTIVE_PLAN',
        'message', 'Nenhum plano ativo encontrado'
      );
    END IF;
  END IF;

  -- Calcular limite efetivo (considerando custom e bonus)
  v_effective_limit := COALESCE(v_usage.custom_limit, v_usage.plan_limit, 200)
                      + COALESCE(v_usage.bonus_messages, 0);
  v_current_usage := COALESCE(v_usage.ai_messages_sent, 0);

  -- Verificar limite
  IF v_current_usage >= v_effective_limit THEN
    -- Atualizar status para exceeded se ainda não está
    IF v_usage.status != 'exceeded' THEN
      UPDATE message_usage_tracking
      SET status = 'exceeded',
          updated_at = NOW()
      WHERE id = v_usage.id;
    END IF;

    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'LIMIT_EXCEEDED',
      'used', v_current_usage,
      'limit', v_effective_limit,
      'percentage', 100,
      'message', 'Limite de mensagens AI atingido'
    );
  END IF;

  -- Incrementar contador se solicitado
  IF p_increment THEN
    UPDATE message_usage_tracking
    SET
      ai_messages_sent = COALESCE(ai_messages_sent, 0) + 1,
      messages_sent_count = COALESCE(messages_sent_count, 0) + 1,
      total_messages_count = COALESCE(total_messages_count, 0) + 1,
      status = CASE
        WHEN (COALESCE(ai_messages_sent, 0) + 1) >= v_effective_limit * 0.9 THEN 'warning'
        WHEN (COALESCE(ai_messages_sent, 0) + 1) >= v_effective_limit THEN 'exceeded'
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
    'is_trial', v_subscription.plan_type = 'free_200'
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PASSO 4: Remover tabela free_trial_usage
-- ============================================

-- Remover políticas RLS
DROP POLICY IF EXISTS "Users can view own trial" ON public.free_trial_usage;

-- Remover triggers
DROP TRIGGER IF EXISTS update_free_trial_usage_updated_at ON public.free_trial_usage;

-- Remover índices
DROP INDEX IF EXISTS idx_free_trial_usage_expires;

-- FINALMENTE: Remover tabela
DROP TABLE IF EXISTS public.free_trial_usage CASCADE;

-- ============================================
-- PASSO 5: Comentários e documentação
-- ============================================

COMMENT ON COLUMN plan_subscriptions.has_used_free_trial IS
  'Flag que indica se o usuário já ativou o trial gratuito alguma vez. Substitui a necessidade da tabela free_trial_usage.';

COMMENT ON COLUMN message_usage_tracking.plan_limit IS
  'Limite de mensagens do plano atual (200 para free_200, 5000 para pro_5k, 15000 para ultra_15k). Funciona para trial e planos pagos.';

COMMENT ON COLUMN message_usage_tracking.ai_messages_sent IS
  'Contador de mensagens AI enviadas no período atual. Usado tanto para trial quanto planos pagos.';

-- FIM DA MIGRATION
