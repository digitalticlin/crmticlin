-- ================================================================
-- 🚀 FORÇAR PROCESSAMENTO COMPLETO DA FILA E DIAGNÓSTICO FULL
-- ================================================================

-- 1️⃣ Ver status completo da fila webhook
SELECT
    '📊 FILA WEBHOOK - STATUS COMPLETO' as info,
    queue_name,
    queue_length,
    oldest_msg_age_sec,
    newest_msg_age_sec,
    total_messages,
    CASE
        WHEN queue_length = 0 THEN '✅ FILA VAZIA'
        WHEN queue_length < 3 THEN '⚠️ POUCOS PENDENTES'
        ELSE '❌ MUITOS PENDENTES (' || queue_length || ')'
    END as status_fila
FROM pgmq.metrics('webhook_message_queue');

-- 2️⃣ Ver TODAS as mensagens na fila (sem limite)
SELECT
    '📋 TODAS MENSAGENS NA FILA' as info,
    msg_id,
    read_ct,
    enqueued_at,
    message->>'message_id' as message_id,
    message->>'media_type' as media_type,
    message->>'external_message_id' as external_id,
    CASE
        WHEN LENGTH(COALESCE(message->>'base64_data', '')) > 100
        THEN '✅ BASE64 OK (' || LENGTH(message->>'base64_data') || ' chars)'
        ELSE '❌ SEM BASE64 VÁLIDO'
    END as base64_status,
    ROUND(EXTRACT(EPOCH FROM (NOW() - enqueued_at))/60, 2) as minutes_waiting
FROM pgmq.read('webhook_message_queue', 1, 50)  -- Ler até 50 mensagens
ORDER BY enqueued_at ASC;

-- 3️⃣ FORÇAR PROCESSAMENTO COMPLETO - Executar worker até esgotar fila
SELECT
    '🤖 FORÇAR PROCESSAMENTO TOTAL - ROUND 1' as action,
    process_webhook_media_isolated() as resultado_1;

SELECT
    '🤖 FORÇAR PROCESSAMENTO TOTAL - ROUND 2' as action,
    process_webhook_media_isolated() as resultado_2;

SELECT
    '🤖 FORÇAR PROCESSAMENTO TOTAL - ROUND 3' as action,
    process_webhook_media_isolated() as resultado_3;

-- 4️⃣ Verificar se fila está vazia agora
SELECT
    '📊 FILA APÓS 3 ROUNDS DE PROCESSAMENTO' as info,
    queue_name,
    queue_length,
    CASE
        WHEN queue_length = 0 THEN '✅ FILA COMPLETAMENTE VAZIA'
        ELSE '⚠️ AINDA RESTAM ' || queue_length || ' MENSAGENS'
    END as status_final
FROM pgmq.metrics('webhook_message_queue');

-- 5️⃣ Verificar se existem URLs inválidas ou problemas
SELECT
    '🔍 DIAGNÓSTICO URLS GERADAS' as check,
    id,
    media_type,
    CASE
        WHEN media_url IS NULL THEN '❌ URL NULL'
        WHEN media_url = '' THEN '❌ URL VAZIA'
        WHEN media_url LIKE 'https://rhjgagzstjzynvrakdyj.supabase.co/storage%' THEN '✅ URL STORAGE OK'
        WHEN media_url LIKE 'data:%' THEN '⚠️ URL BASE64 (FALLBACK)'
        ELSE '❓ URL DESCONHECIDA'
    END as url_diagnosis,
    LEFT(media_url, 100) as url_sample,
    created_at,
    ROUND(EXTRACT(EPOCH FROM (NOW() - created_at))/60, 2) as minutes_ago
FROM public.messages
WHERE media_type != 'text'
AND source_edge = 'webhook_whatsapp_web'
AND created_at >= NOW() - INTERVAL '3 hours'
ORDER BY created_at DESC
LIMIT 10;

-- 6️⃣ Testar URL de uma mensagem específica (verificar se arquivo existe)
WITH latest_message AS (
    SELECT id, media_url, media_type, created_at
    FROM public.messages
    WHERE media_type != 'text'
    AND source_edge = 'webhook_whatsapp_web'
    AND media_url IS NOT NULL
    AND created_at >= NOW() - INTERVAL '1 hour'
    ORDER BY created_at DESC
    LIMIT 1
)
SELECT
    '🧪 TESTAR ÚLTIMA URL GERADA' as test,
    id,
    media_type,
    media_url,
    CASE
        WHEN media_url LIKE 'https://rhjgagzstjzynvrakdyj.supabase.co/storage%'
        THEN '✅ URL FORMATO CORRETO - Testar manualmente no navegador'
        ELSE '❌ URL FORMATO INCORRETO'
    END as url_test_result,
    created_at
FROM latest_message;

-- 7️⃣ Verificar se worker function está funcionando corretamente
SELECT
    '⚙️ TESTE DIRETO WORKER FUNCTION' as test,
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'process_webhook_media_isolated')
        THEN '✅ WORKER FUNCTION EXISTS'
        ELSE '❌ WORKER FUNCTION MISSING'
    END as worker_status;