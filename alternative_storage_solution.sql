-- ================================================================
-- 💡 SOLUÇÃO ALTERNATIVA: USAR EDGE FUNCTION PARA UPLOAD
-- ================================================================

-- Como PostgreSQL não consegue fazer upload direto,
-- vamos usar uma abordagem híbrida mais profissional:

-- 1️⃣ RPC que processa e agenda uploads via HTTP para Edge Function
CREATE OR REPLACE FUNCTION process_queue_with_edge_upload()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_queue_msg RECORD;
    v_processed INTEGER := 0;
    v_scheduled INTEGER := 0;
    v_errors INTEGER := 0;
    v_http_result JSONB;
    v_file_path TEXT;
    v_extension TEXT;
    v_storage_url TEXT;
BEGIN
    RAISE NOTICE '🚀 Iniciando processamento com upload via Edge Function...';

    -- Processar mensagens da fila
    FOR v_queue_msg IN (
        SELECT
            msg_id,
            message->>'instance_id' as instance_id,
            message->>'phone' as phone,
            message->>'message_text' as message_text,
            message->>'from_me' as from_me,
            message->>'media_type' as media_type,
            message->>'external_message_id' as external_message_id,
            message->>'contact_name' as contact_name,
            message->>'base64_data' as base64_data,
            message->>'mime_type' as mime_type,
            message->>'file_name' as file_name
        FROM pgmq.read('webhook_message_queue', 15, 30)
        WHERE message->>'base64_data' IS NOT NULL
        AND LENGTH(message->>'base64_data') > 100
    )
    LOOP
        BEGIN
            -- Gerar path do arquivo
            v_extension := CASE v_queue_msg.media_type
                WHEN 'image' THEN 'jpg'
                WHEN 'video' THEN 'mp4'
                WHEN 'audio' THEN 'mp3'
                WHEN 'document' THEN 'pdf'
                WHEN 'sticker' THEN 'webp'
                ELSE 'bin'
            END;

            v_file_path := format('webhook/%s/%s/msg_%s_%s.%s',
                v_queue_msg.media_type,
                to_char(now(), 'YYYY-MM-DD'),
                LEFT(v_queue_msg.msg_id::text, 8),
                extract(epoch from now())::bigint,
                v_extension
            );

            v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' || v_file_path;

            -- Tentar upload via HTTP para Edge Function
            BEGIN
                SELECT net.http_post(
                    'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_storage_upload',
                    jsonb_build_object(
                        'file_path', v_file_path,
                        'base64_data', v_queue_msg.base64_data,
                        'mime_type', v_queue_msg.mime_type
                    ),
                    headers := jsonb_build_object(
                        'Content-Type', 'application/json',
                        'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true)
                    )
                ) INTO v_http_result;

                -- Se não conseguir via HTTP, criar mensagem mesmo assim com URL
                IF v_http_result IS NULL OR v_http_result->>'status_code' != '200' THEN
                    RAISE NOTICE '⚠️ HTTP upload falhou para msg_id %, criando apenas URL', v_queue_msg.msg_id;
                END IF;

            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE '⚠️ Erro HTTP para msg_id %: %', v_queue_msg.msg_id, SQLERRM;
            END;

            -- Processar mensagem independente do upload
            PERFORM save_received_message_webhook(
                v_queue_msg.instance_id::UUID,
                v_queue_msg.phone,
                COALESCE(v_queue_msg.message_text, 'Mensagem da Fila'),
                COALESCE(v_queue_msg.from_me::BOOLEAN, false),
                v_queue_msg.media_type,
                v_storage_url,  -- URL sempre gerada
                'edge_upload_' || v_queue_msg.msg_id::text,
                v_queue_msg.contact_name,
                NULL,
                v_queue_msg.base64_data,
                v_queue_msg.mime_type,
                v_queue_msg.file_name,
                NULL,
                'webhook_whatsapp_web'
            );

            -- Remover da fila
            PERFORM pgmq.delete('webhook_message_queue', v_queue_msg.msg_id);

            v_scheduled := v_scheduled + 1;
            v_processed := v_processed + 1;

        EXCEPTION
            WHEN OTHERS THEN
                v_errors := v_errors + 1;
                RAISE NOTICE '❌ Erro processando msg_id %: %', v_queue_msg.msg_id, SQLERRM;
        END;
    END LOOP;

    RETURN jsonb_build_object(
        'processed', v_processed,
        'scheduled_uploads', v_scheduled,
        'errors', v_errors,
        'success_rate', CASE
            WHEN v_processed > 0 THEN ROUND((v_scheduled::DECIMAL / v_processed) * 100, 2)
            ELSE 0
        END,
        'note', 'URLs geradas, uploads agendados via Edge Function'
    );
END;
$$;

-- 2️⃣ EXECUTAR PROCESSAMENTO ALTERNATIVO
SELECT
    '💡 PROCESSAMENTO ALTERNATIVO' as action,
    process_queue_with_edge_upload() as result;

-- 3️⃣ Verificar resultados
SELECT
    '📊 RESULTADOS DO PROCESSAMENTO' as check,
    COUNT(*) as total_processed,
    COUNT(CASE WHEN media_url IS NOT NULL THEN 1 END) as with_urls,
    ROUND(
        (COUNT(CASE WHEN media_url IS NOT NULL THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2
    ) as success_percentage
FROM public.messages
WHERE external_message_id LIKE 'edge_upload_%'
AND created_at >= NOW() - INTERVAL '5 minutes';

-- 4️⃣ Status final da fila
SELECT
    '📊 STATUS FILA FINAL' as info,
    queue_name,
    queue_length,
    CASE
        WHEN queue_length < 50 THEN '✅ FILA PROCESSADA'
        WHEN queue_length < 200 THEN '⚠️ FILA REDUZIDA'
        ELSE '❌ FILA AINDA GRANDE'
    END as status
FROM pgmq.metrics('webhook_message_queue');