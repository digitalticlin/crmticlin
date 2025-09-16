-- ================================================================
-- FASE 1: CRIAR FILAS ISOLADAS PARA CADA EDGE FUNCTION
-- ================================================================

-- 🚀 CRIAR 3 NOVAS FILAS ISOLADAS (mantendo as antigas por enquanto)
-- Após finalizar, excluiremos as universais

-- ================================================================
-- 🚀 CRIAR 3 NOVAS FILAS ISOLADAS
-- ================================================================

-- 1️⃣ FILA PARA WEBHOOK (RECEBE MENSAGENS DA VPS)
SELECT pgmq.create('webhook_message_queue');
COMMENT ON TABLE pgmq.q_webhook_message_queue IS 'Fila isolada para processar mensagens recebidas da VPS via webhook_whatsapp_web';

-- 2️⃣ FILA PARA APP (ENVIA MENSAGENS DO PROJETO)
SELECT pgmq.create('app_message_queue');
COMMENT ON TABLE pgmq.q_app_message_queue IS 'Fila isolada para processar mensagens enviadas pelo app via whatsapp_messaging_service';

-- 3️⃣ FILA PARA AI/N8N (ENVIA MENSAGENS DO AI)
SELECT pgmq.create('ai_message_queue');
COMMENT ON TABLE pgmq.q_ai_message_queue IS 'Fila isolada para processar mensagens do AI/N8N via ai_messaging_service';

-- ================================================================
-- 📊 TABELA DE CONTROLE DE PROCESSAMENTO
-- ================================================================

CREATE TABLE IF NOT EXISTS public.queue_processing_control (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_name TEXT NOT NULL,
    message_id UUID,
    external_message_id TEXT,
    processing_status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    source_edge TEXT NOT NULL, -- webhook, app, ai
    message_type TEXT, -- text, image, video, audio, document
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_queue_processing_control_status ON public.queue_processing_control(processing_status);
CREATE INDEX IF NOT EXISTS idx_queue_processing_control_queue ON public.queue_processing_control(queue_name);
CREATE INDEX IF NOT EXISTS idx_queue_processing_control_source ON public.queue_processing_control(source_edge);
CREATE INDEX IF NOT EXISTS idx_queue_processing_control_created ON public.queue_processing_control(created_at);

COMMENT ON TABLE public.queue_processing_control IS 'Controle de processamento das 3 filas isoladas';

-- ================================================================
-- 🎯 ESTRUTURA PADRÃO DAS MENSAGENS NAS FILAS
-- ================================================================

/*
ESTRUTURA PADRÃO PARA TODAS AS FILAS:
{
    "action": "process_message", 
    "source": "webhook|app|ai",
    "priority": "high|normal|low",
    "message_data": {
        "vps_instance_id": "string",
        "phone": "string", 
        "message_text": "string",
        "from_me": boolean,
        "external_message_id": "string",
        "contact_name": "string",
        "profile_pic_url": "string" // apenas webhook
    },
    "media_data": {
        "media_type": "image|video|audio|document|sticker",
        "base64_data": "string", // base64 ou data URL
        "file_name": "string",
        "file_size": number,
        "mime_type": "string"
    },
    "metadata": {
        "retry_count": number,
        "created_at": "timestamp",
        "processing_deadline": "timestamp"
    }
}
*/

-- ================================================================
-- 🔍 FUNÇÕES DE MONITORAMENTO DAS FILAS
-- ================================================================

-- Função para verificar status de todas as filas isoladas
CREATE OR REPLACE FUNCTION get_isolated_queues_status()
RETURNS TABLE (
    queue_name TEXT,
    total_messages BIGINT,
    processing_messages BIGINT,
    failed_messages BIGINT,
    oldest_message TIMESTAMPTZ,
    newest_message TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'webhook_message_queue'::TEXT,
        (pgmq.metrics('webhook_message_queue')).queue_length,
        COALESCE(
            (SELECT COUNT(*) FROM public.queue_processing_control 
             WHERE queue_name = 'webhook_message_queue' AND processing_status = 'processing'), 
            0
        ),
        COALESCE(
            (SELECT COUNT(*) FROM public.queue_processing_control 
             WHERE queue_name = 'webhook_message_queue' AND processing_status = 'failed'), 
            0
        ),
        (pgmq.metrics('webhook_message_queue')).oldest_msg_age_sec::TIMESTAMPTZ,
        (pgmq.metrics('webhook_message_queue')).newest_msg_age_sec::TIMESTAMPTZ
    
    UNION ALL
    
    SELECT 
        'app_message_queue'::TEXT,
        (pgmq.metrics('app_message_queue')).queue_length,
        COALESCE(
            (SELECT COUNT(*) FROM public.queue_processing_control 
             WHERE queue_name = 'app_message_queue' AND processing_status = 'processing'), 
            0
        ),
        COALESCE(
            (SELECT COUNT(*) FROM public.queue_processing_control 
             WHERE queue_name = 'app_message_queue' AND processing_status = 'failed'), 
            0
        ),
        (pgmq.metrics('app_message_queue')).oldest_msg_age_sec::TIMESTAMPTZ,
        (pgmq.metrics('app_message_queue')).newest_msg_age_sec::TIMESTAMPTZ
    
    UNION ALL
    
    SELECT 
        'ai_message_queue'::TEXT,
        (pgmq.metrics('ai_message_queue')).queue_length,
        COALESCE(
            (SELECT COUNT(*) FROM public.queue_processing_control 
             WHERE queue_name = 'ai_message_queue' AND processing_status = 'processing'), 
            0
        ),
        COALESCE(
            (SELECT COUNT(*) FROM public.queue_processing_control 
             WHERE queue_name = 'ai_message_queue' AND processing_status = 'failed'), 
            0
        ),
        (pgmq.metrics('ai_message_queue')).oldest_msg_age_sec::TIMESTAMPTZ,
        (pgmq.metrics('ai_message_queue')).newest_msg_age_sec::TIMESTAMPTZ;
END;
$$;

COMMENT ON FUNCTION get_isolated_queues_status() IS 'Monitor das 3 filas isoladas';

-- ================================================================
-- ✅ VERIFICAR SE TUDO FOI CRIADO CORRETAMENTE
-- ================================================================

-- Listar novas filas criadas
WITH queue_list AS (
    SELECT (q).queue_name as queue_name 
    FROM (SELECT pgmq.list_queues() as q) s
)
SELECT 
    '🚀 NOVAS FILAS CRIADAS' as status,
    queue_name
FROM queue_list
WHERE queue_name IN ('webhook_message_queue', 'app_message_queue', 'ai_message_queue')
ORDER BY queue_name;

-- Verificar métricas iniciais
SELECT 
    '📊 MÉTRICAS INICIAIS' as info,
    queue_name,
    (pgmq.metrics(queue_name)).queue_length as messages,
    (pgmq.metrics(queue_name)).total_messages as total_processed
FROM (
    VALUES 
        ('webhook_message_queue'),
        ('app_message_queue'), 
        ('ai_message_queue')
) AS queues(queue_name);

-- Status final
SELECT 
    '✅ FASE 1 COMPLETA' as resultado,
    'Filas isoladas criadas com sucesso' as detalhes,
    jsonb_build_object(
        'filas_criadas', 3,
        'webhook_queue', 'webhook_message_queue',
        'app_queue', 'app_message_queue', 
        'ai_queue', 'ai_message_queue',
        'controle_table', 'queue_processing_control',
        'monitoring_function', 'get_isolated_queues_status()',
        'observacao', 'Filas antigas mantidas temporariamente - serão excluídas após finalização'
    ) as estrutura;