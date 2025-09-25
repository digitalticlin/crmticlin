-- ============================================
-- ADICIONAR USUÁRIO AO PLANO GRATUITO
-- User ID: 0b7be1ee-9e70-4ae3-945e-e906ffdb85b6
-- Plano: free_200 (200 mensagens/mês por 30 dias)
-- ============================================

BEGIN;

-- 1. Verificar se o usuário já tem alguma assinatura ativa
DO $$
DECLARE
  v_existing_subscription UUID;
  v_existing_trial UUID;
BEGIN
  -- Verificar assinatura existente
  SELECT id INTO v_existing_subscription
  FROM public.plan_subscriptions
  WHERE user_id = '0b7be1ee-9e70-4ae3-945e-e906ffdb85b6'
    AND status IN ('active', 'trialing')
  LIMIT 1;

  IF v_existing_subscription IS NOT NULL THEN
    RAISE EXCEPTION 'Usuário já possui uma assinatura ativa';
  END IF;

  -- Verificar se já usou trial
  SELECT id INTO v_existing_trial
  FROM public.free_trial_usage
  WHERE user_id = '0b7be1ee-9e70-4ae3-945e-e906ffdb85b6';

  IF v_existing_trial IS NOT NULL THEN
    RAISE NOTICE 'Usuário já utilizou o período de trial gratuito anteriormente';
  END IF;
END $$;

-- 2. Criar assinatura do plano gratuito
INSERT INTO public.plan_subscriptions (
  user_id,
  plan_type,
  status,
  current_period_start,
  current_period_end,
  has_used_free_trial,
  member_limit,
  created_at,
  updated_at
) VALUES (
  '0b7be1ee-9e70-4ae3-945e-e906ffdb85b6',
  'free_200',
  'trialing',
  NOW(),
  NOW() + INTERVAL '30 days',
  true,
  1, -- Apenas 1 membro (administrador)
  NOW(),
  NOW()
);

-- 3. Criar registro de trial gratuito
INSERT INTO public.free_trial_usage (
  user_id,
  activated_at,
  expires_at,
  messages_limit,
  consumed_messages,
  created_at,
  updated_at
) VALUES (
  '0b7be1ee-9e70-4ae3-945e-e906ffdb85b6',
  NOW(),
  NOW() + INTERVAL '30 days',
  200,
  0,
  NOW(),
  NOW()
);

-- 4. Criar tracking de uso de mensagens para o período
INSERT INTO public.message_usage_tracking (
  user_id,
  plan_subscription_id,
  period_start,
  period_end,
  messages_sent_count,
  messages_received_count,
  total_messages_count,
  ai_messages_sent,
  manual_messages_sent,
  plan_limit,
  status,
  last_reset_at,
  created_at,
  updated_at
) VALUES (
  '0b7be1ee-9e70-4ae3-945e-e906ffdb85b6',
  (SELECT id FROM public.plan_subscriptions
   WHERE user_id = '0b7be1ee-9e70-4ae3-945e-e906ffdb85b6'
   ORDER BY created_at DESC LIMIT 1),
  NOW(),
  NOW() + INTERVAL '30 days',
  0,
  0,
  0,
  0,
  0,
  200,
  'active',
  NOW(),
  NOW(),
  NOW()
);

-- 5. Verificar se a inserção foi bem-sucedida
DO $$
DECLARE
  v_subscription_created BOOLEAN;
  v_trial_created BOOLEAN;
  v_tracking_created BOOLEAN;
BEGIN
  -- Verificar assinatura
  SELECT EXISTS (
    SELECT 1 FROM public.plan_subscriptions
    WHERE user_id = '0b7be1ee-9e70-4ae3-945e-e906ffdb85b6'
      AND plan_type = 'free_200'
      AND status = 'trialing'
  ) INTO v_subscription_created;

  -- Verificar trial
  SELECT EXISTS (
    SELECT 1 FROM public.free_trial_usage
    WHERE user_id = '0b7be1ee-9e70-4ae3-945e-e906ffdb85b6'
  ) INTO v_trial_created;

  -- Verificar tracking
  SELECT EXISTS (
    SELECT 1 FROM public.message_usage_tracking
    WHERE user_id = '0b7be1ee-9e70-4ae3-945e-e906ffdb85b6'
      AND plan_limit = 200
  ) INTO v_tracking_created;

  IF v_subscription_created AND v_trial_created AND v_tracking_created THEN
    RAISE NOTICE 'Plano gratuito criado com sucesso para o usuário!';
    RAISE NOTICE 'Limite: 200 mensagens';
    RAISE NOTICE 'Validade: 30 dias a partir de agora';
  ELSE
    RAISE EXCEPTION 'Erro ao criar plano gratuito - verifique os registros';
  END IF;
END $$;

COMMIT;

-- ============================================
-- CONSULTA PARA VERIFICAR O STATUS DO PLANO
-- ============================================

/*
-- Execute esta consulta para verificar o status:

SELECT
  ps.id as subscription_id,
  ps.user_id,
  ps.plan_type,
  ps.status,
  ps.current_period_start,
  ps.current_period_end,
  ftu.messages_limit,
  ftu.consumed_messages,
  ftu.expires_at as trial_expires_at,
  mut.ai_messages_sent,
  mut.plan_limit,
  (mut.plan_limit - mut.ai_messages_sent) as messages_remaining
FROM public.plan_subscriptions ps
LEFT JOIN public.free_trial_usage ftu ON ps.user_id = ftu.user_id
LEFT JOIN public.message_usage_tracking mut ON ps.user_id = mut.user_id
WHERE ps.user_id = '0b7be1ee-9e70-4ae3-945e-e906ffdb85b6'
ORDER BY ps.created_at DESC;
*/