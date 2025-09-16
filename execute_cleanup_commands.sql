-- ================================================================
-- EXECUTAR LIMPEZA FINAL - REMOVER FILAS E FUNÇÕES OBSOLETAS
-- ================================================================

-- 🧹 REMOVER FILAS UNIVERSAIS OBSOLETAS

-- 1. Remover filas obsoletas (verificar se estão vazias primeiro)
SELECT pgmq.drop_queue('media_processing_queue');
SELECT pgmq.drop_queue('message_sending_queue'); 
SELECT pgmq.drop_queue('ai_message_consult_queue');
SELECT pgmq.drop_queue('webhook_processing_queue');
SELECT pgmq.drop_queue('profile_pic_queue');
SELECT pgmq.drop_queue('profile_pic_download_queue');

-- 2. Remover funções obsoletas
DROP FUNCTION IF EXISTS public.save_whatsapp_message_service_role(text, text, text, boolean, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.save_whatsapp_message_ai_agent(text, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.save_sent_message_only(text, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.process_media_queue_worker(text, integer, integer);
DROP FUNCTION IF EXISTS public.get_media_queue_stats();
DROP FUNCTION IF EXISTS public.process_media_message(jsonb);

-- 3. Verificar limpeza
SELECT 
    '✅ LIMPEZA EXECUTADA' as resultado,
    'Filas e funções obsoletas removidas' as detalhes,
    now() as timestamp;

-- 4. Listar apenas filas ativas (devem sobrar apenas as 3 isoladas)
WITH queue_list AS (
    SELECT (q).queue_name as queue_name 
    FROM (SELECT pgmq.list_queues() as q) s
)
SELECT 
    '📊 FILAS ATIVAS APÓS LIMPEZA' as status,
    queue_name,
    CASE 
        WHEN queue_name = 'webhook_message_queue' THEN 'Edge webhook_whatsapp_web'
        WHEN queue_name = 'app_message_queue' THEN 'Edge whatsapp_messaging_service'
        WHEN queue_name = 'ai_message_queue' THEN 'Edge ai_messaging_service'
        ELSE 'Outra fila'
    END as edge_function
FROM queue_list
ORDER BY queue_name;

-- 5. Listar apenas funções ativas (devem sobrar apenas as isoladas)
SELECT 
    '🚀 FUNÇÕES ATIVAS APÓS LIMPEZA' as status,
    routine_name,
    CASE 
        WHEN routine_name LIKE '%webhook%' THEN 'Sistema Webhook'
        WHEN routine_name LIKE '%app%' THEN 'Sistema App'
        WHEN routine_name LIKE '%ai%' THEN 'Sistema AI'
        WHEN routine_name = 'process_media_message_base' THEN 'Sistema Base'
        WHEN routine_name = 'get_isolated_workers_stats' THEN 'Monitoramento'
        ELSE 'Outro sistema'
    END as sistema
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (
    routine_name IN (
        'save_received_message_webhook',
        'save_sent_message_from_app',
        'save_sent_message_from_ai',
        'webhook_media_worker',
        'app_media_worker',
        'ai_media_worker',
        'process_media_message_base',
        'get_isolated_workers_stats'
    )
)
ORDER BY sistema, routine_name;