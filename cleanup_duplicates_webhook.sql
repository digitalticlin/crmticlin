-- ================================================================
-- 🧹 LIMPEZA COMPLETA: REMOVER DUPLICATAS PARA WEBHOOK
-- ================================================================

-- ================================================================
-- 1️⃣ LISTAR E REMOVER TRIGGERS DUPLICADOS
-- ================================================================

-- Listar todos os triggers na tabela messages
SELECT 
    '📊 TRIGGERS EXISTENTES NA TABELA MESSAGES' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'messages'
ORDER BY trigger_name;

-- Remover triggers antigos/duplicados (manter apenas trigger_webhook_media_processor)
DROP TRIGGER IF EXISTS process_media_trigger ON public.messages;
DROP TRIGGER IF EXISTS media_processing_trigger ON public.messages;
DROP TRIGGER IF EXISTS webhook_trigger ON public.messages;
DROP TRIGGER IF EXISTS media_upload_trigger ON public.messages;
DROP TRIGGER IF EXISTS auto_media_processor ON public.messages;

-- ================================================================
-- 2️⃣ LISTAR E REMOVER WORKERS DUPLICADOS
-- ================================================================

-- Listar todos os workers/funções de processamento
SELECT 
    '⚙️ WORKERS/FUNÇÕES DE PROCESSAMENTO EXISTENTES' as info,
    proname as function_name,
    pronargs as num_args,
    pg_get_function_identity_arguments(oid) as signature
FROM pg_proc
WHERE (
    proname LIKE '%worker%' 
    OR proname LIKE '%process%media%'
    OR proname LIKE '%webhook%process%'
    OR prosrc LIKE '%webhook_message_queue%'
)
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- Remover workers antigos/duplicados (manter apenas process_webhook_media_isolated)
DROP FUNCTION IF EXISTS public.process_media_worker();
DROP FUNCTION IF EXISTS public.webhook_media_worker();
DROP FUNCTION IF EXISTS public.media_processor_worker();
DROP FUNCTION IF EXISTS public.process_webhook_media();
DROP FUNCTION IF EXISTS public.webhook_worker();
DROP FUNCTION IF EXISTS public.process_media_background();

-- ================================================================
-- 3️⃣ VERIFICAR RPCs DUPLICADAS
-- ================================================================

-- Listar todas as funções save_received_message_webhook
SELECT 
    '📋 RPCs save_received_message_webhook' as info,
    proname as function_name,
    pronargs as num_params,
    pg_get_function_identity_arguments(oid) as signature
FROM pg_proc
WHERE proname = 'save_received_message_webhook'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY pronargs;

-- ================================================================
-- 4️⃣ LIMPAR TRIGGER FUNCTIONS ANTIGAS
-- ================================================================

-- Listar trigger functions
SELECT 
    '🔥 TRIGGER FUNCTIONS EXISTENTES' as info,
    proname as function_name,
    CASE 
        WHEN prorettype = (SELECT oid FROM pg_type WHERE typname = 'trigger') 
        THEN '✅ É TRIGGER FUNCTION'
        ELSE '❌ NÃO É TRIGGER'
    END as is_trigger_function
FROM pg_proc
WHERE proname LIKE '%trigger%'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- Remover trigger functions antigas (manter apenas trigger_webhook_media_processor)
DROP FUNCTION IF EXISTS public.process_media_trigger();
DROP FUNCTION IF EXISTS public.media_processing_trigger();
DROP FUNCTION IF EXISTS public.webhook_trigger_function();
DROP FUNCTION IF EXISTS public.auto_media_trigger();

-- ================================================================
-- 5️⃣ VERIFICAÇÃO FINAL - DEVE RESTAR APENAS ESTAS FUNÇÕES
-- ================================================================

-- Funções que devem PERMANECER para webhook_whatsapp_web:
-- ✅ save_received_message_webhook (14 params)
-- ✅ trigger_webhook_media_processor (trigger function)
-- ✅ process_webhook_media_isolated (worker)

SELECT 
    '✅ FUNÇÕES FINAIS PARA WEBHOOK_WHATSAPP_WEB' as resultado,
    jsonb_build_object(
        'rpc_webhook', (
            SELECT COUNT(*) 
            FROM pg_proc 
            WHERE proname = 'save_received_message_webhook'
            AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        ),
        'trigger_function', (
            SELECT COUNT(*) 
            FROM pg_proc 
            WHERE proname = 'trigger_webhook_media_processor'
            AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        ),
        'worker_isolated', (
            SELECT COUNT(*) 
            FROM pg_proc 
            WHERE proname = 'process_webhook_media_isolated'
            AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        ),
        'triggers_messages', (
            SELECT COUNT(*) 
            FROM information_schema.triggers 
            WHERE event_object_table = 'messages'
        )
    ) as contadores;

-- ================================================================
-- 6️⃣ VERIFICAR ESTADO FINAL
-- ================================================================

SELECT 
    '🎯 ESTRUTURA FINAL WEBHOOK_WHATSAPP_WEB' as status,
    'DEVE TER: 1 RPC, 1 TRIGGER FUNCTION, 1 WORKER, 1 TRIGGER' as esperado;

-- Listar apenas as funções que restaram
SELECT 
    '📋 FUNÇÕES RESTANTES' as final_check,
    proname as function_name,
    pronargs as params,
    CASE proname
        WHEN 'save_received_message_webhook' THEN '🎯 RPC Principal'
        WHEN 'trigger_webhook_media_processor' THEN '🔥 Trigger Function'
        WHEN 'process_webhook_media_isolated' THEN '⚙️ Worker Isolado'
        ELSE '❓ Outra função'
    END as tipo
FROM pg_proc
WHERE proname IN (
    'save_received_message_webhook',
    'trigger_webhook_media_processor', 
    'process_webhook_media_isolated'
)
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;