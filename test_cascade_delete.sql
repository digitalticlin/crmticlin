-- ============================================
-- Verificar se CASCADE DELETE está funcionando
-- Testar com usuário: 223fb7c5-1f82-4df7-8aa6-89ea2b47ac0e
-- ============================================

-- 1. ANTES DE DELETAR - Verificar o que existe para este usuário
-- Auth user
SELECT 'AUTH USER' as tipo, id, email, created_at
FROM auth.users
WHERE id = '223fb7c5-1f82-4df7-8aa6-89ea2b47ac0e';

-- Profile
SELECT 'PROFILE' as tipo, id, full_name, email, role, created_at
FROM profiles
WHERE id = '223fb7c5-1f82-4df7-8aa6-89ea2b47ac0e';

-- Planos
SELECT 'PLAN_SUBSCRIPTION' as tipo, user_id, plan_type, status
FROM plan_subscriptions
WHERE user_id = '223fb7c5-1f82-4df7-8aa6-89ea2b47ac0e';

SELECT 'FREE_TRIAL' as tipo, user_id, messages_limit, consumed_messages
FROM free_trial_usage
WHERE user_id = '223fb7c5-1f82-4df7-8aa6-89ea2b47ac0e';

SELECT 'MESSAGE_USAGE' as tipo, user_id, plan_limit, ai_messages_sent
FROM message_usage_tracking
WHERE user_id = '223fb7c5-1f82-4df7-8aa6-89ea2b47ac0e';

-- Funnels criados
SELECT 'FUNNELS' as tipo, id, name, created_by_user_id
FROM funnels
WHERE created_by_user_id = '223fb7c5-1f82-4df7-8aa6-89ea2b47ac0e';

-- Leads criados
SELECT 'LEADS' as tipo, id, name, created_by_user_id
FROM leads
WHERE created_by_user_id = '223fb7c5-1f82-4df7-8aa6-89ea2b47ac0e';

-- WhatsApp instances
SELECT 'WHATSAPP_INSTANCES' as tipo, id, instance_name, created_by_user_id
FROM whatsapp_instances
WHERE created_by_user_id = '223fb7c5-1f82-4df7-8aa6-89ea2b47ac0e';

-- AI Agents
SELECT 'AI_AGENTS' as tipo, id, name, created_by_user_id
FROM ai_agents
WHERE created_by_user_id = '223fb7c5-1f82-4df7-8aa6-89ea2b47ac0e';

-- 2. Verificar se TRIGGER de delete existe e está ativo
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_cleanup_auth_user_on_profile_delete';

-- 3. Verificar se há EDGE FUNCTION delete_auth_user
-- (Não é possível verificar edge functions via SQL, mas podemos ver se há alguma chamada configurada)

-- 4. Verificar FOREIGN KEYS e CASCADE configurados
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (ccu.table_name = 'profiles' OR ccu.table_name = 'auth.users')
ORDER BY tc.table_name;

-- ============================================
-- ATENÇÃO: NÃO EXECUTE O DELETE AINDA!
-- Primeiro analise os resultados acima
-- ============================================

-- Para testar o DELETE (executar APENAS se tiver certeza):
-- DELETE FROM profiles WHERE id = '223fb7c5-1f82-4df7-8aa6-89ea2b47ac0e';

-- Depois do DELETE, execute novamente as queries do item 1 para ver o que foi deletado