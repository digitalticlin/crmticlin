-- ================================================================
-- 🔍 INVESTIGAR POR QUE MÍDIA NÃO RENDERIZA
-- ================================================================

-- 1️⃣ Verificar se a mensagem está na fila
SELECT 
    '📦 STATUS FILA WEBHOOK' as info,
    queue_name,
    queue_length,
    oldest_msg_age_sec,
    newest_msg_age_sec,
    total_messages
FROM pgmq.metrics('webhook_message_queue');

-- 2️⃣ Ver mensagens na fila (relacionada ao document que não renderiza)
SELECT 
    '📋 MENSAGENS NA FILA' as info,
    msg_id,
    read_ct,
    enqueued_at,
    message->>'message_id' as message_id_in_queue,
    message->>'media_type' as media_type_in_queue,
    message->>'external_message_id' as external_id,
    CASE 
        WHEN message->>'message_id' = 'f63ad4b5-78aa-4e26-a634-d7948d6e6dbe' 
        THEN '🎯 NOSSA MENSAGEM'
        ELSE 'Outra mensagem'
    END as is_our_message
FROM pgmq.read('webhook_message_queue', 1, 10)
ORDER BY enqueued_at DESC;

-- 3️⃣ Verificar se trigger disparou para nossa mensagem
SELECT 
    '🔥 VERIFICAR SE TRIGGER DISPAROU' as check,
    id,
    media_type,
    source_edge,
    import_source,
    external_message_id,
    created_at,
    CASE 
        WHEN media_type != 'text' 
        AND source_edge = 'webhook_whatsapp_web'
        AND import_source = 'webhook'
        THEN '✅ TRIGGER DEVE TER DISPARADO'
        ELSE '❌ TRIGGER NÃO DISPAROU'
    END as trigger_status
FROM public.messages
WHERE id = 'f63ad4b5-78aa-4e26-a634-d7948d6e6dbe';

-- 4️⃣ Testar worker manualmente com nossa mensagem
SELECT 
    '⚙️ TESTE MANUAL WORKER' as teste,
    process_webhook_media_isolated('f63ad4b5-78aa-4e26-a634-d7948d6e6dbe'::uuid) as resultado_worker;

-- 5️⃣ Verificar se arquivo existe no Storage (simular)
-- Tentar acessar a URL diretamente seria ideal, mas vamos verificar se worker processou

-- 6️⃣ Ver últimos logs do sistema (se disponível)
-- Verificar se há mensagens de erro ou processamento

-- 7️⃣ DIAGNÓSTICO FINAL
SELECT 
    '🎯 DIAGNÓSTICO MÍDIA NÃO RENDERIZA' as diagnostico,
    jsonb_build_object(
        'message_id', 'f63ad4b5-78aa-4e26-a634-d7948d6e6dbe',
        'media_url_gerada', 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/webhook/document/2025-09-14/msg_f63ad4b5_1757879422.028389.pdf',
        'problema_provavel', 'Worker não está processando fila automaticamente',
        'solucao', 'Ativar trigger automático para chamar worker',
        'fila_length', (SELECT queue_length FROM pgmq.metrics('webhook_message_queue')),
        'trigger_exists', (
            SELECT COUNT(*) > 0
            FROM information_schema.triggers
            WHERE trigger_name = 'trigger_webhook_media_processor'
            AND event_object_table = 'messages'
        )
    ) as analise;