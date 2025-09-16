-- ================================================================
-- EXECUTAR WORKER DIRETAMENTE PARA VER O ERRO
-- ================================================================

-- 🎯 OBJETIVO: Executar worker e capturar erro específico

-- ================================================================
-- 1️⃣ TESTE DIRETO DO WORKER
-- ================================================================

SELECT 
    '🧪 EXECUTANDO WORKER DIRETAMENTE' as status,
    webhook_media_worker() as resultado;

-- ================================================================
-- 2️⃣ SE DER ERRO, TESTAR FUNÇÃO BASE DIRETAMENTE
-- ================================================================

DO $$
DECLARE
    v_sample_message jsonb;
    v_result jsonb;
BEGIN
    -- Pegar uma mensagem da fila
    SELECT message INTO v_sample_message 
    FROM pgmq.q_webhook_message_queue 
    LIMIT 1;
    
    IF v_sample_message IS NOT NULL THEN
        RAISE NOTICE '🔍 Mensagem da fila: %', v_sample_message;
        
        -- Testar função base
        SELECT process_media_message_base(
            v_sample_message, 
            'webhook_message_queue'
        ) INTO v_result;
        
        RAISE NOTICE '📊 Resultado função base: %', v_result;
    END IF;
END $$;

-- ================================================================
-- 3️⃣ EXECUTAR UM WORKER STEP BY STEP
-- ================================================================

DO $$
DECLARE
    v_message_data jsonb;
    v_message_id bigint;
    v_result jsonb;
    v_queue_length int;
BEGIN
    RAISE NOTICE '🚀 EXECUTANDO WORKER PASSO A PASSO...';
    
    -- Ver fila antes
    SELECT (pgmq.metrics('webhook_message_queue')).queue_length INTO v_queue_length;
    RAISE NOTICE '📦 Mensagens na fila: %', v_queue_length;
    
    -- Consumir uma mensagem
    SELECT msg_id, message 
    INTO v_message_id, v_message_data
    FROM pgmq.read('webhook_message_queue', 30, 1);
    
    IF v_message_data IS NOT NULL THEN
        RAISE NOTICE '✅ Mensagem consumida: ID %, Dados: %', v_message_id, v_message_data;
        
        -- Processar com função base
        SELECT process_media_message_base(v_message_data, 'webhook_message_queue') INTO v_result;
        
        RAISE NOTICE '📊 Resultado processamento: %', v_result;
        
        -- Deletar mensagem da fila se sucesso
        IF (v_result->>'success')::boolean THEN
            PERFORM pgmq.delete('webhook_message_queue', v_message_id);
            RAISE NOTICE '✅ Mensagem deletada da fila';
        ELSE
            RAISE NOTICE '❌ Mantendo mensagem na fila por causa do erro';
        END IF;
        
    ELSE
        RAISE NOTICE '📭 Nenhuma mensagem para processar';
    END IF;
    
    -- Ver fila depois
    SELECT (pgmq.metrics('webhook_message_queue')).queue_length INTO v_queue_length;
    RAISE NOTICE '📦 Mensagens na fila após processamento: %', v_queue_length;
    
END $$;

-- ================================================================
-- 4️⃣ VERIFICAR SE MENSAGEM FOI PROCESSADA
-- ================================================================

SELECT 
    '🎯 VERIFICAR SE PROCESSAMENTO FUNCIONOU' as status,
    id,
    text,
    media_type::text,
    CASE 
        WHEN media_url IS NOT NULL AND media_url LIKE 'https://%' THEN 'COM URL ✅'
        ELSE 'SEM URL ❌'
    END as status_url,
    media_url
FROM messages 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID
AND media_type != 'text'
AND created_at > now() - interval '5 minutes'
ORDER BY created_at DESC
LIMIT 3;