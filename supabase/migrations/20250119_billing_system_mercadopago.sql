-- ============================================
-- MIGRATION: Sistema de Billing com Mercado Pago
-- Data: 2025-01-19
-- ============================================

-- 1. ATUALIZAR ENUM DE PLANOS
ALTER TABLE public.plan_subscriptions
  DROP CONSTRAINT IF EXISTS plan_subscriptions_plan_type_check;

ALTER TABLE public.plan_subscriptions
  ALTER COLUMN plan_type TYPE TEXT;

ALTER TABLE public.plan_subscriptions
  ADD CONSTRAINT plan_subscriptions_plan_type_check
  CHECK (plan_type IN ('free_200', 'pro_5k', 'ultra_15k'));

-- 2. ADICIONAR CAMPOS PARA MERCADO PAGO E CONTROLES
ALTER TABLE public.plan_subscriptions
  ADD COLUMN IF NOT EXISTS mercadopago_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS mercadopago_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS mercadopago_preference_id TEXT,
  ADD COLUMN IF NOT EXISTS member_limit INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_used_free_trial BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS payment_overdue_since TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS platform_blocked_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS next_payment_date TIMESTAMP WITH TIME ZONE;

-- Criar índices para Mercado Pago
CREATE INDEX IF NOT EXISTS idx_plan_subscriptions_mp_customer
  ON public.plan_subscriptions(mercadopago_customer_id);
CREATE INDEX IF NOT EXISTS idx_plan_subscriptions_mp_subscription
  ON public.plan_subscriptions(mercadopago_subscription_id);

-- 3. MELHORIAS NA TABELA message_usage_tracking
ALTER TABLE public.message_usage_tracking
  ADD COLUMN IF NOT EXISTS custom_limit INTEGER,
  ADD COLUMN IF NOT EXISTS custom_limit_reason TEXT,
  ADD COLUMN IF NOT EXISTS custom_limit_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS granted_by_admin_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS bonus_messages INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_messages_sent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS manual_messages_sent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. TABELA DE TRIAL GRATUITO
CREATE TABLE IF NOT EXISTS public.free_trial_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  activated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  messages_limit INTEGER DEFAULT 200,
  consumed_messages INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. TABELA DE HISTÓRICO DE PAGAMENTOS
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  payment_id TEXT NOT NULL,
  payment_method TEXT, -- 'pix', 'credit_card', 'boleto'
  status TEXT NOT NULL, -- 'pending', 'approved', 'rejected', 'cancelled'
  amount DECIMAL(10,2) NOT NULL,
  plan_type TEXT,
  gateway TEXT DEFAULT 'mercadopago', -- 'mercadopago', 'stripe'
  gateway_response JSONB,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 6. TABELA DE LEMBRETES DE COBRANÇA
CREATE TABLE IF NOT EXISTS public.billing_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  reminder_type TEXT NOT NULL, -- 'DAY_0', 'DAY_1', 'DAY_2', 'DAY_3'
  message_sent TEXT,
  sent_via TEXT DEFAULT 'whatsapp',
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  response_received BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 7. RPC - VERIFICAR E INCREMENTAR USO DE MENSAGENS AI
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
  v_trial RECORD;
  v_effective_limit INTEGER;
  v_current_usage INTEGER;
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

  -- Se não existe tracking, verificar trial
  IF v_usage IS NULL THEN
    SELECT * INTO v_trial
    FROM free_trial_usage
    WHERE user_id = p_user_id;

    IF v_trial IS NOT NULL AND v_trial.expires_at > NOW() THEN
      -- Usando trial gratuito
      v_effective_limit := v_trial.messages_limit;
      v_current_usage := COALESCE(v_trial.consumed_messages, 0);

      -- Verificar limite do trial
      IF v_current_usage >= v_effective_limit THEN
        RETURN jsonb_build_object(
          'allowed', false,
          'reason', 'TRIAL_LIMIT_EXCEEDED',
          'used', v_current_usage,
          'limit', v_effective_limit,
          'message', 'Limite do período gratuito atingido'
        );
      END IF;

      -- Incrementar se necessário
      IF p_increment THEN
        UPDATE free_trial_usage
        SET consumed_messages = consumed_messages + 1,
            updated_at = NOW()
        WHERE user_id = p_user_id;

        v_current_usage := v_current_usage + 1;
      END IF;

      RETURN jsonb_build_object(
        'allowed', true,
        'used', v_current_usage,
        'limit', v_effective_limit,
        'percentage', (v_current_usage::float / v_effective_limit * 100),
        'is_trial', true
      );
    END IF;

    -- Sem tracking e sem trial = bloqueado
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'NO_ACTIVE_PLAN',
      'message', 'Nenhum plano ativo encontrado'
    );
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
    'is_trial', false
  );
