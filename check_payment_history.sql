-- Verificar se payment_history está vazio para o usuário
SELECT COUNT(*) as total FROM payment_history
WHERE user_id = '1346c89b-b6f0-47be-8e15-f81aa15b3fb0';

-- Ver todos os registros de payment_history do usuário
SELECT
  id,
  payment_id,
  payment_method,
  status,
  amount,
  plan_type,
  gateway,
  paid_at,
  created_at
FROM payment_history
WHERE user_id = '1346c89b-b6f0-47be-8e15-f81aa15b3fb0'
ORDER BY created_at DESC;