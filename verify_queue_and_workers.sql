-- ================================================================
-- VERIFICAR FILAS E PROCESSAR WORKERS CORRETAMENTE
-- ================================================================

-- 1️⃣ VERIFICAR O ESTADO DAS FILAS
-- ================================================================

-- 1.1 Status detalhado das filas
SELECT 
    '📦 ESTADO ATUAL DAS FILAS' as categoria,
    queue_name,
    (pgmq.metrics(queue_name)).queue_length as mensagens_pendentes,
    (pgmq.metrics(queue_name)).total_messages as total_processadas,
    (pgmq.metrics(queue_name)).newest_msg_age_sec as idade_msg_nova_seg,
    (pgmq.metrics(queue_name)).oldest_msg_age_sec as idade_msg_antiga_seg
FROM (
    VALUES 
        ('webhook_message_queue'),
        ('app_message_queue'),
        ('ai_message_queue')
) AS queues(queue_name);

-- 1.2 Peek nas mensagens da fila sem consumir
SELECT 
    '👀 MENSAGENS NA FILA WEBHOOK (SEM CONSUMIR)' as categoria,
    msg_id,
    read_ct,
    enqueued_at,
    vt,
    (message->>'action') as action,
    (message->>'source') as source,
    (message->>'message_id')::UUID as message_id,
    (message->'media_data'->>'media_type') as media_type,
    CASE 
        WHEN message->'media_data'->>'base64Data' IS NOT NULL THEN 'HAS BASE64'
        WHEN message->'media_data'->>'media_url' IS NOT NULL THEN 'HAS URL'
        ELSE 'NO MEDIA DATA'
    END as media_status
FROM pgmq.q_webhook_message_queue
WHERE vt <= now()
ORDER BY enqueued_at DESC
LIMIT 5;

-- 2️⃣ VERIFICAR MENSAGENS RECENTES QUE PRECISAM PROCESSAMENTO
-- ================================================================

SELECT 
    '🔍 MENSAGENS RECENTES SEM STORAGE URL' as categoria,
    id,
    text,
    media_type,
    media_url,
    external_message_id,
    import_source,
    created_at,
    age(now(), created_at) as idade
FROM messages 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID
AND whatsapp_number_id = '66ae98b4-1c72-49e4-a7e9-ab774db101ec'::UUID  
AND media_type != 'text'
AND (media_url IS NULL OR media_url NOT LIKE 'https://%')
AND created_at > now() - interval '1 hour'
ORDER BY created_at DESC;

-- 3️⃣ PROCESSAR MANUALMENTE AS FILAS COM MAIS DEBUG
-- ================================================================

-- 3.1 Processar webhook_message_queue com debug
DO $$
DECLARE
    v_msg_record RECORD;
    v_processed_count INT := 0;
    v_error_count INT := 0;
    v_total_in_queue INT;
BEGIN
    -- Contar mensagens na fila
    SELECT COUNT(*) INTO v_total_in_queue 
    FROM pgmq.q_webhook_message_queue 
    WHERE vt <= now();
    
    RAISE NOTICE '📦 WEBHOOK QUEUE: % mensagens para processar', v_total_in_queue;
    
    IF v_total_in_queue = 0 THEN
        RAISE NOTICE '✅ Fila webhook vazia';
        RETURN;
    END IF;
    
    -- Processar até 10 mensagens
    FOR i IN 1..LEAST(v_total_in_queue, 10) LOOP
        BEGIN
            -- Ler uma mensagem da fila
            SELECT * INTO v_msg_record 
            FROM pgmq.read('webhook_message_queue', 1, 1);
            
            IF v_msg_record IS NULL THEN
                RAISE NOTICE '⚠️ Não conseguiu ler mensagem %', i;
                CONTINUE;
            END IF;
            
            RAISE NOTICE '🔄 Processando mensagem % de %: msg_id=%', i, v_total_in_queue, v_msg_record.msg_id;
            
            -- Executar o worker
            PERFORM webhook_media_worker();
            
            v_processed_count := v_processed_count + 1;
            RAISE NOTICE '✅ Mensagem % processada', i;
            
        EXCEPTION
            WHEN OTHERS THEN
                v_error_count := v_error_count + 1;
                RAISE NOTICE '❌ Erro processando mensagem %: %', i, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '📊 RESULTADO: Processadas: %, Erros: %, Total na fila: %', 
                 v_processed_count, v_error_count, v_total_in_queue;