END;
$$ LANGUAGE plpgsql;

-- 8. RPC - VERIFICAR SE PODE ADICIONAR MEMBRO OPERACIONAL
CREATE OR REPLACE FUNCTION can_add_operational_member(p_admin_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription RECORD;
  v_current_members INTEGER;
  v_member_limit INTEGER;
BEGIN
  -- Buscar plano atual
  SELECT * INTO v_subscription
  FROM plan_subscriptions
  WHERE user_id = p_admin_id
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Se não tem plano ativo, verificar trial
  IF v_subscription IS NULL THEN
    IF EXISTS (SELECT 1 FROM free_trial_usage WHERE user_id = p_admin_id AND expires_at > NOW()) THEN
      -- Trial gratuito = 0 membros operacionais
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'Plano gratuito não permite membros operacionais',
        'current', 0,
        'limit', 0
      );
    END IF;

    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Nenhum plano ativo',
      'current', 0,
      'limit', 0
    );
  END IF;

  -- Contar membros operacionais atuais
  SELECT COUNT(*) INTO v_current_members
  FROM profiles
  WHERE created_by_user_id = p_admin_id
    AND role = 'operational';

  -- Definir limite baseado no plano
  v_member_limit := CASE
    WHEN v_subscription.plan_type = 'free_200' THEN 0
    WHEN v_subscription.plan_type = 'pro_5k' THEN 2
    WHEN v_subscription.plan_type = 'ultra_15k' THEN 999
    ELSE 0
  END;

  -- Verificar se pode adicionar
  IF v_current_members >= v_member_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', CASE
        WHEN v_subscription.plan_type = 'free_200' THEN 'Plano gratuito não permite membros operacionais'
        WHEN v_subscription.plan_type = 'pro_5k' THEN 'Limite de 2 membros atingido'
        ELSE 'Limite de membros atingido'
      END,
      'current', v_current_members,
      'limit', v_member_limit,
      'plan_type', v_subscription.plan_type
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'current', v_current_members,
    'limit', v_member_limit,
    'remaining', v_member_limit - v_current_members,
    'plan_type', v_subscription.plan_type
  );
END;
$$ LANGUAGE plpgsql;

-- 9. RPC - RESETAR USO MENSAL
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
      messages_sent_count = 0,
      messages_received_count = 0,
      total_messages_count = 0,
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
      messages_sent_count = 0,
      messages_received_count = 0,
      total_messages_count = 0,
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
    'reset_at', NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- 10. RPC - PROCESSAR PAGAMENTO APROVADO
