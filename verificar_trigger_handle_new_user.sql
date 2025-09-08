-- VERIFICAR se handle_new_user() está mudando status de convites incorretamente

-- 1. Ver código atual da função handle_new_user
SELECT prosrc 
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'handle_new_user' AND n.nspname = 'public';

-- 2. Ver logs recentes do banco (se disponível)
-- Esta query pode não funcionar se não tiver acesso aos logs
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%invite_status%' OR query LIKE '%accepted%'
LIMIT 5;

-- 3. Resetar profile da Nathi para teste controlado
UPDATE profiles 
SET 
    linked_auth_user_id = NULL,
    invite_status = 'invite_sent',
    invite_token = '0612826f-d353-4156-8189-d7c4d5b95f73'
WHERE email = 'nathirosa26@gmail.com';

-- 4. Verificar estado ANTES do teste
SELECT 
    id,
    full_name,
    email,
    linked_auth_user_id,
    invite_status,
    invite_token
FROM profiles 
WHERE email = 'nathirosa26@gmail.com';

-- 5. SIMULAR: Ver se algum trigger muda o status automaticamente
-- (Esta query NÃO vai executar nada, só mostra o que aconteceria)
EXPLAIN (ANALYZE, BUFFERS) 
UPDATE profiles 
SET invite_status = 'test' 
WHERE email = 'nathirosa26@gmail.com';

ROLLBACK; -- Cancelar a mudança