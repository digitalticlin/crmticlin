-- ================================================================
-- EXECUTAR WORKERS PARA PROCESSAR FILAS AGORA
-- ================================================================

-- 🎯 Baseado no RETORNO: temos 20 mensagens sem URL para processar
-- Workers existem: webhook_media_worker, app_media_worker, ai_media_worker

-- ================================================================
-- 1️⃣ VERIFICAR FILAS ANTES DO PROCESSAMENTO
-- ================================================================

SELECT 
    '📦 ANTES: STATUS DAS FILAS' as categoria,
    queue_name,
    (pgmq.metrics(queue_name)).queue_length as mensagens_pendentes,
    (pgmq.metrics(queue_name)).total_messages as total_processadas
FROM (
    VALUES 
        ('webhook_message_queue'),
        ('app_message_queue'),
        ('ai_message_queue')
) AS queues(queue_name);

-- ================================================================
-- 2️⃣ PROCESSAR FILA WEBHOOK (MAIORIA DAS MENSAGENS)
-- ================================================================

DO $$
DECLARE
    v_processed_count INT := 0;
    v_queue_length INT;
    v_result RECORD;
BEGIN
    SELECT (pgmq.metrics('webhook_message_queue')).queue_length INTO v_queue_length;
    
    RAISE NOTICE '🔄 PROCESSANDO FILA WEBHOOK - % mensagens na fila', v_queue_length;
    
    IF v_queue_length > 0 THEN
        -- Processar até 25 mensagens (mais que as 20 identificadas)
        FOR i IN 1..LEAST(v_queue_length, 25) LOOP
            BEGIN
                SELECT * FROM webhook_media_worker() INTO v_result;
                
                IF v_result IS NOT NULL THEN
                    v_processed_count := v_processed_count + 1;
                    RAISE NOTICE '✅ Webhook mensagem % processada: %', i, v_result;
                ELSE
                    RAISE NOTICE '⚠️ Webhook mensagem % retornou NULL', i;
                END IF;
                
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE '❌ Erro processando webhook mensagem %: %', i, SQLERRM;
                    EXIT; -- Sair se houver erro
            END;
        END LOOP;
        
        RAISE NOTICE '✅ WEBHOOK PROCESSAMENTO CONCLUÍDO: % mensagens processadas', v_processed_count;
    ELSE
        RAISE NOTICE '✅ FILA WEBHOOK VAZIA';
    END IF;
END $$;

-- ================================================================  
-- 3️⃣ PROCESSAR FILA APP
-- ================================================================

DO $$
DECLARE
    v_processed_count INT := 0;
    v_queue_length INT;
    v_result RECORD;
BEGIN
    SELECT (pgmq.metrics('app_message_queue')).queue_length INTO v_queue_length;
    
    RAISE NOTICE '🔄 PROCESSANDO FILA APP - % mensagens na fila', v_queue_length;
    
    IF v_queue_length > 0 THEN
        FOR i IN 1..LEAST(v_queue_length, 10) LOOP
            BEGIN
                SELECT * FROM app_media_worker() INTO v_result;
                
                IF v_result IS NOT NULL THEN
                    v_processed_count := v_processed_count + 1;
                    RAISE NOTICE '✅ App mensagem % processada: %', i, v_result;
                ELSE
                    RAISE NOTICE '⚠️ App mensagem % retornou NULL', i;
                END IF;
                
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE '❌ Erro processando app mensagem %: %', i, SQLERRM;
                    EXIT;
            END;
        END LOOP;
        
        RAISE NOTICE '✅ APP PROCESSAMENTO CONCLUÍDO: % mensagens processadas', v_processed_count;
    ELSE
        RAISE NOTICE '✅ FILA APP VAZIA';
    END IF;
END $$;

-- ================================================================
-- 4️⃣ PROCESSAR FILA AI  
-- ================================================================

DO $$
DECLARE
    v_processed_count INT := 0;
    v_queue_length INT;
    v_result RECORD;
