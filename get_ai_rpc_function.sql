-- =====================================================================
-- 🔍 OBTER CÓDIGO DA FUNÇÃO save_whatsapp_message_ai_agent (AI)
-- =====================================================================

SELECT 
    'FUNÇÃO AI - save_whatsapp_message_ai_agent:' as tipo,
    pg_get_functiondef(oid) as codigo_completo
FROM pg_proc 
WHERE proname = 'save_whatsapp_message_ai_agent';

-- Verificar parâmetros
SELECT 
    'PARÂMETROS:' as info,
    pg_get_function_arguments(oid) as parametros
FROM pg_proc 
WHERE proname = 'save_whatsapp_message_ai_agent';