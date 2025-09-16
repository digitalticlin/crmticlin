-- ================================================================
-- 🔍 VERIFICAR SE WORKER PROCESSOU A MÍDIA
-- ================================================================

-- 1. Ver a mensagem criada
SELECT 
    'Mensagem criada' as status,
    id,
    text,
    media_type,
    media_url,
    CASE 
        WHEN media_url IS NOT NULL THEN 'PROCESSADA ✅'
        ELSE 'SEM URL ❌'
    END as status_processamento
FROM public.messages 
WHERE id = '654ac425-c155-49eb-a0ce-84e056a2b1be';

-- 2. Ver fila webhook_message_queue
SELECT 
    'Fila webhook_message_queue' as info,
    (pgmq.metrics('webhook_message_queue')).queue_length as mensagens_na_fila;

-- 3. Ver mensagens processadas recentemente 
SELECT 
    'Últimas mensagens' as info,
    id,
    text,
    media_type,
    CASE 
        WHEN media_url IS NOT NULL AND media_url LIKE 'https://%' THEN 'COM URL ✅'
        WHEN media_url IS NOT NULL THEN 'URL INVÁLIDA ⚠️'
        ELSE 'SEM URL ❌'
    END as status_url,
    CASE 
        WHEN length(media_url) > 70 THEN left(media_url, 67) || '...'
        ELSE media_url
    END as url_preview,
    created_at
FROM public.messages 
WHERE created_at > now() - interval '10 minutes'
ORDER BY created_at DESC
LIMIT 5;