BEGIN
    SELECT (pgmq.metrics('ai_message_queue')).queue_length INTO v_queue_length;
    
    RAISE NOTICE '🔄 PROCESSANDO FILA AI - % mensagens na fila', v_queue_length;
    
    IF v_queue_length > 0 THEN
        FOR i IN 1..LEAST(v_queue_length, 10) LOOP
            BEGIN
                SELECT * FROM ai_media_worker() INTO v_result;
                
                IF v_result IS NOT NULL THEN
                    v_processed_count := v_processed_count + 1;
                    RAISE NOTICE '✅ AI mensagem % processada: %', i, v_result;
                ELSE
                    RAISE NOTICE '⚠️ AI mensagem % retornou NULL', i;
                END IF;
                
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE '❌ Erro processando AI mensagem %: %', i, SQLERRM;
                    EXIT;
            END;
        END LOOP;
        
        RAISE NOTICE '✅ AI PROCESSAMENTO CONCLUÍDO: % mensagens processadas', v_processed_count;
    ELSE
        RAISE NOTICE '✅ FILA AI VAZIA';
    END IF;
END $$;

-- ================================================================
-- 5️⃣ VERIFICAR RESULTADOS APÓS PROCESSAMENTO
-- ================================================================

-- 5.1 Status das filas após workers
SELECT 
    '📦 DEPOIS: STATUS DAS FILAS' as categoria,
    queue_name,
    (pgmq.metrics(queue_name)).queue_length as mensagens_pendentes,
    (pgmq.metrics(queue_name)).total_messages as total_processadas
FROM (
    VALUES 
        ('webhook_message_queue'),
        ('app_message_queue'),
        ('ai_message_queue')
) AS queues(queue_name);

-- 5.2 Verificar mensagens que agora têm Storage URL
SELECT 
    '✅ MENSAGENS COM STORAGE URL APÓS WORKERS' as categoria,
    id,
    text,
    media_type,
    media_url,
    external_message_id,
    created_at
FROM messages 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID
AND whatsapp_number_id = '66ae98b4-1c72-49e4-a7e9-ab774db101ec'::UUID  
AND media_type != 'text'
AND media_url LIKE 'https://%'
AND created_at > now() - interval '2 hours'
ORDER BY created_at DESC
LIMIT 10;

-- 5.3 Mensagens que ainda precisam de processamento
SELECT 
    '⚠️ AINDA SEM STORAGE URL' as categoria,
    id,
    text,
    media_type,
    media_url,
    external_message_id,
    created_at
FROM messages 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID
AND whatsapp_number_id = '66ae98b4-1c72-49e4-a7e9-ab774db101ec'::UUID  
AND media_type != 'text'
AND (media_url IS NULL OR media_url NOT LIKE 'https://%')
AND created_at > now() - interval '2 hours'
ORDER BY created_at DESC
LIMIT 5;

-- ================================================================
-- 6️⃣ RESUMO FINAL DO PROCESSAMENTO
-- ================================================================

SELECT 
    '📊 RESULTADO FINAL DO PROCESSAMENTO' as categoria,
    COUNT(CASE WHEN media_type != 'text' THEN 1 END) as total_midia_mensagens,
    COUNT(CASE WHEN media_type != 'text' AND media_url IS NULL THEN 1 END) as ainda_sem_url,
    COUNT(CASE WHEN media_type != 'text' AND media_url LIKE 'https://%' THEN 1 END) as agora_com_url,
    ROUND(
        COUNT(CASE WHEN media_type != 'text' AND media_url LIKE 'https://%' THEN 1 END)::numeric * 100.0 / 
        NULLIF(COUNT(CASE WHEN media_type != 'text' THEN 1 END), 0), 
        2
    ) as percentual_sucesso
FROM messages 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID
AND whatsapp_number_id = '66ae98b4-1c72-49e4-a7e9-ab774db101ec'::UUID
AND created_at > now() - interval '2 hours';

-- ================================================================
-- ✅ WORKERS EXECUTADOS PARA RESOLVER O PROBLEMA DAS URLs
-- ================================================================