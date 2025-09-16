-- ================================================================
-- 📋 LISTAR TODAS AS FUNÇÕES DA ESTRUTURA
-- ================================================================

-- 1️⃣ FUNÇÕES WORKERS E PROCESSAMENTO
SELECT
    '🔧 WORKERS E PROCESSAMENTO' as categoria,
    routine_name,
    routine_type,
    CASE
        WHEN routine_name = 'process_queue_direct_fallback' THEN '✅ ATIVO - Worker principal'
        WHEN routine_name = 'trigger_queue_processor' THEN '✅ ATIVO - Trigger manual'
        WHEN routine_name = 'save_received_message_webhook' THEN '✅ ATIVO - RPC principal'
        WHEN routine_name LIKE '%process%' AND routine_name LIKE '%queue%' THEN '❓ VERIFICAR'
        WHEN routine_name LIKE '%webhook%' AND routine_name LIKE '%process%' THEN '❓ VERIFICAR'
        ELSE '❓ VERIFICAR'
    END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (
    routine_name LIKE '%process%'
    OR routine_name LIKE '%worker%'
    OR routine_name LIKE '%queue%'
    OR routine_name LIKE '%webhook%'
    OR routine_name = 'save_received_message_webhook'
    OR routine_name = 'trigger_queue_processor'
)
ORDER BY routine_name;

-- 2️⃣ EDGE FUNCTIONS (arquivos TypeScript)
/*
EDGE FUNCTIONS EXISTENTES:
- webhook_whatsapp_web (recebe mensagens)
- webhook_storage_upload (faz upload - HÍBRIDA)
- ai_messaging_service
- whatsapp_messaging_service
- process_media_demand
*/

-- 3️⃣ FUNÇÕES PGMQ
SELECT
    '📦 FUNÇÕES PGMQ' as categoria,
    routine_name,
    routine_type,
    '✅ ATIVO - PGMQ nativa' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE 'pgmq_%'
ORDER BY routine_name;

-- 4️⃣ FUNÇÕES RELACIONADAS A MÍDIA
SELECT
    '📸 FUNÇÕES DE MÍDIA' as categoria,
    routine_name,
    routine_type,
    CASE
        WHEN routine_name LIKE '%media%' THEN '❓ VERIFICAR'
        WHEN routine_name LIKE '%storage%' THEN '❓ VERIFICAR'
        WHEN routine_name LIKE '%upload%' THEN '❓ VERIFICAR'
        ELSE '❓ OUTROS'
    END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (
    routine_name LIKE '%media%'
    OR routine_name LIKE '%storage%'
    OR routine_name LIKE '%upload%'
    OR routine_name LIKE '%cache%'
)
ORDER BY routine_name;

-- 5️⃣ STATUS ATUAL DA ARQUITETURA
SELECT
    '🏗️ ARQUITETURA ATUAL' as info,
    jsonb_build_object(
        'edge_functions', ARRAY[
            'webhook_whatsapp_web (recebe)',
            'webhook_storage_upload (upload híbrida)'
        ],
        'postgresql_functions', ARRAY[
            'save_received_message_webhook (RPC principal)',
            'process_queue_direct_fallback (worker ativo)',
            'trigger_queue_processor (controle)',
            'pgmq_read, pgmq_delete (fila)'
        ],
        'fluxo', 'webhook -> pgmq -> worker -> rpc -> database',
        'status', 'operacional'
    ) as resumo;