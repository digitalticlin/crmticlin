-- ================================================================
-- MIGRAR MENSAGENS PENDENTES DAS FILAS ANTIGAS PARA AS NOVAS
-- ================================================================

-- 🔄 PROCESSAR 5.727 MENSAGENS PENDENTES ANTES DA LIMPEZA

-- ================================================================
-- 📊 1. ANALISAR MENSAGENS PENDENTES POR FILA
-- ================================================================

-- 1.1 Verificar conteúdo das filas antigas
SELECT 
    'ANÁLISE DE CONTEÚDO' as categoria,
    'media_processing_queue' as fila,
    (pgmq.metrics('media_processing_queue')).queue_length as pendentes,
    (pgmq.metrics('media_processing_queue')).total_messages as total
UNION ALL
SELECT 
    'ANÁLISE DE CONTEÚDO',
    'webhook_processing_queue',
    (pgmq.metrics('webhook_processing_queue')).queue_length,
    (pgmq.metrics('webhook_processing_queue')).total_messages
UNION ALL
SELECT 
    'ANÁLISE DE CONTEÚDO',
    'profile_pic_download_queue',
    (pgmq.metrics('profile_pic_download_queue')).queue_length,
    (pgmq.metrics('profile_pic_download_queue')).total_messages;

-- ================================================================
-- 🔄 2. FUNÇÃO PARA MIGRAR MENSAGENS DE UMA FILA PARA OUTRA
-- ================================================================

CREATE OR REPLACE FUNCTION migrate_queue_messages(
    p_source_queue text,
    p_target_queue text,
    p_batch_size integer DEFAULT 100
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_migrated_count integer := 0;
    v_failed_count integer := 0;
    v_message_record record;
    v_message_data jsonb;
    v_new_message jsonb;
BEGIN
    RAISE NOTICE '[MIGRAÇÃO] 🔄 Migrando de % para % (lote: %)', p_source_queue, p_target_queue, p_batch_size;
    
    -- Processar mensagens em lotes
    FOR i IN 1..p_batch_size LOOP
        BEGIN
            -- Ler próxima mensagem da fila antiga
            EXECUTE format('SELECT * FROM pgmq.read(%L, 1, 5)', p_source_queue)
            INTO v_message_record;
            
            -- Se não há mais mensagens, parar
            IF v_message_record IS NULL THEN
                RAISE NOTICE '[MIGRAÇÃO] ✅ Fila % esgotada - migradas: %', p_source_queue, v_migrated_count;
                EXIT;
            END IF;
            
            v_message_data := v_message_record.message;
            
            -- Adaptar formato da mensagem para nova estrutura
            CASE p_source_queue
                WHEN 'media_processing_queue' THEN
                    -- Converter para formato webhook_message_queue
                    v_new_message := jsonb_build_object(
                        'action', 'process_media',
                        'source', 'webhook',
                        'priority', 'low',
                        'message_id', v_message_data->>'messageId',
                        'message_data', jsonb_build_object(
                            'vps_instance_id', 'migrated',
                            'phone', 'migrated',
                            'message_text', '',
                            'external_message_id', v_message_data->>'messageId'
                        ),
                        'media_data', v_message_data->'mediaData',
                        'metadata', jsonb_build_object(
                            'retry_count', 0,
                            'created_at', now(),
                            'processing_deadline', now() + interval '6 hours',
                            'migrated_from', p_source_queue
                        )
                    );
                    
                WHEN 'webhook_processing_queue' THEN
                    -- Converter para formato webhook_message_queue
                    v_new_message := jsonb_build_object(
                        'action', 'process_message',
                        'source', 'webhook',
                        'priority', 'low',
                        'message_data', v_message_data,
                        'metadata', jsonb_build_object(
                            'retry_count', 0,
                            'created_at', now(),
                            'migrated_from', p_source_queue
                        )
                    );
                    
                ELSE
                    -- Formato genérico para outras filas
                    v_new_message := jsonb_build_object(
                        'action', 'process_legacy',
                        'source', 'migration',
                        'priority', 'low',
                        'legacy_data', v_message_data,
                        'metadata', jsonb_build_object(
                            'retry_count', 0,
                            'created_at', now(),
                            'migrated_from', p_source_queue
                        )
                    );
            END CASE;
            
            -- Enviar para fila nova
            EXECUTE format('SELECT pgmq.send(%L, %L)', p_target_queue, v_new_message);
            
            -- Remover da fila antiga
            EXECUTE format('SELECT pgmq.delete(%L, %s)', p_source_queue, v_message_record.msg_id);
            
            v_migrated_count := v_migrated_count + 1;
            
            -- Log a cada 50 mensagens
            IF v_migrated_count % 50 = 0 THEN
                RAISE NOTICE '[MIGRAÇÃO] 📦 Migradas %/% mensagens...', v_migrated_count, p_batch_size;
            END IF;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '[MIGRAÇÃO] ❌ Erro ao migrar mensagem %: %', v_message_record.msg_id, SQLERRM;
                v_failed_count := v_failed_count + 1;
                
                -- Tentar remover mensagem problemática
                BEGIN
                    EXECUTE format('SELECT pgmq.delete(%L, %s)', p_source_queue, v_message_record.msg_id);
                EXCEPTION
                    WHEN OTHERS THEN
                        RAISE NOTICE '[MIGRAÇÃO] ❌ Erro ao remover mensagem problemática: %', SQLERRM;
                END;
        END;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'source_queue', p_source_queue,
        'target_queue', p_target_queue,
        'migrated_count', v_migrated_count,
        'failed_count', v_failed_count,
        'batch_size', p_batch_size
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'migrated_count', v_migrated_count,
            'failed_count', v_failed_count
        );
