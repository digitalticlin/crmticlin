-- ================================================================
-- 🔍 VERIFICAR A RPC ATIVA E SEU CÓDIGO
-- ================================================================

-- Ver a definição completa da função atual
SELECT 
    '🔍 FUNÇÃO ATIVA ATUAL' as info,
    pg_get_functiondef(oid) as definicao_completa
FROM pg_proc
WHERE proname = 'save_received_message_webhook'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Ver se ela tem whatsapp_number_id no INSERT
SELECT 
    '📝 BUSCAR whatsapp_number_id NO CÓDIGO' as busca,
    CASE 
        WHEN prosrc LIKE '%whatsapp_number_id%' THEN '✅ TEM whatsapp_number_id'
        ELSE '❌ NÃO TEM whatsapp_number_id'
    END as resultado
FROM pg_proc
WHERE proname = 'save_received_message_webhook'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');