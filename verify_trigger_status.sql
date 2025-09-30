-- ============================================
-- Verificar status do trigger on_auth_user_created
-- Data: 2025-09-27
-- ============================================

-- 1. Verificar se trigger existe e está ativo
SELECT
    trigger_name,
    event_object_schema,
    event_object_table,
    action_statement,
    action_timing,
    event_manipulation,
    action_orientation
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 2. Verificar se função handle_new_user existe
SELECT
    proname as function_name,
    prosrc as function_body
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 3. Ver os últimos usuários criados em auth.users
SELECT
    id,
    email,
    created_at,
    raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 4. Ver os últimos profiles criados
SELECT
    id,
    full_name,
    email,
    role,
    selected_plan,
    created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

-- 5. Verificar se há usuários em auth.users SEM profile correspondente
SELECT
    u.id,
    u.email,
    u.created_at as auth_created_at,
    p.id as profile_id
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- 6. Testar manualmente a função (OPCIONAL - comentado por segurança)
-- ATENÇÃO: Só execute se quiser testar com um usuário específico
/*
DO $$
DECLARE
  test_user RECORD;
BEGIN
  -- Buscar último usuário criado
  SELECT * INTO test_user
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 1;

  -- Executar função manualmente
  PERFORM public.handle_new_user_manual(test_user);

  RAISE NOTICE 'Teste executado para usuário: %', test_user.email;
END $$;
*/