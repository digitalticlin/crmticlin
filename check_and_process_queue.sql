-- ================================================================
-- VERIFICAR E PROCESSAR FILA PARA GERAR STORAGE URLs
-- ================================================================

-- 🎯 OBJETIVO: Verificar por que workers não estão processando e gerar URLs

-- ================================================================
-- 1️⃣ VERIFICAR STATUS ATUAL DA FILA
-- ================================================================

SELECT 
    '📦 STATUS ATUAL DAS FILAS' as status,
    queue_name,
    (pgmq.metrics(queue_name)).queue_length as mensagens_pendentes,
    (pgmq.metrics(queue_name)).total_messages as total_processadas
FROM (
    VALUES 
        ('webhook_message_queue'),
        ('app_message_queue'),
        ('ai_message_queue')
) AS queues(queue_name);

-- Ver mensagens específicas na fila
SELECT 
    '🔍 MENSAGENS NA FILA WEBHOOK' as status,
    msg_id,
    enqueued_at,
    message->'action' as action,
    message->'message_id' as message_id,
    message->'media_data'->'media_type' as media_type,
    message->'media_data'->'base64_data' IS NOT NULL as tem_base64
FROM pgmq.q_webhook_message_queue 
ORDER BY enqueued_at DESC
LIMIT 5;

-- ================================================================
-- 2️⃣ VERIFICAR STATUS DAS MENSAGENS RECENTES
-- ================================================================

SELECT 
    '📱 MENSAGENS RECENTES SEM STORAGE URL' as status,
    id,
    text,
    media_type::text,
    media_url,
    CASE 
        WHEN media_url IS NOT NULL AND media_url LIKE 'https://%' THEN 'TEM URL ✅'
        WHEN media_url IS NULL THEN 'SEM URL ❌' 
        ELSE 'URL INVÁLIDA ⚠️'
    END as status_url,
    external_message_id,
    created_at
FROM messages 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID
AND media_type != 'text'
AND created_at > now() - interval '1 hour'
ORDER BY created_at DESC
LIMIT 10;

-- ================================================================
-- 3️⃣ EXECUTAR WORKERS PARA PROCESSAR FILA
-- ================================================================

DO $$
DECLARE
    v_processed_total int := 0;
    v_worker_result jsonb;
    v_queue_length int;
    v_initial_count int;
BEGIN
    RAISE NOTICE '🚀 EXECUTANDO WORKERS PARA GERAR STORAGE URLs...';
    
    -- Ver quantas mensagens temos inicialmente
    SELECT (pgmq.metrics('webhook_message_queue')).queue_length INTO v_initial_count;
    RAISE NOTICE '📦 Mensagens na fila inicialmente: %', v_initial_count;
    
    -- Executar worker até 25 vezes ou até fila vazia
    FOR i IN 1..25 LOOP
        -- Verificar se há mensagens
        SELECT (pgmq.metrics('webhook_message_queue')).queue_length INTO v_queue_length;
        
        IF v_queue_length = 0 THEN
            RAISE NOTICE '✅ Fila vazia após % execuções', i-1;
            EXIT;
        END IF;
        
        RAISE NOTICE '🔄 Execução % - Mensagens restantes: %', i, v_queue_length;
        
        -- Executar worker
        BEGIN
            SELECT webhook_media_worker() INTO v_worker_result;
            
            IF v_worker_result IS NOT NULL THEN
                IF (v_worker_result->>'success')::boolean = true THEN
                    v_processed_total := v_processed_total + COALESCE((v_worker_result->>'processed_count')::int, 0);
                    RAISE NOTICE '✅ Execução %: processadas %, falhas %', 
                        i, 
                        COALESCE((v_worker_result->>'processed_count')::int, 0),
                        COALESCE((v_worker_result->>'failed_count')::int, 0);
                ELSE
                    RAISE NOTICE '❌ Execução % falhou: %', i, v_worker_result->>'error';
                    -- Continue mesmo com erro
                END IF;
            ELSE
                RAISE NOTICE '⚠️ Worker retornou NULL na execução %', i;
            END IF;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '❌ Erro na execução %: %', i, SQLERRM;
                -- Continue mesmo com erro
        END;
        
        -- Pequena pausa
        PERFORM pg_sleep(0.2);
    END LOOP;
    
    RAISE NOTICE '🏁 WORKERS CONCLUÍDOS: % mensagens processadas no total', v_processed_total;
    RAISE NOTICE '📊 Redução na fila: % → %', v_initial_count, v_queue_length;
