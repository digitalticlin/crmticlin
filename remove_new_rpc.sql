-- ================================================================
-- 🗑️ REMOVER RPC NOVA QUE FOI CRIADA
-- ================================================================

-- Remover a função save_received_message_webhook_sync que foi criada
DROP FUNCTION IF EXISTS public.save_received_message_webhook_sync(
    UUID, TEXT, TEXT, BOOLEAN, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT
);

-- Verificar se foi removida
SELECT
    '✅ RPC REMOVIDA' as status,
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'save_received_message_webhook_sync')
        THEN '❌ AINDA EXISTS'
        ELSE '✅ REMOVIDA COM SUCESSO'
    END as removal_status;