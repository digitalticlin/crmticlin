-- ================================================================
-- 🧹 LIMPAR WORKERS OBSOLETOS
-- ================================================================

-- Remover workers que não são mais necessários
DROP FUNCTION IF EXISTS process_media_queue_professional;
DROP FUNCTION IF EXISTS process_queue_simple_no_auth;
DROP FUNCTION IF EXISTS process_webhook_media_isolated;
DROP FUNCTION IF EXISTS process_webhook_media_auto_strategy;
DROP FUNCTION IF EXISTS process_webhook_media_with_edge_upload;

-- Remover triggers obsoletos (manter apenas se necessário)
-- DROP FUNCTION IF EXISTS trigger_webhook_media_processor;

-- Verificar que apenas as funções necessárias restaram
SELECT
    '🧹 FUNÇÕES RESTANTES APÓS LIMPEZA' as info,
    routine_name,
    CASE
        WHEN routine_name = 'save_received_message_webhook' THEN '✅ ESSENCIAL'
        WHEN routine_name = 'process_queue_direct_fallback' THEN '✅ WORKER ATIVO'
        WHEN routine_name LIKE 'pgmq_%' THEN '✅ PGMQ'
        ELSE '❓ VERIFICAR'
    END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (
    routine_name LIKE '%process%'
    OR routine_name LIKE '%queue%'
    OR routine_name LIKE '%webhook%'
    OR routine_name LIKE '%pgmq%'
)
AND routine_name NOT LIKE '%trigger%'
ORDER BY routine_name;