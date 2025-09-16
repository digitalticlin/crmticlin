-- ================================================================
-- 🚨 CRIAR O WORKER ISOLADO QUE ESTÁ FALTANDO
-- ================================================================

-- Worker isolado para webhook_whatsapp_web
CREATE OR REPLACE FUNCTION public.webhook_media_worker(
    p_batch_size integer DEFAULT 10,
    p_timeout_seconds integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_queue_name text := 'webhook_message_queue';
    v_message_data jsonb;
    v_message_id bigint;
    v_result jsonb;
    v_processed_count int := 0;
    v_failed_count int := 0;
    v_start_time timestamp := now();
BEGIN
    RAISE NOTICE '[WEBHOOK_WORKER] 🚀 Iniciando processamento de até % mensagens...', p_batch_size;
    
    -- Processar até p_batch_size mensagens
    FOR i IN 1..p_batch_size LOOP
        -- Ler mensagem da fila com timeout
        SELECT msg_id, message 
        INTO v_message_id, v_message_data
        FROM pgmq.read(v_queue_name, p_timeout_seconds, 1);
        
        -- Se não há mensagem, parar
        IF v_message_data IS NULL THEN
            RAISE NOTICE '[WEBHOOK_WORKER] 📭 Fila vazia após processar % mensagens', v_processed_count;
            EXIT;
        END IF;
        
        -- Processar mensagem usando função base CORRIGIDA
        BEGIN
            SELECT process_media_message_base(v_message_data, v_queue_name) INTO v_result;
            
            IF (v_result->>'success')::boolean THEN
                -- Remover mensagem da fila após sucesso
                PERFORM pgmq.delete(v_queue_name, v_message_id);
                v_processed_count := v_processed_count + 1;
                
                RAISE NOTICE '[WEBHOOK_WORKER] ✅ Mensagem % processada: %', 
                    v_message_id, v_result->>'message_id';
            ELSE
                -- Falha no processamento - remover mesmo assim para evitar loop
                PERFORM pgmq.delete(v_queue_name, v_message_id);
                v_failed_count := v_failed_count + 1;
                
                RAISE NOTICE '[WEBHOOK_WORKER] ❌ Falha na mensagem %: %', 
                    v_message_id, v_result->>'error';
            END IF;
            
        EXCEPTION
            WHEN OTHERS THEN
                -- Erro crítico - remover mensagem para evitar travamento
                PERFORM pgmq.delete(v_queue_name, v_message_id);
                v_failed_count := v_failed_count + 1;
                
                RAISE NOTICE '[WEBHOOK_WORKER] 💥 Erro crítico na mensagem %: %', 
                    v_message_id, SQLERRM;
        END;
    END LOOP;
    
    -- Retornar estatísticas
    RETURN jsonb_build_object(
        'success', true,
        'queue', v_queue_name,
        'processed_count', v_processed_count,
        'failed_count', v_failed_count,
        'processing_time', extract(epoch from (now() - v_start_time)),
        'batch_size', p_batch_size
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '[WEBHOOK_WORKER] 💥 Erro fatal no worker: %', SQLERRM;
        
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'queue', v_queue_name,
            'processed_count', v_processed_count,
            'failed_count', v_failed_count
        );
END;
$$;

COMMENT ON FUNCTION public.webhook_media_worker IS 'Worker isolado para processar mensagens da fila webhook_message_queue';

-- ================================================================
-- ✅ TESTAR WORKER RECÉM-CRIADO
-- ================================================================

DO $$
DECLARE
    v_result jsonb;
    v_queue_before int;
    v_queue_after int;
BEGIN
    RAISE NOTICE '🧪 TESTANDO WORKER RECÉM-CRIADO...';
    
    -- Ver fila antes
    SELECT (pgmq.metrics('webhook_message_queue')).queue_length INTO v_queue_before;
    RAISE NOTICE '📦 Mensagens na fila ANTES: %', v_queue_before;
    
    -- Executar worker
    SELECT webhook_media_worker(3, 30) INTO v_result;
    RAISE NOTICE '📊 RESULTADO: %', v_result;
    
    -- Ver fila depois  
    SELECT (pgmq.metrics('webhook_message_queue')).queue_length INTO v_queue_after;
    RAISE NOTICE '📦 Mensagens na fila DEPOIS: %', v_queue_after;
    
    -- Sucesso?
    IF v_queue_after < v_queue_before THEN
        RAISE NOTICE '🎉 WORKER FUNCIONANDO! Processou % mensagens', (v_queue_before - v_queue_after);
    ELSE
        RAISE NOTICE '⚠️ Worker não processou mensagens';
    END IF;
END $$;

-- Ver resultado final nas mensagens
SELECT 
    'Mensagens após worker criado' as status,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE media_url IS NOT NULL AND media_url LIKE 'https://%') as com_url,
    COUNT(*) FILTER (WHERE media_url IS NULL) as sem_url
FROM messages 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID
AND media_type != 'text'
AND created_at > now() - interval '2 hours';