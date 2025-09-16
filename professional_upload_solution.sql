-- ================================================================
-- 🏗️ SOLUÇÃO PROFISSIONAL: UPLOAD REAL DE ARQUIVOS
-- ================================================================

-- 1️⃣ FUNÇÃO DEDICADA PARA UPLOAD REAL NO STORAGE
CREATE OR REPLACE FUNCTION upload_base64_to_storage(
    p_file_path TEXT,
    p_base64_data TEXT,
    p_mime_type TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_clean_base64 TEXT;
    v_binary_data BYTEA;
    v_upload_result JSONB;
BEGIN
    -- Limpar base64 (remover prefixo data: se houver)
    v_clean_base64 := CASE
        WHEN p_base64_data LIKE 'data:%' THEN
            split_part(p_base64_data, ',', 2)
        ELSE
            p_base64_data
    END;

    -- Converter para binário
    v_binary_data := decode(v_clean_base64, 'base64');

    -- Upload usando extensão storage do Supabase
    BEGIN
        -- Método 1: Usar storage.objects.create
        SELECT storage.objects.create(
            'whatsapp-media',
            p_file_path,
            v_binary_data,
            COALESCE(p_mime_type, 'application/octet-stream')
        ) INTO v_upload_result;

        RETURN jsonb_build_object(
            'success', true,
            'method', 'storage.objects.create',
            'file_path', p_file_path,
            'file_size', LENGTH(v_binary_data)
        );

    EXCEPTION
        WHEN OTHERS THEN
            -- Método 2: Fallback usando INSERT direto
            BEGIN
                INSERT INTO storage.objects (
                    bucket_id,
                    name,
                    owner,
                    metadata
                ) VALUES (
                    'whatsapp-media',
                    p_file_path,
                    auth.uid(),
                    jsonb_build_object(
                        'size', LENGTH(v_binary_data),
                        'mimetype', p_mime_type
                    )
                );

                RETURN jsonb_build_object(
                    'success', true,
                    'method', 'direct_insert',
                    'file_path', p_file_path,
                    'file_size', LENGTH(v_binary_data)
                );

            EXCEPTION
                WHEN OTHERS THEN
                    RETURN jsonb_build_object(
                        'success', false,
                        'error', SQLERRM,
                        'file_path', p_file_path
                    );
            END;
    END;
END;
$$;

-- 2️⃣ WORKER PROFISSIONAL PARA PROCESSAR FILA COM UPLOAD REAL
CREATE OR REPLACE FUNCTION process_media_queue_professional()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_queue_msg RECORD;
    v_upload_result JSONB;
    v_processed INTEGER := 0;
    v_uploaded INTEGER := 0;
    v_errors INTEGER := 0;
    v_file_path TEXT;
    v_extension TEXT;
    v_storage_url TEXT;
BEGIN
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
        FROM pgmq.read('webhook_message_queue', 25, 30)
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

            -- Upload real do arquivo
            SELECT upload_base64_to_storage(
                v_file_path,
                v_queue_msg.base64_data,
                v_queue_msg.mime_type
            ) INTO v_upload_result;

            -- Se upload foi bem-sucedido, processar mensagem
            IF v_upload_result->>'success' = 'true' THEN
                v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' || v_file_path;

                -- Processar com RPC
                PERFORM save_received_message_webhook(
                    v_queue_msg.instance_id::UUID,
                    v_queue_msg.phone,
                    COALESCE(v_queue_msg.message_text, 'Mensagem da Fila'),
                    COALESCE(v_queue_msg.from_me::BOOLEAN, false),
                    v_queue_msg.media_type,
                    v_storage_url,  -- URL do arquivo real
                    'real_upload_' || v_queue_msg.msg_id::text,
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

                v_uploaded := v_uploaded + 1;
            END IF;

            v_processed := v_processed + 1;

        EXCEPTION
            WHEN OTHERS THEN
                v_errors := v_errors + 1;
        END;
    END LOOP;

    RETURN jsonb_build_object(
        'processed', v_processed,
        'uploaded', v_uploaded,
        'errors', v_errors,
        'success_rate', CASE
            WHEN v_processed > 0 THEN ROUND((v_uploaded::DECIMAL / v_processed) * 100, 2)
            ELSE 0
        END
    );
END;
$$;

-- 3️⃣ EXECUTAR PROCESSAMENTO PROFISSIONAL
SELECT
    '🏗️ PROCESSAMENTO PROFISSIONAL' as action,
    process_media_queue_professional() as result;