END $$;

-- ================================================================
-- 4️⃣ VERIFICAR RESULTADOS APÓS PROCESSAMENTO
-- ================================================================

-- 4.1 Status das filas após processamento
SELECT 
    '📦 FILAS APÓS PROCESSAMENTO' as status,
    queue_name,
    (pgmq.metrics(queue_name)).queue_length as mensagens_restantes
FROM (VALUES ('webhook_message_queue')) AS queues(queue_name);

-- 4.2 Mensagens que agora têm Storage URL
SELECT 
    '✅ MENSAGENS COM STORAGE URL APÓS WORKERS' as status,
    COUNT(*) as total_mensagens_midia,
    COUNT(*) FILTER (WHERE media_url IS NOT NULL AND media_url LIKE 'https://%') as com_storage_url,
    COUNT(*) FILTER (WHERE media_url IS NULL) as sem_storage_url,
    ROUND(
        COUNT(*) FILTER (WHERE media_url IS NOT NULL AND media_url LIKE 'https://%')::numeric * 100.0 / 
        NULLIF(COUNT(*), 0), 2
    ) as percentual_processado
FROM messages 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID
AND media_type != 'text'
AND created_at > now() - interval '2 hours';

-- 4.3 Últimas mensagens processadas
SELECT 
    '🎯 ÚLTIMAS MENSAGENS APÓS WORKERS' as status,
    id,
    text,
    media_type::text,
    CASE 
        WHEN media_url IS NOT NULL AND media_url LIKE 'https://nruwnhcqhcdtxlqhygis.supabase.co/storage%' THEN 'STORAGE URL ✅'
        WHEN media_url IS NOT NULL AND media_url LIKE 'https://%' THEN 'URL EXTERNA ✅' 
        WHEN media_url IS NULL THEN 'SEM URL ❌'
        ELSE 'URL SUSPEITA ⚠️'
    END as status_final,
    CASE 
        WHEN length(media_url) > 60 THEN left(media_url, 57) || '...'
        ELSE media_url
    END as url_preview,
    external_message_id,
    to_char(created_at, 'DD/MM HH24:MI:SS') as criado_em
FROM messages 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID
AND media_type != 'text'
AND created_at > now() - interval '1 hour'
ORDER BY created_at DESC
LIMIT 8;

-- ================================================================
-- 5️⃣ VERIFICAR CONTROLE DE PROCESSAMENTO
-- ================================================================

SELECT 
    '⚙️ CONTROLE DE PROCESSAMENTO' as status,
    processing_status,
    COUNT(*) as quantidade,
    MIN(started_at) as primeiro,
    MAX(COALESCE(completed_at, started_at)) as ultimo
FROM public.queue_processing_control
WHERE started_at > now() - interval '1 hour'
GROUP BY processing_status
ORDER BY quantidade DESC;

-- ================================================================
-- 6️⃣ DIAGNÓSTICO FINAL
-- ================================================================

SELECT 
    '🎯 DIAGNÓSTICO FINAL' as resultado,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM messages 
            WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID
            AND media_type != 'text'
            AND media_url IS NOT NULL 
            AND media_url LIKE 'https://%'
            AND created_at > now() - interval '30 minutes'
        ) THEN 'WORKERS FUNCIONANDO - URLs SENDO GERADAS ✅'
        WHEN EXISTS (
            SELECT 1 FROM pgmq.q_webhook_message_queue LIMIT 1
        ) THEN 'MENSAGENS NA FILA - WORKERS PRECISAM PROCESSAR ⏳'
        ELSE 'FILA VAZIA - VERIFICAR SE ENFILEIRAMENTO FUNCIONA ❓'
    END as status,
    jsonb_build_object(
        'próximo_passo', 
        CASE 
            WHEN NOT EXISTS (SELECT 1 FROM pgmq.q_webhook_message_queue LIMIT 1) 
            THEN 'Enviar nova mídia pelo WhatsApp para testar fluxo completo'
            ELSE 'Executar workers manualmente ou verificar se há erro no processamento'
        END
    ) as acao_recomendada;