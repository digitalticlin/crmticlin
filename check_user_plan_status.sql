-- Verificar status do plano para o usuário
-- ID: 6baaed53-9a50-417d-a029-9eae885ac86d

-- 1. Verificar se profile existe e qual o selected_plan
SELECT
  id,
  full_name,
  email,
  role,
  selected_plan,
  created_at
FROM profiles
WHERE id = '6baaed53-9a50-417d-a029-9eae885ac86d';

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
WHERE user_id = '6baaed53-9a50-417d-a029-9eae885ac86d';

-- 3. Verificar se há registro em free_trial_usage
SELECT
  user_id,
  activated_at,
  expires_at,
  messages_limit,
  consumed_messages,
  created_at
FROM free_trial_usage
WHERE user_id = '6baaed53-9a50-417d-a029-9eae885ac86d';

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
WHERE user_id = '6baaed53-9a50-417d-a029-9eae885ac86d';

-- 5. Verificar se trigger trigger_activate_plan_on_register existe e está ativo
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_activate_plan_on_register';

-- 6. Verificar se constraints UNIQUE foram criadas
SELECT
  conname as constraint_name,
  conrelid::regclass as table_name
FROM pg_constraint
WHERE conname IN (
  'free_trial_usage_user_id_key',
  'plan_subscriptions_user_id_key',
  'message_usage_tracking_user_id_key'
);