CREATE OR REPLACE FUNCTION process_payment_approved(
  p_user_id UUID,
  p_payment_id TEXT,
  p_plan_type TEXT,
  p_amount DECIMAL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_limits JSONB;
  v_message_limit INTEGER;
  v_member_limit INTEGER;
BEGIN
  -- Definir limites por plano
  v_plan_limits := CASE p_plan_type
    WHEN 'free_200' THEN '{"messages": 200, "members": 0}'::jsonb
    WHEN 'pro_5k' THEN '{"messages": 5000, "members": 2}'::jsonb
    WHEN 'ultra_15k' THEN '{"messages": 15000, "members": 999}'::jsonb
    ELSE '{"messages": 200, "members": 0}'::jsonb
  END;

  v_message_limit := (v_plan_limits->>'messages')::INTEGER;
  v_member_limit := (v_plan_limits->>'members')::INTEGER;

  -- Atualizar ou criar assinatura
  INSERT INTO plan_subscriptions (
    user_id,
    plan_type,
    status,
    member_limit,
    current_period_start,
    current_period_end,
    last_payment_date,
    next_payment_date,
    payment_overdue_since,
    platform_blocked_at
  ) VALUES (
    p_user_id,
    p_plan_type,
    'active',
    v_member_limit,
    NOW(),
    NOW() + INTERVAL '30 days',
    NOW(),
    NOW() + INTERVAL '30 days',
    NULL, -- Limpar inadimplência
    NULL  -- Desbloquear plataforma
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    plan_type = EXCLUDED.plan_type,
    status = 'active',
    member_limit = EXCLUDED.member_limit,
    current_period_start = NOW(),
    current_period_end = NOW() + INTERVAL '30 days',
    last_payment_date = NOW(),
    next_payment_date = NOW() + INTERVAL '30 days',
    payment_overdue_since = NULL,
    platform_blocked_at = NULL,
    updated_at = NOW();

  -- Criar ou resetar tracking de uso
  INSERT INTO message_usage_tracking (
    user_id,
    plan_limit,
    period_start,
    period_end,
    messages_sent_count,
    messages_received_count,
    total_messages_count,
    ai_messages_sent,
    status
  ) VALUES (
    p_user_id,
    v_message_limit,
    NOW(),
    NOW() + INTERVAL '30 days',
    0, -- Reset contadores
    0,
    0,
    0,
    'active'
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    plan_limit = EXCLUDED.plan_limit,
    period_start = NOW(),
    period_end = NOW() + INTERVAL '30 days',
    messages_sent_count = 0,
    messages_received_count = 0,
    total_messages_count = 0,
    ai_messages_sent = 0,
    status = 'active',
    last_reset_at = NOW(),
    updated_at = NOW();

  -- Registrar pagamento no histórico
  INSERT INTO payment_history (
    user_id,
    payment_id,
    status,
    amount,
    plan_type,
    gateway,
    paid_at
  ) VALUES (
    p_user_id,
    p_payment_id,
    'approved',
    p_amount,
    p_plan_type,
    'mercadopago',
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'plan_type', p_plan_type,
    'message_limit', v_message_limit,
    'member_limit', v_member_limit,
    'period_end', NOW() + INTERVAL '30 days'
  );
END;
$$ LANGUAGE plpgsql;

-- 11. POLÍTICAS RLS
ALTER TABLE public.free_trial_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_reminders ENABLE ROW LEVEL SECURITY;

-- Políticas para free_trial_usage
CREATE POLICY "Users can view own trial" ON public.free_trial_usage
  FOR SELECT USING (user_id = auth.uid());

-- Políticas para payment_history
CREATE POLICY "Users can view own payments" ON public.payment_history
  FOR SELECT USING (user_id = auth.uid());

-- Políticas para billing_reminders
CREATE POLICY "Users can view own reminders" ON public.billing_reminders
  FOR SELECT USING (user_id = auth.uid());

-- 12. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id
  ON public.payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status
  ON public.payment_history(status);
CREATE INDEX IF NOT EXISTS idx_billing_reminders_user_id
  ON public.billing_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_free_trial_usage_expires
  ON public.free_trial_usage(expires_at);

-- 13. TRIGGERS PARA UPDATED_AT
CREATE TRIGGER update_free_trial_usage_updated_at
  BEFORE UPDATE ON public.free_trial_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- FIM DA MIGRATION