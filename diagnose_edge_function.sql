-- ================================================================
-- 🔍 DIAGNÓSTICO DA EDGE FUNCTION
-- ================================================================

-- 1️⃣ Verificar logs das tentativas de HTTP
SELECT
    '📊 STATUS FINAL DA FILA' as info,
    queue_name,
    queue_length,
    'Mensagens processadas mas uploads falharam' as note
FROM pgmq.metrics('webhook_message_queue');

-- 2️⃣ Verificar mensagens criadas pelo worker
SELECT
    '📝 MENSAGENS DO WORKER SIMPLIFICADO' as check,
    COUNT(*) as total_created,
    COUNT(CASE WHEN media_url IS NOT NULL THEN 1 END) as with_urls,
    'URLs fallback geradas' as note
FROM public.messages
WHERE external_message_id LIKE 'simple_%'
AND created_at >= NOW() - INTERVAL '10 minutes';

-- 3️⃣ Pegar algumas URLs para testar manualmente
SELECT
    '🔗 URLS PARA TESTE MANUAL' as check,
    media_url,
    media_type,
    external_message_id
FROM public.messages
WHERE external_message_id LIKE 'simple_%'
AND created_at >= NOW() - INTERVAL '10 minutes'
AND media_url IS NOT NULL
LIMIT 3;

-- 4️⃣ Estatísticas finais do sistema
SELECT
    '📊 ESTATÍSTICAS COMPLETAS' as info,
    COUNT(*) as total_messages,
    COUNT(CASE WHEN media_url IS NOT NULL THEN 1 END) as with_media_url,
    ROUND(
        (COUNT(CASE WHEN media_url IS NOT NULL THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
    ) as percentage_with_url,
    COUNT(CASE WHEN media_type != 'text' THEN 1 END) as media_messages,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 hour' THEN 1 END) as last_hour
FROM public.messages;