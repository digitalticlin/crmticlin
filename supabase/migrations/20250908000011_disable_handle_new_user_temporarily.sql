-- DESABILITAR temporariamente handle_new_user para testar isoladamente

-- 1. Ver estado atual do trigger
SELECT 
    trigger_name,
    event_object_table,
    action_statement,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 2. DESABILITAR o trigger (CUIDADO - não criar novos usuários /register enquanto desabilitado)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Verificar se foi removido
SELECT 
    trigger_name
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 4. Resetar profile da Nathi para teste limpo
UPDATE profiles 
SET 
    linked_auth_user_id = NULL,
    invite_status = 'invite_sent',
    invite_token = '0612826f-d353-4156-8189-d7c4d5b95f73'
WHERE email = 'nathirosa26@gmail.com';

-- 5. Confirmar reset
SELECT 
    id,
    full_name,
    email,
    linked_auth_user_id,
    invite_status,
    invite_token
FROM profiles 
WHERE email = 'nathirosa26@gmail.com';

-- AVISO: Lembrar de recriar o trigger depois dos testes!
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();