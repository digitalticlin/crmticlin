-- ================================================================
-- 🔄 WORKER SIMPLES POSTGRESQL (FALLBACK)
-- ================================================================

-- Worker que processa fila sem depender de Edge Function
CREATE OR REPLACE FUNCTION process_queue_direct_fallback()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_queue_msg RECORD;
    v_processed INTEGER := 0;
    v_errors INTEGER := 0;
    v_file_path TEXT;
    v_extension TEXT;
    v_storage_url TEXT;
BEGIN
    RAISE NOTICE '🚀 Worker fallback iniciado...';

    -- Processar mensagens da fila
    FOR v_queue_msg IN (
        SELECT * FROM pgmq_read('webhook_message_queue', 20, 300)
    )
    LOOP
        BEGIN
            -- Gerar URL direta (sem upload real)
            v_extension := CASE v_queue_msg.message->>'media_type'
                WHEN 'image' THEN 'jpg'
                WHEN 'video' THEN 'mp4'
                WHEN 'audio' THEN 'mp3'
                WHEN 'document' THEN 'pdf'
                WHEN 'sticker' THEN 'webp'
                ELSE 'bin'
            END;

            v_file_path := format('webhook/%s/%s/msg_%s_%s.%s',
                v_queue_msg.message->>'media_type',
                to_char(now(), 'YYYY-MM-DD'),
                LEFT(v_queue_msg.msg_id::text, 8),
                extract(epoch from now())::bigint,
                v_extension
            );

            v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' || v_file_path;

            -- Salvar mensagem com RPC existente
            PERFORM save_received_message_webhook(
                (v_queue_msg.message->>'instance_id')::UUID,
                v_queue_msg.message->>'phone',
                COALESCE(v_queue_msg.message->>'message_text', 'Mensagem da Fila'),
                COALESCE((v_queue_msg.message->>'from_me')::BOOLEAN, false),
                v_queue_msg.message->>'media_type',
                v_storage_url,
                'fallback_' || v_queue_msg.msg_id::text,
                v_queue_msg.message->>'contact_name',
                v_queue_msg.message->>'profile_pic_url',
                v_queue_msg.message->>'base64_data',
                v_queue_msg.message->>'mime_type',
                v_queue_msg.message->>'file_name',
                (v_queue_msg.message->>'whatsapp_number_id')::UUID,
                'webhook_whatsapp_web'
            );

            -- Remover da fila
            PERFORM pgmq_delete('webhook_message_queue', v_queue_msg.msg_id);
            v_processed := v_processed + 1;

            RAISE NOTICE '✅ Processada mensagem %', v_queue_msg.msg_id;

        EXCEPTION
            WHEN OTHERS THEN
                v_errors := v_errors + 1;
                RAISE NOTICE '❌ Erro processando %: %', v_queue_msg.msg_id, SQLERRM;
        END;
    END LOOP;

    RETURN jsonb_build_object(
        'processed', v_processed,
        'errors', v_errors,
        'method', 'postgresql_fallback'
    );
END;
$$;

-- EXECUTAR WORKER FALLBACK
SELECT
    '🔄 WORKER FALLBACK DIRETO' as action,
    process_queue_direct_fallback() as result;