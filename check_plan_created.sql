-- Verificar se o plano foi criado para o usuário
-- ID: 223fb7c5-1f82-4df7-8aa6-89ea2b47ac0e

-- 1. Verificar profile
SELECT
  id,
  full_name,
  email,
  role,
  selected_plan,
  created_by_user_id,
  created_at
FROM profiles
WHERE id = '223fb7c5-1f82-4df7-8aa6-89ea2b47ac0e';

-- 2. Verificar se há registro em plan_subscriptions
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
WHERE user_id = '223fb7c5-1f82-4df7-8aa6-89ea2b47ac0e';

-- 3. Verificar se há registro em free_trial_usage
SELECT
  user_id,
  activated_at,
  expires_at,
  messages_limit,
  consumed_messages,
  created_at
FROM free_trial_usage
WHERE user_id = '223fb7c5-1f82-4df7-8aa6-89ea2b47ac0e';

-- 4. Verificar se há registro em message_usage_tracking
SELECT
  user_id,
  plan_limit,
  period_start,
  period_end,
  messages_sent_count,
  messages_received_count,
  total_messages_count,
  ai_messages_sent,
  status,
  created_at
FROM message_usage_tracking
WHERE user_id = '223fb7c5-1f82-4df7-8aa6-89ea2b47ac0e';

-- 5. Verificar se o trigger existe
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_activate_plan_on_register';