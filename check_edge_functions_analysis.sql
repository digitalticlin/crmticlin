-- ================================================================
-- ANÁLISE DAS 3 EDGE FUNCTIONS E SUAS FUNÇÕES RPC
-- ================================================================

-- 1. WEBHOOK_WHATSAPP_WEB (RECEBE MENSAGENS DA VPS)
-- ================================================================
-- RPC: save_whatsapp_message_service_role
-- Fila: pgmq_send para 'media_processing_queue' (apenas para mídia)
-- Características:
--   - Recebe mensagens da VPS via webhook
--   - Salva mensagens no banco via RPC
--   - Enfileira processamento de mídia quando necessário
--   - Usa Supabase Storage para mídia

-- 2. WHATSAPP_MESSAGING_SERVICE (ENVIA DO PROJETO)
-- ================================================================
-- RPC: save_sent_message_only
-- Fila: pgmq_send para 'message_sending_queue' (mensagens grandes)
-- Características:
--   - Requer autenticação do usuário (Bearer token)
--   - Valida propriedade da instância
--   - Enfileira mensagens grandes (>5MB)
--   - Processa síncronamente mensagens pequenas

-- 3. AI_MESSAGING_SERVICE (ENVIA DO N8N)
-- ================================================================
-- RPC: save_whatsapp_message_ai_agent
-- Fila: NÃO USA FILA (apenas processamento síncrono)
-- Características:
--   - Autenticação via API Key (AI_AGENT_API_KEY)
--   - Valida propriedade da instância e lead
--   - Suporta áudio PTT nativo
--   - Processa tudo sincronamente

-- ================================================================
-- VERIFICAR FUNÇÕES RPC ISOLADAS
-- ================================================================

-- 1. Verificar se as 3 funções RPC existem e são distintas
SELECT 
    routine_name,
    routine_schema,
    routine_type,
    data_type as return_type,
    routine_definition IS NOT NULL as has_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'save_whatsapp_message_service_role',  -- webhook_whatsapp_web
    'save_sent_message_only',              -- whatsapp_messaging_service
    'save_whatsapp_message_ai_agent'       -- ai_messaging_service
)
ORDER BY routine_name;

-- 2. Verificar parâmetros de cada função RPC para confirmar isolamento
SELECT 
    r.routine_name,
    p.parameter_name,
    p.data_type,
    p.parameter_mode,
    p.ordinal_position
FROM information_schema.routines r
JOIN information_schema.parameters p ON 
    r.specific_name = p.specific_name
WHERE r.routine_schema = 'public'
AND r.routine_name IN (
    'save_whatsapp_message_service_role',
    'save_sent_message_only',
    'save_whatsapp_message_ai_agent'
)
ORDER BY r.routine_name, p.ordinal_position;

-- 3. Verificar se existem as filas mencionadas no código
SELECT 
    queue_name,
    (pgmq.metrics(queue_name)).* 
FROM (
    SELECT name as queue_name 
    FROM pgmq.list_queues()
    WHERE name IN ('media_processing_queue', 'message_sending_queue')
) q;

-- 4. Verificar uso das filas pelas Edge Functions (últimas 24h)
WITH queue_activity AS (
    SELECT 
        'media_processing_queue' as queue_name,
        COUNT(*) as messages_count,
        MAX((msg->>'timestamp')::timestamp) as last_message
    FROM pgmq.q_media_processing_queue
    WHERE (msg->>'timestamp')::timestamp > NOW() - INTERVAL '24 hours'
    
    UNION ALL
    
    SELECT 
        'message_sending_queue' as queue_name,
        COUNT(*) as messages_count,
        MAX((msg->>'timestamp')::timestamp) as last_message
    FROM pgmq.q_message_sending_queue
    WHERE (msg->>'timestamp')::timestamp > NOW() - INTERVAL '24 hours'
)
SELECT * FROM queue_activity;

-- 5. Verificar logs das Edge Functions para confirmar uso das RPCs
SELECT 
    function_name,
    COUNT(*) as calls_count,
    COUNT(DISTINCT result->>'rpc_function') as distinct_rpcs,
    array_agg(DISTINCT result->>'rpc_function') as rpcs_used,
    MAX(created_at) as last_call
FROM sync_logs
WHERE function_name IN (
    'webhook_whatsapp_web',
    'whatsapp_messaging_service',
    'ai_messaging_service'
)
AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY function_name;

-- 6. Verificar isolamento - cada RPC deve processar apenas seu tipo
WITH message_sources AS (
    SELECT 
        'webhook_whatsapp_web' as source,
        COUNT(*) as message_count,
        COUNT(DISTINCT lead_id) as unique_leads,
        MAX(created_at) as last_message
    FROM messages
    WHERE from_me = false
    AND created_at > NOW() - INTERVAL '24 hours'
    
    UNION ALL
    
    SELECT 
        'whatsapp_messaging_service' as source,
        COUNT(*) as message_count,
        COUNT(DISTINCT lead_id) as unique_leads,
        MAX(created_at) as last_message
    FROM messages
    WHERE from_me = true
    AND ai_description IS NULL
    AND created_at > NOW() - INTERVAL '24 hours'
    
    UNION ALL
    
    SELECT 
        'ai_messaging_service' as source,
        COUNT(*) as message_count,
        COUNT(DISTINCT lead_id) as unique_leads,
        MAX(created_at) as last_message
    FROM messages
    WHERE from_me = true
    AND ai_description IS NOT NULL
    AND created_at > NOW() - INTERVAL '24 hours'
)
SELECT * FROM message_sources;

-- 7. Análise de conflitos potenciais - mensagens duplicadas
SELECT 
    lead_id,
    text,
    COUNT(*) as duplicate_count,
    array_agg(id ORDER BY created_at) as message_ids,
    array_agg(created_at ORDER BY created_at) as timestamps,
    array_agg(from_me ORDER BY created_at) as from_me_flags
FROM messages
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY lead_id, text
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 10;

-- 8. Verificar se as RPCs estão usando transações isoladas
SELECT 
    routine_name,
    CASE 
        WHEN routine_definition ILIKE '%BEGIN%' THEN 'Uses Transaction'
        ELSE 'No Transaction'
    END as transaction_status,
    CASE 
        WHEN routine_definition ILIKE '%ON CONFLICT%' THEN 'Has Conflict Handling'
        ELSE 'No Conflict Handling'
    END as conflict_handling
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'save_whatsapp_message_service_role',
    'save_sent_message_only',
    'save_whatsapp_message_ai_agent'
);

-- ================================================================
-- RESUMO DA ANÁLISE
-- ================================================================
SELECT 
    'ANÁLISE DAS EDGE FUNCTIONS' as categoria,
    jsonb_build_object(
        'webhook_whatsapp_web', jsonb_build_object(
            'função', 'Recebe mensagens da VPS',
            'rpc', 'save_whatsapp_message_service_role',
            'usa_fila', true,
            'fila', 'media_processing_queue (apenas mídia)'
        ),
        'whatsapp_messaging_service', jsonb_build_object(
            'função', 'Envia mensagens do projeto',
            'rpc', 'save_sent_message_only',
            'usa_fila', true,
            'fila', 'message_sending_queue (mensagens >5MB)'
        ),
        'ai_messaging_service', jsonb_build_object(
            'função', 'Envia mensagens do N8N/AI',
            'rpc', 'save_whatsapp_message_ai_agent',
            'usa_fila', false,
            'fila', 'Não usa fila'
        )
    ) as detalhes;