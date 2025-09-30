-- ============================================
-- SQL para excluir usuários de teste
-- Data: 2025-09-27
-- ============================================

-- 1. Excluir os 3 usuários do auth.users
-- (CASCADE irá excluir automaticamente de profiles, plan_subscriptions, etc.)
DELETE FROM auth.users
WHERE id IN (
  '186d008e-e34f-4659-9231-9c624c513f64',
  '34fdf77a-3d83-4816-8bc9-4da4670cc709',
  'a356bb42-8f9a-4e49-b8ae-f23f597a5b4f'
);

-- 2. Verificar se foram excluídos
SELECT id, email, created_at
FROM auth.users
WHERE id IN (
  '186d008e-e34f-4659-9231-9c624c513f64',
  '34fdf77a-3d83-4816-8bc9-4da4670cc709',
  'a356bb42-8f9a-4e49-b8ae-f23f597a5b4f'
);
-- Deve retornar 0 linhas se exclusão foi bem-sucedida

-- 3. Verificar se profiles também foram excluídos (deve retornar 0)
SELECT id, full_name, email
FROM profiles
WHERE id IN (
  '186d008e-e34f-4659-9231-9c624c513f64',
  '34fdf77a-3d83-4816-8bc9-4da4670cc709',
  'a356bb42-8f9a-4e49-b8ae-f23f597a5b4f'
);
-- Deve retornar 0 linhas

-- 4. Verificar se plan_subscriptions também foram excluídos (deve retornar 0)
SELECT user_id, plan_type, status
FROM plan_subscriptions
WHERE user_id IN (
  '186d008e-e34f-4659-9231-9c624c513f64',
  '34fdf77a-3d83-4816-8bc9-4da4670cc709',
  'a356bb42-8f9a-4e49-b8ae-f23f597a5b4f'
);
-- Deve retornar 0 linhas

-- ✅ Pronto para criar novas contas de teste!