END $$;

-- 4️⃣ VERIFICAR SE WORKERS EXISTEM E ESTÃO FUNCIONANDO
-- ================================================================

-- 4.1 Verificar se workers existem
SELECT 
    '🔧 WORKERS DISPONÍVEIS' as categoria,
    routine_name as worker_name,
    routine_type,
    CASE 
        WHEN routine_name = 'webhook_media_worker' THEN 'Processa fila webhook'
        WHEN routine_name = 'app_media_worker' THEN 'Processa fila app'
        WHEN routine_name = 'ai_media_worker' THEN 'Processa fila AI'
        ELSE 'Worker desconhecido'
    END as descricao
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%_media_worker%'
ORDER BY routine_name;

-- 4.2 Testar worker diretamente
DO $$
DECLARE
    v_result RECORD;
BEGIN
    RAISE NOTICE '🧪 TESTANDO WORKER WEBHOOK DIRETAMENTE...';
    
    -- Verificar se existe função
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'webhook_media_worker'
    ) THEN
        RAISE NOTICE '❌ Worker webhook_media_worker NÃO EXISTE!';
        RETURN;
    END IF;
    
    -- Tentar executar
    BEGIN
        SELECT * FROM webhook_media_worker() INTO v_result;
        RAISE NOTICE '✅ Worker executou: %', v_result;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Erro executando worker: %', SQLERRM;
    END;
END $$;

-- 5️⃣ VERIFICAR TABELA DE CONTROLE DE PROCESSAMENTO
-- ================================================================

SELECT 
    '📊 CONTROLE DE PROCESSAMENTO RECENTE' as categoria,
    id,
    queue_name,
    message_id,
    external_message_id,
    message_type,
    processing_status,
    source_edge,
    error_message,
    started_at,
    completed_at,
    age(now(), started_at) as idade_processamento
FROM queue_processing_control
WHERE started_at > now() - interval '1 hour'
ORDER BY started_at DESC
LIMIT 10;

-- 6️⃣ VERIFICAR SE HÁ PROBLEMAS COM STORAGE
-- ================================================================

-- Testar se conseguimos inserir direto no Storage (simulação)
DO $$
DECLARE
    v_test_url TEXT;
    v_message_id UUID;
BEGIN
    -- Pegar uma mensagem sem URL para teste
    SELECT id INTO v_message_id
    FROM messages 
    WHERE media_type != 'text' 
    AND media_url IS NULL
    AND created_at > now() - interval '1 hour'
    LIMIT 1;
    
    IF v_message_id IS NULL THEN
        RAISE NOTICE '⚠️ Nenhuma mensagem de teste encontrada';
        RETURN;
    END IF;
    
    -- Simular URL do Storage
    v_test_url := 'https://nruwnhcqhcdtxlqhygis.supabase.co/storage/v1/object/public/whatsapp-media/test_' || 
                  v_message_id || '_' || extract(epoch from now())::text || '.jpg';
    
    -- Tentar atualizar
    UPDATE messages 
    SET media_url = v_test_url
    WHERE id = v_message_id;
    
    RAISE NOTICE '✅ TESTE UPDATE: Conseguiu atualizar media_url para message_id: %', v_message_id;
    
    -- Reverter teste
    UPDATE messages 
    SET media_url = NULL
    WHERE id = v_message_id;
    
    RAISE NOTICE '✅ Teste revertido';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro no teste de update: %', SQLERRM;
END $$;

-- 7️⃣ RESULTADO FINAL
-- ================================================================

SELECT 
    '📈 RESUMO APÓS VERIFICAÇÃO' as categoria,
    COUNT(*) FILTER (WHERE media_type != 'text') as total_midia,
    COUNT(*) FILTER (WHERE media_type != 'text' AND media_url IS NULL) as sem_url,
    COUNT(*) FILTER (WHERE media_type != 'text' AND media_url LIKE 'https://%') as com_url,
    COUNT(*) FILTER (WHERE media_type != 'text' AND created_at > now() - interval '1 hour') as midia_ultima_hora
FROM messages 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID
AND whatsapp_number_id = '66ae98b4-1c72-49e4-a7e9-ab774db101ec'::UUID;

-- ================================================================
-- ✅ FIM DA VERIFICAÇÃO
-- ================================================================