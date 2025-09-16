-- ================================================================
-- 🧹 LIMPEZA FINAL: REMOVER TODAS AS DUPLICATAS IDENTIFICADAS
-- ================================================================

-- ================================================================
-- 1️⃣ REMOVER TRIGGER DUPLICADO (MANTER APENAS O NOSSO)
-- ================================================================

-- ❌ Remover trigger antigo duplicado
DROP TRIGGER IF EXISTS trigger_webhook_media_sync ON public.messages;

-- ❌ Remover função do trigger antigo
DROP FUNCTION IF EXISTS public.trigger_webhook_media_processing();

-- ================================================================
-- 2️⃣ REMOVER WORKERS OBSOLETOS (PRESERVAR ai_media_worker e app_media_worker)
-- ================================================================

-- ✅ PRESERVAR Workers das outras edges que serão utilizadas:
-- - ai_media_worker (para ai_messaging_service) 
-- - app_media_worker (para whatsapp_messaging_service)

-- Workers universais/obsoletos
DROP FUNCTION IF EXISTS public.process_all_pending_media();
DROP FUNCTION IF EXISTS public.process_media_message_base(jsonb, text);
DROP FUNCTION IF EXISTS public.process_media_queue_worker();
DROP FUNCTION IF EXISTS public.process_single_media(uuid, text, text);

-- Workers antigos webhook (manter apenas process_webhook_media_isolated)
DROP FUNCTION IF EXISTS public.webhook_isolated_worker();
DROP FUNCTION IF EXISTS public.webhook_media_worker(integer, integer);
DROP FUNCTION IF EXISTS public.webhook_media_worker_simple();
DROP FUNCTION IF EXISTS public.webhook_process_media_sync(uuid);
DROP FUNCTION IF EXISTS public.webhook_whatsapp_web_media_worker(integer);
DROP FUNCTION IF EXISTS public.webhook_whatsapp_web_media_worker_production(integer);

-- ================================================================
-- 3️⃣ MANTER APENAS ESTRUTURA ISOLADA webhook_whatsapp_web
-- ================================================================

-- ✅ MANTER ESTAS FUNÇÕES (NÃO REMOVER):
-- - save_received_message_webhook (14 params) - RPC Principal
-- - trigger_webhook_media_processor() - Trigger Function Nova
-- - process_webhook_media_isolated(uuid) - Worker Isolado Novo
-- - test_webhook_trigger_system() - Função de Teste

-- ================================================================
-- 4️⃣ VERIFICAÇÃO FINAL DO QUE DEVE RESTAR
-- ================================================================

SELECT 
    '🎯 ESTRUTURA FINAL WEBHOOK_WHATSAPP_WEB' as status,
    'ISOLADA E LIMPA' as estado;

-- Funções que DEVEM restar para webhook_whatsapp_web:
SELECT 
    '✅ FUNÇÕES CORRETAS RESTANTES' as check_final,
    proname as function_name,
    pronargs as params,
    CASE proname
        WHEN 'save_received_message_webhook' THEN '🎯 RPC (14 params)'
        WHEN 'trigger_webhook_media_processor' THEN '🔥 Trigger Function'
        WHEN 'process_webhook_media_isolated' THEN '⚙️ Worker Isolado'
        WHEN 'test_webhook_trigger_system' THEN '🧪 Função Teste'
        ELSE '❓ Verificar se necessária'
    END as tipo_funcao
FROM pg_proc
WHERE proname IN (
    'save_received_message_webhook',
    'trigger_webhook_media_processor',
    'process_webhook_media_isolated',
    'test_webhook_trigger_system'
)
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- Triggers que DEVEM restar na tabela messages:
SELECT 
    '✅ TRIGGERS CORRETOS RESTANTES' as check_triggers,
    trigger_name,
    event_manipulation,
    action_timing,
    CASE trigger_name
        WHEN 'trigger_webhook_media_processor' THEN '✅ NOSSO TRIGGER'
        WHEN 'delete_storage_on_message_delete' THEN '✅ Sistema'
        WHEN 'trigger_delete_message_media' THEN '✅ Sistema'  
        WHEN 'trigger_auto_link_lead_to_instance' THEN '✅ Sistema'
        WHEN 'update_lead_instance_on_message' THEN '✅ Sistema'
        ELSE '❓ Verificar necessidade'
    END as status_trigger
FROM information_schema.triggers
WHERE event_object_table = 'messages'
ORDER BY trigger_name;

-- ================================================================
-- 5️⃣ CONTADORES FINAIS
-- ================================================================

SELECT 
    '📊 ESTATÍSTICAS FINAIS' as resultado,
    jsonb_build_object(
        'rpc_webhook_14_params', (
            SELECT COUNT(*) 
            FROM pg_proc 
            WHERE proname = 'save_received_message_webhook'
            AND pronargs = 14
            AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        ),
        'trigger_function_nova', (
            SELECT COUNT(*) 
            FROM pg_proc 
            WHERE proname = 'trigger_webhook_media_processor'
            AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        ),
        'worker_isolado_novo', (
            SELECT COUNT(*) 
            FROM pg_proc 
            WHERE proname = 'process_webhook_media_isolated'
            AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        ),
        'triggers_tabela_messages', (
            SELECT COUNT(*) 
            FROM information_schema.triggers 
            WHERE event_object_table = 'messages'
        ),
        'workers_obsoletos_removidos', 'SIM'
    ) as contadores_limpos;