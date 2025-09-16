-- ================================================================
-- 🎯 SOLUÇÃO CORRETA: USAR EDGE FUNCTION EXISTENTE
-- ================================================================

-- RPC que processa fila usando a edge function webhook_storage_upload
CREATE OR REPLACE FUNCTION process_queue_with_correct_edge()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_queue_msg RECORD;
    v_processed INTEGER := 0;
    v_uploaded INTEGER := 0;
    v_errors INTEGER := 0;
    v_http_result JSONB;
    v_file_path TEXT;
    v_extension TEXT;
    v_storage_url TEXT;
    v_upload_payload JSONB;
BEGIN
    RAISE NOTICE '🚀 Processando fila com edge function webhook_storage_upload...';

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
        FROM pgmq.read('webhook_message_queue', 20, 30)
        WHERE message->>'base64_data' IS NOT NULL
        AND LENGTH(message->>'base64_data') > 100
    )
    LOOP
        BEGIN
            -- Gerar path do arquivo no formato correto
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

            -- Preparar payload para edge function
            v_upload_payload := jsonb_build_object(
                'file_path', v_file_path,
                'base64_data', v_queue_msg.base64_data,
                'content_type', v_queue_msg.mime_type,
                'message_id', v_queue_msg.msg_id
            );

            -- Chamar edge function webhook_storage_upload
            BEGIN
                SELECT net.http_post(
                    'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_storage_upload',
                    v_upload_payload,
                    headers := jsonb_build_object(
                        'Content-Type', 'application/json',
                        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
                    )
                ) INTO v_http_result;

                -- Verificar se upload foi bem-sucedido
                IF v_http_result->>'status_code' = '200' AND
                   (v_http_result->'body'->>'success')::boolean = true THEN

                    v_storage_url := v_http_result->'body'->>'url';
                    v_uploaded := v_uploaded + 1;

                    RAISE NOTICE '✅ Upload realizado: % -> %', v_queue_msg.msg_id, v_storage_url;
                ELSE
                    -- Fallback: gerar URL mesmo sem upload
                    v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' || v_file_path;
                    RAISE NOTICE '⚠️ Upload falhou para %: %, usando URL fallback', v_queue_msg.msg_id, v_http_result->>'status_code';
                END IF;

            EXCEPTION
                WHEN OTHERS THEN
                    -- Fallback: gerar URL mesmo sem upload
                    v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' || v_file_path;
                    RAISE NOTICE '⚠️ Erro HTTP para %: %, usando URL fallback', v_queue_msg.msg_id, SQLERRM;
            END;

            -- Processar mensagem com URL (real ou fallback)
            PERFORM save_received_message_webhook(
                v_queue_msg.instance_id::UUID,
                v_queue_msg.phone,
                COALESCE(v_queue_msg.message_text, 'Mensagem da Fila'),
                COALESCE(v_queue_msg.from_me::BOOLEAN, false),
                v_queue_msg.media_type,
                v_storage_url,
                'edge_real_' || v_queue_msg.msg_id::text,
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
            v_processed := v_processed + 1;

        EXCEPTION
            WHEN OTHERS THEN
                v_errors := v_errors + 1;
                RAISE NOTICE '❌ Erro processando %: %', v_queue_msg.msg_id, SQLERRM;
        END;
    END LOOP;

    RETURN jsonb_build_object(
        'processed', v_processed,
        'real_uploads', v_uploaded,
        'fallback_urls', v_processed - v_uploaded,
        'errors', v_errors,
        'upload_success_rate', CASE
            WHEN v_processed > 0 THEN ROUND((v_uploaded::DECIMAL / v_processed) * 100, 2)
            ELSE 0
        END
    );
END;
$$;

-- EXECUTAR PROCESSAMENTO COM EDGE FUNCTION REAL
SELECT
    '🎯 PROCESSAMENTO COM EDGE REAL' as action,
    process_queue_with_correct_edge() as result;