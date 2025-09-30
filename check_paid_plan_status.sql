-- ============================================
-- Verificar status de plano PAGO após registro
-- Substitua USER_ID pelo ID do usuário criado
-- ============================================

-- SUBSTITUA AQUI:
-- \set user_id 'COLE_O_ID_DO_USUARIO_AQUI'

-- 1. Verificar profile criado
SELECT
  id,
  full_name,
  email,
  role,
  selected_plan,
  created_by_user_id,
  created_at
FROM profiles
WHERE id = :'user_id';

-- 2. Verificar plan_subscriptions (deve estar como 'pending')
SELECT
  user_id,
  plan_type,
  status,
  member_limit,
  current_period_start,
  current_period_end,
  has_used_free_trial,
  created_at
FROM plan_subscriptions
WHERE user_id = :'user_id';

-- 3. Verificar se NÃO criou em free_trial_usage (deve estar vazio)
SELECT
  user_id,
  activated_at,
  expires_at,
  messages_limit,
  consumed_messages
FROM free_trial_usage
WHERE user_id = :'user_id';

-- 4. Verificar se NÃO criou em message_usage_tracking ainda (deve estar vazio)
SELECT
  user_id,
  plan_limit,
  period_start,
  period_end,
  ai_messages_sent,
  status
FROM message_usage_tracking
WHERE user_id = :'user_id';

-- ============================================
-- RESULTADO ESPERADO ANTES DO PAGAMENTO:
-- ============================================
-- 1. Profile: selected_plan = 'pro_5k', email preenchido, created_by_user_id preenchido
-- 2. plan_subscriptions: plan_type = 'pro_5k', status = 'pending'
-- 3. free_trial_usage: VAZIO (sem registros)
-- 4. message_usage_tracking: VAZIO (sem registros)

-- ============================================
-- Depois que o pagamento for confirmado no Mercado Pago:
-- O webhook vai ativar o plano e criar os registros
-- ============================================