END;
$$;

-- ================================================================
-- 🚀 3. EXECUTAR MIGRAÇÕES POR LOTES
-- ================================================================

-- 3.1 Migrar media_processing_queue para webhook_message_queue (287 mensagens)
DO $$
DECLARE
    v_result jsonb;
    v_total_migrated integer := 0;
    v_batch_count integer := 0;
BEGIN
    RAISE NOTICE '=== 🔄 MIGRANDO MEDIA_PROCESSING_QUEUE ===';
    
    -- Processar em lotes de 100
    LOOP
        v_batch_count := v_batch_count + 1;
        
        SELECT migrate_queue_messages('media_processing_queue', 'webhook_message_queue', 100) INTO v_result;
        
        v_total_migrated := v_total_migrated + (v_result->>'migrated_count')::integer;
        
        RAISE NOTICE '[LOTE %] Migradas: %, Falhas: %', 
            v_batch_count, 
            v_result->>'migrated_count', 
            v_result->>'failed_count';
        
        -- Parar se não migrou nenhuma (fila vazia)
        IF (v_result->>'migrated_count')::integer = 0 THEN
            EXIT;
        END IF;
        
        -- Limite de segurança
        IF v_batch_count > 10 THEN
            RAISE NOTICE '⚠️ Limite de lotes atingido, parando...';
            EXIT;
        END IF;
    END LOOP;
    
    RAISE NOTICE '✅ MIGRAÇÃO MEDIA_PROCESSING_QUEUE COMPLETA: % mensagens', v_total_migrated;
END $$;

-- 3.2 Migrar webhook_processing_queue para webhook_message_queue (328 mensagens)
DO $$
DECLARE
    v_result jsonb;
    v_total_migrated integer := 0;
    v_batch_count integer := 0;
BEGIN
    RAISE NOTICE '=== 🔄 MIGRANDO WEBHOOK_PROCESSING_QUEUE ===';
    
    LOOP
        v_batch_count := v_batch_count + 1;
        
        SELECT migrate_queue_messages('webhook_processing_queue', 'webhook_message_queue', 100) INTO v_result;
        
        v_total_migrated := v_total_migrated + (v_result->>'migrated_count')::integer;
        
        RAISE NOTICE '[LOTE %] Migradas: %, Falhas: %', 
            v_batch_count, 
            v_result->>'migrated_count', 
            v_result->>'failed_count';
        
        IF (v_result->>'migrated_count')::integer = 0 THEN
            EXIT;
        END IF;
        
        IF v_batch_count > 10 THEN
            RAISE NOTICE '⚠️ Limite de lotes atingido, parando...';
            EXIT;
        END IF;
    END LOOP;
    
    RAISE NOTICE '✅ MIGRAÇÃO WEBHOOK_PROCESSING_QUEUE COMPLETA: % mensagens', v_total_migrated;
END $$;

-- 3.3 Processar filas menores
SELECT migrate_queue_messages('message_sending_queue', 'app_message_queue', 10) as result_message_sending;
SELECT migrate_queue_messages('ai_message_consult_queue', 'ai_message_queue', 10) as result_ai_consult;
SELECT migrate_queue_messages('profile_pic_queue', 'webhook_message_queue', 10) as result_profile_pic;

