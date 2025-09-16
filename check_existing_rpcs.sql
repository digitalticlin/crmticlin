-- ================================================================
-- 🔍 VERIFICAR RPCs EXISTENTES NO BANCO
-- ================================================================

-- 1️⃣ Listar todas as funções relacionadas a mensagens
SELECT
    '📋 FUNÇÕES DE MENSAGEM' as info,
    proname as function_name,
    pronargs as num_args,
    prorettype::regtype as return_type,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND proname LIKE '%save_%message%'
ORDER BY proname;

-- 2️⃣ Verificar especificamente as 3 funções principais
SELECT
    '🎯 RPCs PRINCIPAIS' as info,
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'save_received_message_webhook') as webhook_exists,
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'save_sent_message_from_app') as app_exists,
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'save_sent_message_from_ai') as ai_exists;

-- 3️⃣ Verificar duplicações ou versões antigas
SELECT
    '⚠️ POSSÍVEIS DUPLICATAS' as info,
    proname as function_name,
    COUNT(*) as versions,
    array_agg(pronargs) as arg_counts
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND (proname LIKE '%save_received_message%'
       OR proname LIKE '%save_sent_message%'
       OR proname LIKE '%process_message%'
       OR proname LIKE '%webhook_message%')
GROUP BY proname
HAVING COUNT(*) > 1
ORDER BY proname;

-- 4️⃣ Funções obsoletas relacionadas a PGMQ/Workers
SELECT
    '🗑️ FUNÇÕES OBSOLETAS' as info,
    proname as function_name,
    pronargs as num_args
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND (proname LIKE '%worker%'
       OR proname LIKE '%queue%'
       OR proname LIKE '%pgmq%'
       OR proname LIKE '%process_webhook%'
       OR proname LIKE '%process_app%'
       OR proname LIKE '%process_ai%')
ORDER BY proname;