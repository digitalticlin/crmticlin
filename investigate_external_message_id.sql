-- ================================================================
-- 🔍 INVESTIGAR PROBLEMA DO EXTERNAL_MESSAGE_ID
-- ================================================================

-- 1️⃣ Verificar mensagens processadas nas últimas horas por external_message_id
SELECT
    '📋 ANÁLISE EXTERNAL_MESSAGE_ID' as info,
    CASE
        WHEN external_message_id LIKE 'fallback_%' THEN '🔄 WORKER FALLBACK'
        WHEN external_message_id LIKE 'queue_%' THEN '📦 QUEUE PROCESSED'
        WHEN external_message_id LIKE 'simple_%' THEN '🧪 SIMPLE WORKER'
        WHEN external_message_id LIKE '%test%' THEN '🧪 TESTE'
        WHEN external_message_id IS NULL THEN '❌ NULL'
        ELSE '❓ OUTROS'
    END as tipo,
    COUNT(*) as quantidade,
    MIN(created_at) as primeira,
    MAX(created_at) as ultima
FROM public.messages
WHERE created_at >= NOW() - INTERVAL '2 hours'
GROUP BY
    CASE
        WHEN external_message_id LIKE 'fallback_%' THEN '🔄 WORKER FALLBACK'
        WHEN external_message_id LIKE 'queue_%' THEN '📦 QUEUE PROCESSED'
        WHEN external_message_id LIKE 'simple_%' THEN '🧪 SIMPLE WORKER'
        WHEN external_message_id LIKE '%test%' THEN '🧪 TESTE'
        WHEN external_message_id IS NULL THEN '❌ NULL'
        ELSE '❓ OUTROS'
    END
ORDER BY quantidade DESC;

-- 2️⃣ Verificar se RPC save_received_message_webhook está salvando external_message_id corretamente
DO $$
DECLARE
    v_result JSONB;
    v_test_external_id TEXT := 'test_external_' || extract(epoch from now())::text;
BEGIN
    -- Testar RPC diretamente
    SELECT save_received_message_webhook(
        '712e7708-2299-4a00-9128-577c8f113ca4'::UUID,
        '+5511999888777',
        'TESTE EXTERNAL ID',
        false,
        'text',
        NULL,
        v_test_external_id,  -- external_message_id específico
        'Teste External',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'webhook_whatsapp_web'
    ) INTO v_result;

    RAISE NOTICE '🧪 Teste RPC resultado: %', v_result;
    RAISE NOTICE '🔍 External ID usado: %', v_test_external_id;
END $$;

-- 3️⃣ Verificar se a mensagem de teste foi salva com external_message_id correto
SELECT
    '🧪 VERIFICAR TESTE EXTERNAL_ID' as check,
    id,
    external_message_id,
    text,
    created_at,
    CASE
        WHEN external_message_id LIKE 'test_external_%' THEN '✅ EXTERNAL_ID SALVO'
        ELSE '❌ EXTERNAL_ID PERDIDO'
    END as status
FROM public.messages
WHERE external_message_id LIKE 'test_external_%'
AND created_at >= NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC
LIMIT 1;

-- 4️⃣ Verificar estrutura da função process_queue_direct_fallback
SELECT
    '🔍 FUNÇÃO FALLBACK DEFINITION' as info,
    LEFT(pg_get_functiondef(oid), 500) as function_start
FROM pg_proc
WHERE proname = 'process_queue_direct_fallback';

-- 5️⃣ Verificar últimas mensagens da fila que foram processadas
SELECT
    '📦 ÚLTIMAS MENSAGENS PROCESSADAS' as check,
    COUNT(*) as total_recent,
    COUNT(CASE WHEN external_message_id IS NOT NULL THEN 1 END) as with_external_id,
    COUNT(CASE WHEN external_message_id IS NULL THEN 1 END) as without_external_id
FROM public.messages
WHERE created_at >= NOW() - INTERVAL '30 minutes'
AND source_edge = 'webhook_whatsapp_web';