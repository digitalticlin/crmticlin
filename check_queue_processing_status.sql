-- ================================================================
-- 🔍 VERIFICAR STATUS DA FILA E PROCESSAMENTO AUTOMÁTICO
-- ================================================================

-- 1️⃣ Status atual da fila webhook
SELECT
    '📊 FILA WEBHOOK STATUS' as info,
    queue_name,
    queue_length,
    oldest_msg_age_sec,
    newest_msg_age_sec,
    total_messages,
    CASE
        WHEN queue_length = 0 THEN '✅ FILA VAZIA - TUDO PROCESSADO'
        WHEN queue_length < 5 THEN '⚠️ POUCOS PENDENTES - BOM'
        ELSE '❌ MUITOS PENDENTES - PROBLEMA'
    END as status_fila
FROM pgmq.metrics('webhook_message_queue');

-- 2️⃣ Ver mensagens ainda pendentes na fila (se houver)
SELECT
    '📋 MENSAGENS AINDA PENDENTES' as info,
    msg_id,
    read_ct,
    enqueued_at,
    message->>'message_id' as message_id,
    message->>'media_type' as media_type,
    message->>'external_message_id' as external_id,
    CASE
        WHEN LENGTH(message->>'base64_data') > 0
        THEN '✅ TEM BASE64 (' || LENGTH(message->>'base64_data') || ' chars)'
        ELSE '❌ SEM BASE64'
    END as base64_status,
    EXTRACT(EPOCH FROM (NOW() - enqueued_at))/60 as minutes_waiting
FROM pgmq.read('webhook_message_queue', 1, 10)
ORDER BY enqueued_at ASC;

-- 3️⃣ Verificar se trigger está realmente ativo
SELECT
    '🔥 TRIGGER STATUS' as check,
    trigger_name,
    event_object_table,
    action_timing,
    action_statement,
    CASE
        WHEN trigger_name = 'trigger_webhook_media_processor'
        THEN '✅ TRIGGER ATIVO'
        ELSE '❌ TRIGGER INCORRETO'
    END as trigger_status
FROM information_schema.triggers
WHERE trigger_name LIKE '%webhook%media%'
   OR trigger_name = 'trigger_webhook_media_processor';

-- 4️⃣ Forçar processamento manual de todas as mensagens pendentes
SELECT
    '🤖 FORÇAR PROCESSAMENTO MANUAL' as action,
    process_webhook_media_isolated() as resultado;

-- 5️⃣ Verificar novamente status da fila após processamento manual
SELECT
    '📊 FILA APÓS PROCESSAMENTO MANUAL' as info,
    queue_name,
    queue_length,
    CASE
        WHEN queue_length = 0 THEN '✅ FILA COMPLETAMENTE VAZIA'
        ELSE '⚠️ AINDA HÁ ' || queue_length || ' MENSAGENS'
    END as status_final
FROM pgmq.metrics('webhook_message_queue');

-- 6️⃣ Verificar últimas mensagens processadas recentemente
SELECT
    '📈 ÚLTIMAS MENSAGENS PROCESSADAS' as info,
    id,
    media_type,
    CASE
        WHEN media_url IS NOT NULL AND media_url != ''
        THEN '✅ PROCESSADA'
        ELSE '❌ SEM URL'
    END as processing_status,
    LEFT(media_url, 60) || '...' as url_preview,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_ago
FROM public.messages
WHERE media_type != 'text'
AND source_edge = 'webhook_whatsapp_web'
AND created_at >= NOW() - INTERVAL '2 hours'
ORDER BY created_at DESC
LIMIT 8;