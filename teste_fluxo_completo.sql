-- ================================================================
-- 🚀 TESTE COMPLETO: NOVA MENSAGEM → RPC → WORKER → URL
-- ================================================================

-- 1. CRIAR NOVA MENSAGEM DE TESTE VIA RPC
SELECT save_received_message_webhook(
    '712e7708-2299-4a00-9128-577c8f113ca4'::UUID,
    '+5511888888888',
    'Teste final',
    false,
    'video',
    'teste_final_' || extract(epoch from now())::text,
    extract(epoch from now())::bigint,
    'base64_video_data_fake',
    'video/mp4',
    'teste_final.mp4'
) as nova_mensagem_criada;

-- 2. VER FILA ATUAL
SELECT 
    'Fila após criar nova mensagem' as info,
    (pgmq.metrics('webhook_message_queue')).queue_length as total_na_fila;

-- 3. EXECUTAR WORKER MANUALMENTE
SELECT webhook_whatsapp_web_media_worker(3) as resultado_worker;

-- 4. VER FILA APÓS WORKER
SELECT 
    'Fila após executar worker' as info,
    (pgmq.metrics('webhook_message_queue')).queue_length as total_na_fila;

-- 5. VER MENSAGENS COM URLS GERADAS
SELECT 
    'Mensagens com URLs' as resultado,
    id,
    text,
    media_type,
    CASE 
        WHEN media_url IS NOT NULL AND media_url LIKE 'https://%' THEN 'URL OK ✅'
        ELSE 'SEM URL ❌'
    END as status,
    left(media_url, 80) as url_preview,
    created_at
FROM public.messages 
WHERE created_at > now() - interval '5 minutes'
AND media_type != 'text'
ORDER BY created_at DESC
LIMIT 3;