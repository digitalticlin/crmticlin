-- ================================================================
-- 🚀 PROCESSAR TODAS AS 362 MENSAGENS DA FILA
-- ================================================================

-- Worker para processar mensagens da fila com a RPC atualizada
DO $$
DECLARE
    v_queue_msg RECORD;
    v_result JSONB;
    v_processed INTEGER := 0;
    v_errors INTEGER := 0;
    v_batch_size INTEGER := 10; -- Processar em lotes
    v_max_messages INTEGER := 50; -- Limitar para não travar
BEGIN
    RAISE NOTICE '🚀 Iniciando processamento das mensagens da fila...';

    -- Loop para processar mensagens
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
        FROM pgmq.read('webhook_message_queue', v_max_messages, 30)
        WHERE message->>'base64_data' IS NOT NULL
        AND LENGTH(message->>'base64_data') > 100
    )
    LOOP
        BEGIN
            -- Processar mensagem com RPC atualizada
            SELECT save_received_message_webhook(
                v_queue_msg.instance_id::UUID,
                v_queue_msg.phone,
                COALESCE(v_queue_msg.message_text, 'Mensagem da Fila'),
                COALESCE(v_queue_msg.from_me::BOOLEAN, false),
                v_queue_msg.media_type,
                NULL,
                'queue_processed_' || v_queue_msg.msg_id::text,
                v_queue_msg.contact_name,
                NULL,
                v_queue_msg.base64_data,
                v_queue_msg.mime_type,
                v_queue_msg.file_name,
                NULL,
                'webhook_whatsapp_web'
            ) INTO v_result;

            -- Remover mensagem da fila após processamento
            PERFORM pgmq.delete('webhook_message_queue', v_queue_msg.msg_id);

            v_processed := v_processed + 1;

            -- Log a cada 10 mensagens
            IF v_processed % 10 = 0 THEN
                RAISE NOTICE '📊 Processadas: % mensagens', v_processed;
            END IF;

        EXCEPTION
            WHEN OTHERS THEN
                v_errors := v_errors + 1;
                RAISE NOTICE '❌ Erro ao processar msg_id %: %', v_queue_msg.msg_id, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE '✅ Processamento concluído:';
    RAISE NOTICE '   📊 Processadas: % mensagens', v_processed;
    RAISE NOTICE '   ❌ Erros: % mensagens', v_errors;
    RAISE NOTICE '   🎯 Taxa de sucesso: %',
        ROUND((v_processed::DECIMAL / NULLIF(v_processed + v_errors, 0)) * 100, 2);
END $$;

-- Verificar status após processamento
SELECT
    '📊 STATUS APÓS PROCESSAMENTO' as info,
    queue_name,
    queue_length,
    CASE
        WHEN queue_length < 50 THEN '✅ FILA REDUZIDA'
        WHEN queue_length < 200 THEN '⚠️ FILA PARCIALMENTE PROCESSADA'
        ELSE '❌ FILA AINDA GRANDE'
    END as status
FROM pgmq.metrics('webhook_message_queue');

-- Verificar mensagens criadas
SELECT
    '📝 MENSAGENS PROCESSADAS DA FILA' as check,
    COUNT(*) as total_processed,
    COUNT(CASE WHEN media_url IS NOT NULL THEN 1 END) as with_media_url,
    ROUND(
        (COUNT(CASE WHEN media_url IS NOT NULL THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
    ) as success_rate
FROM public.messages
WHERE external_message_id LIKE 'queue_processed_%'
AND created_at >= NOW() - INTERVAL '5 minutes';

-- Estatísticas finais atualizadas
SELECT
    '📊 ESTATÍSTICAS FINAIS ATUALIZADAS' as info,
    COUNT(*) as total_messages,
    COUNT(media_url) as messages_with_url,
    ROUND(
        (COUNT(media_url)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2
    ) as percentage_with_url
FROM public.messages
WHERE media_type != 'text'
AND created_at >= NOW() - INTERVAL '2 hours';