-- =====================================================================
-- 🔍 OBTER CÓDIGO DA FUNÇÃO save_sent_message_only (CRM)
-- =====================================================================

SELECT 
    'FUNÇÃO CRM - save_sent_message_only:' as tipo,
    pg_get_functiondef(oid) as codigo_completo
FROM pg_proc 
WHERE proname = 'save_sent_message_only';

-- Verificar parâmetros
SELECT 
    'PARÂMETROS:' as info,
    pg_get_function_arguments(oid) as parametros
FROM pg_proc 
WHERE proname = 'save_sent_message_only';