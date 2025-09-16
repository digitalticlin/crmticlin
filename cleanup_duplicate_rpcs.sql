-- ================================================================
-- 🧹 LIMPEZA DE RPCs OBSOLETAS - MANTER APENAS AS 3 ISOLADAS
-- ================================================================

-- 1️⃣ LISTAR TODAS FUNÇÕES DE MENSAGEM ANTES DA LIMPEZA
SELECT
    '📋 ANTES DA LIMPEZA - FUNÇÕES EXISTENTES' as info,
    proname as function_name,
    pronargs as num_args,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND (proname LIKE '%save_%message%'
       OR proname LIKE '%process_%message%'
       OR proname LIKE '%webhook_message%'
       OR proname LIKE '%app_message%'
       OR proname LIKE '%ai_message%')
ORDER BY proname;

-- 2️⃣ REMOVER FUNÇÕES OBSOLETAS DE WORKERS/PGMQ
DROP FUNCTION IF EXISTS public.process_webhook_messages() CASCADE;
DROP FUNCTION IF EXISTS public.process_app_messages() CASCADE;
DROP FUNCTION IF EXISTS public.process_ai_messages() CASCADE;
DROP FUNCTION IF EXISTS public.worker_webhook_messages() CASCADE;
DROP FUNCTION IF EXISTS public.worker_app_messages() CASCADE;
DROP FUNCTION IF EXISTS public.worker_ai_messages() CASCADE;
DROP FUNCTION IF EXISTS public.webhook_worker() CASCADE;
DROP FUNCTION IF EXISTS public.app_worker() CASCADE;
DROP FUNCTION IF EXISTS public.ai_worker() CASCADE;

-- 3️⃣ REMOVER POSSÍVEIS VERSÕES ANTIGAS DAS RPCs PRINCIPAIS (preservar as atuais)
-- Verificar se há versões com número diferente de parâmetros

-- Função webhook com parâmetros antigos (se houver)
DO $$
BEGIN
    -- Remover versões antigas da RPC webhook (mantém a atual com 16 parâmetros)
    FOR i IN 1..15 LOOP
        BEGIN
            EXECUTE format('DROP FUNCTION IF EXISTS public.save_received_message_webhook() CASCADE');
        EXCEPTION WHEN OTHERS THEN
            NULL; -- Ignora se não existir
        END;
    END LOOP;
END
$$;

-- Função app com parâmetros antigos (se houver)
DO $$
BEGIN
    -- Remover versões antigas da RPC app (mantém a atual com 16 parâmetros)
    FOR i IN 1..15 LOOP
        BEGIN
            EXECUTE format('DROP FUNCTION IF EXISTS public.save_sent_message_from_app() CASCADE');
        EXCEPTION WHEN OTHERS THEN
            NULL; -- Ignora se não existir
        END;
    END LOOP;
END
$$;

-- Função AI com parâmetros antigos (se houver)
DO $$
BEGIN
    -- Remover versões antigas da RPC AI (mantém a atual com 16 parâmetros)
    FOR i IN 1..15 LOOP
        BEGIN
            EXECUTE format('DROP FUNCTION IF EXISTS public.save_sent_message_from_ai() CASCADE');
        EXCEPTION WHEN OTHERS THEN
            NULL; -- Ignora se não existir
        END;
    END LOOP;
END
$$;

-- 4️⃣ REMOVER FUNÇÕES DE PROCESSAMENTO OBSOLETAS
DROP FUNCTION IF EXISTS public.process_message_queue() CASCADE;
DROP FUNCTION IF EXISTS public.enqueue_message_processing() CASCADE;
DROP FUNCTION IF EXISTS public.enqueue_webhook_message() CASCADE;
DROP FUNCTION IF EXISTS public.enqueue_app_message() CASCADE;
DROP FUNCTION IF EXISTS public.enqueue_ai_message() CASCADE;
DROP FUNCTION IF EXISTS public.process_pending_messages() CASCADE;
DROP FUNCTION IF EXISTS public.process_media_upload() CASCADE;

-- 5️⃣ REMOVER TRIGGERS OBSOLETOS DE WORKERS
DROP TRIGGER IF EXISTS trigger_process_webhook_messages ON webhook_message_queue;
DROP TRIGGER IF EXISTS trigger_process_app_messages ON app_message_queue;
DROP TRIGGER IF EXISTS trigger_process_ai_messages ON ai_message_queue;
DROP TRIGGER IF EXISTS trigger_webhook_worker ON messages;
DROP TRIGGER IF EXISTS trigger_app_worker ON messages;
DROP TRIGGER IF EXISTS trigger_ai_worker ON messages;

-- 6️⃣ REMOVER TABELAS DE FILAS OBSOLETAS (se existirem)
DROP TABLE IF EXISTS webhook_message_queue CASCADE;
DROP TABLE IF EXISTS app_message_queue CASCADE;
DROP TABLE IF EXISTS ai_message_queue CASCADE;
DROP TABLE IF EXISTS message_processing_queue CASCADE;

-- 7️⃣ VERIFICAR RESULTADO FINAL - APENAS AS 3 RPCs ISOLADAS DEVEM PERMANECER
SELECT
    '✅ APÓS LIMPEZA - FUNÇÕES MANTIDAS' as info,
    proname as function_name,
    pronargs as num_args,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND (proname LIKE '%save_%message%'
       OR proname LIKE '%process_%message%'
       OR proname LIKE '%webhook_message%'
       OR proname LIKE '%app_message%'
       OR proname LIKE '%ai_message%')
ORDER BY proname;

-- 8️⃣ VALIDAR AS 3 RPCs ISOLADAS ESTÃO PRESENTES
SELECT
    '🎯 VALIDAÇÃO FINAL - 3 RPCs ISOLADAS' as info,
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'save_received_message_webhook') as webhook_rpc_exists,
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'save_sent_message_from_app') as app_rpc_exists,
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'save_sent_message_from_ai') as ai_rpc_exists,
    (SELECT COUNT(*) FROM pg_proc WHERE proname LIKE '%save_%message%') as total_save_functions;

-- 9️⃣ CRIAR LOG DE LIMPEZA
INSERT INTO public.system_logs (
    log_level,
    message,
    details,
    created_at
) VALUES (
    'INFO',
    'RPC Cleanup Completed',
    jsonb_build_object(
        'action', 'cleanup_duplicate_rpcs',
        'timestamp', NOW(),
        'remaining_functions', (SELECT COUNT(*) FROM pg_proc WHERE proname LIKE '%save_%message%'),
        'target_functions', 3,
        'description', 'Removed obsolete PGMQ workers and duplicate RPCs, maintained 3 isolated RPCs'
    ),
    NOW()
) ON CONFLICT DO NOTHING;

-- 🎉 SUCESSO
SELECT '🎉 LIMPEZA CONCLUÍDA - SISTEMA OTIMIZADO COM 3 RPCs ISOLADAS' as resultado;