-- 3.4 Migrar profile_pic_download_queue (5.107 mensagens) - CUIDADO!
DO $$
DECLARE
    v_result jsonb;
    v_total_migrated integer := 0;
    v_batch_count integer := 0;
    v_max_batches integer := 60; -- Máximo 60 lotes = 6.000 mensagens
BEGIN
    RAISE NOTICE '=== 🔄 MIGRANDO PROFILE_PIC_DOWNLOAD_QUEUE (MÁXIMO 6.000) ===';
    
    LOOP
        v_batch_count := v_batch_count + 1;
        
        SELECT migrate_queue_messages('profile_pic_download_queue', 'webhook_message_queue', 100) INTO v_result;
        
        v_total_migrated := v_total_migrated + (v_result->>'migrated_count')::integer;
        
        RAISE NOTICE '[LOTE %/%] Migradas: %, Total: %', 
            v_batch_count, 
            v_max_batches,
            v_result->>'migrated_count',
            v_total_migrated;
        
        IF (v_result->>'migrated_count')::integer = 0 THEN
            RAISE NOTICE '✅ Fila esgotada';
            EXIT;
        END IF;
        
        IF v_batch_count >= v_max_batches THEN
            RAISE NOTICE '⚠️ Limite de migração atingido (6.000 mensagens)';
            EXIT;
        END IF;
        
        -- Pequena pausa entre lotes
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    RAISE NOTICE '✅ MIGRAÇÃO PROFILE_PIC_DOWNLOAD_QUEUE COMPLETA: % mensagens', v_total_migrated;
    
    -- Verificar se ainda há mensagens
    DECLARE
        v_remaining bigint;
    BEGIN
        SELECT (pgmq.metrics('profile_pic_download_queue')).queue_length INTO v_remaining;
        IF v_remaining > 0 THEN
            RAISE NOTICE '⚠️ AINDA RESTAM % MENSAGENS na profile_pic_download_queue', v_remaining;
        END IF;
    END;
END $$;

-- ================================================================
-- 📊 4. VERIFICAR RESULTADO DA MIGRAÇÃO
-- ================================================================

-- 4.1 Status das filas antigas após migração
SELECT 
    '📊 FILAS ANTIGAS APÓS MIGRAÇÃO' as categoria,
    queue_name,
    (pgmq.metrics(queue_name)).queue_length as mensagens_restantes,
    (pgmq.metrics(queue_name)).total_messages as total_original
FROM (
    VALUES 
        ('media_processing_queue'),
        ('message_sending_queue'),
        ('ai_message_consult_queue'),
        ('webhook_processing_queue'),
        ('profile_pic_queue'),
        ('profile_pic_download_queue')
) AS old_queues(queue_name)
WHERE EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'pgmq' 
    AND tablename = 'q_' || old_queues.queue_name
);

-- 4.2 Status das filas novas após migração
SELECT 
    '📦 FILAS NOVAS APÓS MIGRAÇÃO' as categoria,
    queue_name,
    (pgmq.metrics(queue_name)).queue_length as mensagens_atuais,
    (pgmq.metrics(queue_name)).total_messages as total_processadas
FROM (
    VALUES 
        ('webhook_message_queue'),
        ('app_message_queue'),
        ('ai_message_queue')
) AS new_queues(queue_name);

-- 4.3 Resumo da migração
SELECT 
    '✅ MIGRAÇÃO DE FILAS COMPLETA' as resultado,
    'Mensagens migradas das filas antigas para as novas' as detalhes,
    jsonb_build_object(
        'filas_migradas', ARRAY[
            'media_processing_queue → webhook_message_queue',
            'webhook_processing_queue → webhook_message_queue',
            'message_sending_queue → app_message_queue',
            'ai_message_consult_queue → ai_message_queue',
            'profile_pic_queue → webhook_message_queue',
            'profile_pic_download_queue → webhook_message_queue (parcial)'
        ],
        'proximos_passos', ARRAY[
            'Execute webhook_media_worker() para processar mensagens migradas',
            'Execute app_media_worker() e ai_media_worker() se necessário', 
            'Monitore com get_isolated_workers_stats()',
            'Após validação, execute comandos de limpeza final'
        ]
    ) as detalhes_migracao;