-- Verificar dados do usuário 0cea854b-ba27-40f3-afde-47bfd8a39bc8 após upgrade

-- 1. Plan Subscriptions
SELECT
  'plan_subscriptions' as tabela,
  id,
  user_id,
  plan_type,
  status,
  stripe_customer_id,
  stripe_subscription_id,
  member_limit,
  current_period_start,
  current_period_end,
  has_used_free_trial,
  payment_overdue_since,
  platform_blocked_at,
  created_at,
  updated_at
FROM plan_subscriptions
WHERE user_id = '0cea854b-ba27-40f3-afde-47bfd8a39bc8'
ORDER BY created_at DESC;

-- 2. Free Trial Usage
SELECT
  'free_trial_usage' as tabela,
  id,
  user_id,
  activated_at,
  expires_at,
  messages_limit,
  consumed_messages,
  created_at
FROM free_trial_usage
WHERE user_id = '0cea854b-ba27-40f3-afde-47bfd8a39bc8';

-- 3. Message Usage Tracking
SELECT
  'message_usage_tracking' as tabela,
  id,
  user_id,
  plan_limit,
  messages_sent_count,
  messages_received_count,
  total_messages_count,
  ai_messages_sent,
  period_start,
  period_end,
  status,
  created_at,
  updated_at
FROM message_usage_tracking
WHERE user_id = '0cea854b-ba27-40f3-afde-47bfd8a39bc8'
ORDER BY created_at DESC;

-- 4. Payment History
SELECT
  'payment_history' as tabela,
  id,
  user_id,
  payment_id,
  payment_method,
  status,
  amount,
  plan_type,
  gateway,
  paid_at,
  created_at
FROM payment_history
WHERE user_id = '0cea854b-ba27-40f3-afde-47bfd8a39bc8'
ORDER BY created_at DESC;