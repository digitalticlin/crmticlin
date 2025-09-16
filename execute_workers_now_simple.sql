-- ================================================================
-- EXECUTAR WORKERS AGORA PARA PROCESSAR MENSAGENS ENFILEIRADAS
-- ================================================================

-- 🎯 OBJETIVO: Processar mensagens já salvas para gerar Storage URLs

-- ================================================================
-- 1️⃣ EXECUTAR WORKERS WEBHOOK (ONDE ESTÃO AS MENSAGENS)
-- ================================================================

DO $$
DECLARE
    v_processed_total int := 0;
    v_worker_result jsonb;
    v_queue_length int;
BEGIN
    RAISE NOTICE '🚀 PROCESSANDO MENSAGENS ENFILEIRADAS...';
    
    -- Executar worker até 20 vezes ou até fila vazia
    FOR i IN 1..20 LOOP
        -- Verificar se há mensagens
        SELECT (pgmq.metrics('webhook_message_queue')).queue_length INTO v_queue_length;
        
        IF v_queue_length = 0 THEN
            RAISE NOTICE '✅ Fila vazia após % execuções', i-1;
            EXIT;
        END IF;
        
        -- Executar worker
        BEGIN
            SELECT webhook_media_worker() INTO v_worker_result;
            
            IF (v_worker_result->>'success')::boolean = true THEN
                v_processed_total := v_processed_total + COALESCE((v_worker_result->>'processed_count')::int, 0);
                RAISE NOTICE '✅ Execução %: processadas %, falhas %', 
                    i, 
                    COALESCE((v_worker_result->>'processed_count')::int, 0),
                    COALESCE((v_worker_result->>'failed_count')::int, 0);
            ELSE
                RAISE NOTICE '❌ Execução % falhou: %', i, v_worker_result->>'error';
                EXIT;
            END IF;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '❌ Erro na execução %: %', i, SQLERRM;
                EXIT;
        END;
        
        -- Pequena pausa
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    RAISE NOTICE '🏁 PROCESSAMENTO CONCLUÍDO: % mensagens processadas no total', v_processed_total;
END $$;

-- ================================================================
-- 2️⃣ VERIFICAR RESULTADOS
-- ================================================================

-- 2.1 Mensagens que agora têm Storage URL
SELECT 
    '✅ MENSAGENS PROCESSADAS COM SUCESSO' as status,
    id,
    text,
    media_type::text,
    media_url,
    external_message_id,
    created_at
FROM messages 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID
AND media_type != 'text'
AND media_url IS NOT NULL
AND media_url LIKE 'https://%'
AND created_at > now() - interval '2 hours'
ORDER BY created_at DESC
LIMIT 10;

-- 2.2 Mensagens que ainda precisam processamento
SELECT 
    '⚠️ MENSAGENS AINDA SEM URL' as status,
    id,
    text,
    media_type::text,
    media_url,
    external_message_id,
    created_at
FROM messages 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID
AND media_type != 'text'
AND (media_url IS NULL OR media_url NOT LIKE 'https://%')
AND created_at > now() - interval '2 hours'
ORDER BY created_at DESC
LIMIT 5;

-- ================================================================
-- 3️⃣ ESTATÍSTICAS FINAIS
-- ================================================================

SELECT 
    '📊 ESTATÍSTICAS APÓS PROCESSAMENTO' as categoria,
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

-- ================================================================
-- 4️⃣ STATUS FINAL DAS FILAS
-- ================================================================

SELECT 
    '📦 FILAS APÓS PROCESSAMENTO' as categoria,
    queue_name,
    (pgmq.metrics(queue_name)).queue_length as mensagens_restantes,
    (pgmq.metrics(queue_name)).total_messages as total_processadas
FROM (
    VALUES 
        ('webhook_message_queue'),
        ('app_message_queue'),
        ('ai_message_queue')
) AS queues(queue_name);