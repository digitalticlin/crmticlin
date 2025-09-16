-- ================================================================
-- 🔍 VERIFICAR ESTADO ATUAL DO SISTEMA
-- ================================================================

-- 1️⃣ Verificar estrutura da tabela messages
SELECT
    '📋 COLUNAS DA TABELA MESSAGES' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
AND table_schema = 'public'
AND column_name IN ('media_url', 'media_type', 'external_message_id')
ORDER BY ordinal_position;

-- 2️⃣ Verificar qual função está ativa
SELECT
    '🔧 FUNÇÃO ATIVA' as info,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as definition_preview
FROM pg_proc p
WHERE p.proname = 'save_received_message_webhook'
AND p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 3️⃣ Verificar mensagens recentes
SELECT
    '📝 MENSAGENS RECENTES' as info,
    id,
    media_type,
    media_url,
    external_message_id,
    created_at
FROM public.messages
ORDER BY created_at DESC
LIMIT 3;

-- 4️⃣ Verificar se base64 está chegando na edge
SELECT
    '📦 FILA STATUS' as info,
    queue_name,
    queue_length,
    'Mensagens pendentes' as note
FROM pgmq.metrics('webhook_message_queue');