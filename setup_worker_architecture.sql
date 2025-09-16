-- ================================================================
-- 🏗️ CONFIGURAR WORKER NA ARQUITETURA PERMANENTE
-- ================================================================

-- 1️⃣ Criar função para chamar o worker de forma controlada
CREATE OR REPLACE FUNCTION trigger_queue_processor()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_queue_length INTEGER;
    v_result JSONB;
BEGIN
    -- Verificar se há mensagens na fila
    SELECT queue_length INTO v_queue_length
    FROM pgmq.metrics('webhook_message_queue');

    IF v_queue_length > 0 THEN
        -- Processar fila
        SELECT process_queue_direct_fallback() INTO v_result;

        RETURN jsonb_build_object(
            'triggered', true,
            'queue_length_before', v_queue_length,
            'processing_result', v_result,
            'triggered_at', NOW()
        );
    ELSE
        RETURN jsonb_build_object(
            'triggered', false,
            'reason', 'Queue is empty',
            'queue_length', v_queue_length,
            'checked_at', NOW()
        );
    END IF;
END;
$$;

-- 2️⃣ Criar trigger automático (opcional - pode ser chamado manualmente)
CREATE OR REPLACE FUNCTION auto_trigger_queue_processor()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Apenas processar se há muitas mensagens na fila (evitar spam)
    IF (SELECT queue_length FROM pgmq.metrics('webhook_message_queue')) > 50 THEN
        PERFORM trigger_queue_processor();
    END IF;

    RETURN NEW;
END;
$$;

-- 3️⃣ Testar trigger manual
SELECT
    '🚀 TESTE TRIGGER MANUAL' as test,
    trigger_queue_processor() as result;

-- 4️⃣ Status final do sistema
SELECT
    '📊 STATUS ARQUITETURA FINAL' as info,
    jsonb_build_object(
        'queue_length', (SELECT queue_length FROM pgmq.metrics('webhook_message_queue')),
        'functions_active', ARRAY[
            'save_received_message_webhook',
            'process_queue_direct_fallback',
            'trigger_queue_processor'
        ],
        'architecture', 'webhook -> enqueue -> worker -> database',
        'scalable', true,
        'status', 'operational'
    ) as architecture_summary;