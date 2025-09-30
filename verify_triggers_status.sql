-- Verificar se os triggers estão ativos

-- 1. Verificar trigger on_auth_user_created
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 2. Verificar trigger trigger_activate_plan_on_register
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_activate_plan_on_register';

-- 3. Verificar trigger trigger_paid_plan_checkout_redirect
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_paid_plan_checkout_redirect';

-- 4. Verificar último usuário criado em auth.users
SELECT
  id,
  email,
  created_at,
  raw_user_meta_data->>'selected_plan' as selected_plan
FROM auth.users
ORDER BY created_at DESC
LIMIT 1;

-- 5. Verificar se profile foi criado
SELECT
  id,
  full_name,
  email,
  role,
  selected_plan,
  created_by_user_id,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 1;