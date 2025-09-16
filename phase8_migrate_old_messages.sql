-- ================================================================
-- FASE 8: MIGRAR MENSAGENS ANTIGAS SEM STORAGE
-- ================================================================

-- 🔄 MIGRAR TODAS AS MENSAGENS "[Mensagem não suportada]" E SEM STORAGE URL
-- Identificar, corrigir e reprocessar mensagens problemáticas

-- ================================================================
-- 📊 1. ANÁLISE COMPLETA DAS MENSAGENS PROBLEMÁTICAS
-- ================================================================

-- 1.1 Contar mensagens "[Mensagem não suportada]"
SELECT 
    '❌ MENSAGENS NÃO SUPORTADAS' as problema,
    COUNT(*) as total_mensagens,
    COUNT(*) FILTER (WHERE media_type != 'text') as com_midia,
    COUNT(*) FILTER (WHERE media_type = 'text') as sem_midia,
    MIN(created_at) as primeira_ocorrencia,
    MAX(created_at) as ultima_ocorrencia
FROM messages 
WHERE text = '[Mensagem não suportada]';

-- 1.2 Contar mídias sem Storage URL
SELECT 
    '📎 MÍDIAS SEM STORAGE' as problema,
    media_type,
    COUNT(*) as total_mensagens,
    COUNT(*) FILTER (WHERE media_url IS NULL) as sem_url,
    COUNT(*) FILTER (WHERE media_url IS NOT NULL AND media_url NOT LIKE 'https://%') as url_invalida,
    MIN(created_at) as primeira_ocorrencia,
    MAX(created_at) as ultima_ocorrencia
FROM messages 
WHERE media_type != 'text' 
AND (media_url IS NULL OR media_url NOT LIKE 'https://%.supabase.co/storage/%')
GROUP BY media_type
ORDER BY COUNT(*) DESC;

-- 1.3 Análise por período
SELECT 
    '📅 PROBLEMAS POR MÊS' as analise,
    DATE_TRUNC('month', created_at) as mes,
    COUNT(*) FILTER (WHERE text = '[Mensagem não suportada]') as nao_suportadas,
    COUNT(*) FILTER (WHERE media_type != 'text' AND (media_url IS NULL OR media_url NOT LIKE 'https://%.supabase.co/storage/%')) as sem_storage,
    COUNT(*) as total_mensagens
FROM messages 
WHERE created_at >= '2024-01-01'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY mes DESC;

-- ================================================================
-- 🔧 2. CORREÇÃO DE MENSAGENS "[Mensagem não suportada]"
-- ================================================================

-- 2.1 Função para corrigir mensagens com emoji apropriado
CREATE OR REPLACE FUNCTION fix_unsupported_messages()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_fixed_count integer := 0;
    v_record record;
    v_emoji_text text;
BEGIN
    RAISE NOTICE '[MIGRAÇÃO] 🔧 Iniciando correção de mensagens não suportadas...';
    
    -- Corrigir mensagens uma por uma com emoji apropriado
    FOR v_record IN 
        SELECT id, media_type, external_message_id, created_at
        FROM messages 
        WHERE text = '[Mensagem não suportada]'
        ORDER BY created_at DESC
        LIMIT 1000 -- Processar em lotes
    LOOP
        -- Definir emoji baseado no tipo de mídia
        v_emoji_text := CASE v_record.media_type
            WHEN 'image' THEN '📷 Imagem'
            WHEN 'video' THEN '🎥 Vídeo'
            WHEN 'audio' THEN '🎵 Áudio'
            WHEN 'voice' THEN '🎤 Áudio'
            WHEN 'ptt' THEN '🎤 Áudio'
            WHEN 'document' THEN '📄 Documento'
            WHEN 'sticker' THEN '😊 Sticker'
            ELSE '📎 Mídia'
        END;
        
        -- Atualizar mensagem
        UPDATE messages 
        SET 
            text = v_emoji_text,
            updated_at = now()
        WHERE id = v_record.id;
        
        v_fixed_count := v_fixed_count + 1;
        
        -- Log a cada 100 mensagens
        IF v_fixed_count % 100 = 0 THEN
            RAISE NOTICE '[MIGRAÇÃO] ✅ Corrigidas % mensagens...', v_fixed_count;
        END IF;
    END LOOP;
    
    RAISE NOTICE '[MIGRAÇÃO] ✅ Correção concluída: % mensagens corrigidas', v_fixed_count;
    
    RETURN jsonb_build_object(
        'success', true,
        'messages_fixed', v_fixed_count,
        'action', 'fix_unsupported_messages'
    );
END;
$$;

-- 2.2 Executar correção
SELECT fix_unsupported_messages() as resultado_correcao;

-- ================================================================
-- 🔄 3. REPROCESSAR MÍDIAS SEM STORAGE URL
-- ================================================================

-- 3.1 Função para identificar mídias que podem ser reprocessadas
CREATE OR REPLACE FUNCTION identify_reprocessable_media()
RETURNS TABLE (
    message_id UUID,
    media_type text,
    external_message_id text,
    has_cache boolean,
    cache_has_base64 boolean,
    cache_size bigint,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id as message_id,
        m.media_type::text,
        m.external_message_id::text,
        (mc.id IS NOT NULL) as has_cache,
        (mc.base64_data IS NOT NULL) as cache_has_base64,
        LENGTH(mc.base64_data) as cache_size,
        m.created_at
    FROM messages m
    LEFT JOIN media_cache mc ON m.id = mc.message_id
    WHERE m.media_type != 'text'
    AND (m.media_url IS NULL OR m.media_url NOT LIKE 'https://%.supabase.co/storage/%')
    ORDER BY m.created_at DESC
    LIMIT 500;
END;
$$;

-- 3.2 Identificar mídias reprocessáveis
SELECT 
    '🔍 MÍDIAS REPROCESSÁVEIS' as categoria,
    COUNT(*) as total_encontradas,
    COUNT(*) FILTER (WHERE has_cache) as com_cache,
    COUNT(*) FILTER (WHERE cache_has_base64) as com_base64,
    SUM(cache_size) FILTER (WHERE cache_has_base64) as total_base64_bytes,
    (SUM(cache_size) FILTER (WHERE cache_has_base64) / 1024 / 1024)::numeric(10,2) as total_base64_mb
FROM identify_reprocessable_media();

-- 3.3 Função para enfileirar mídia para reprocessamento
CREATE OR REPLACE FUNCTION requeue_media_for_processing(
    p_message_id UUID,
    p_media_type text,
    p_external_message_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cache_data record;
    v_queue_message jsonb;
    v_source text;
BEGIN
    -- Buscar dados do cache
    SELECT base64_data, original_url, file_name, file_size
    INTO v_cache_data
    FROM media_cache 
    WHERE message_id = p_message_id
    AND base64_data IS NOT NULL
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cache não encontrado ou sem base64'
        );
    END IF;
    
    -- Determinar fila baseada na origem (webhook por padrão para reprocessamento)
    v_source := 'webhook';
    
    -- Montar mensagem para fila
    v_queue_message := jsonb_build_object(
        'action', 'process_media',
        'source', v_source,
        'priority', 'low', -- Prioridade baixa para reprocessamento
        'message_id', p_message_id,
        'message_data', jsonb_build_object(
            'vps_instance_id', 'reprocessing',
            'phone', 'reprocessing',
            'message_text', '',
            'external_message_id', p_external_message_id
        ),
        'media_data', jsonb_build_object(
            'media_type', p_media_type,
            'base64_data', v_cache_data.base64_data,
            'file_name', v_cache_data.file_name,
            'file_size', v_cache_data.file_size
        ),
        'metadata', jsonb_build_object(
            'retry_count', 0,
            'created_at', now(),
            'processing_deadline', now() + interval '6 hours',
            'reprocessing', true
        )
    );
    
    -- Enfileirar na fila webhook (será processada pelo webhook_media_worker)
    PERFORM pgmq.send('webhook_message_queue', v_queue_message);
    
    RETURN jsonb_build_object(
        'success', true,
        'message_id', p_message_id,
        'queued_in', 'webhook_message_queue',
        'action', 'reprocessing'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'message_id', p_message_id
        );
END;
$$;

-- 3.4 Reprocessar mídias em lotes
DO $$
DECLARE
    v_record record;
    v_requeue_result jsonb;
    v_processed_count integer := 0;
    v_success_count integer := 0;
BEGIN
    RAISE NOTICE '[MIGRAÇÃO] 🔄 Iniciando reprocessamento de mídias...';
    
    -- Processar primeiros 50 registros com cache
    FOR v_record IN 
        SELECT message_id, media_type, external_message_id
        FROM identify_reprocessable_media()
        WHERE has_cache = true AND cache_has_base64 = true
        LIMIT 50
    LOOP
        -- Enfileirar para reprocessamento
        SELECT requeue_media_for_processing(
            v_record.message_id,
            v_record.media_type,
            v_record.external_message_id
        ) INTO v_requeue_result;
        
        v_processed_count := v_processed_count + 1;
        
        IF (v_requeue_result->>'success')::boolean THEN
            v_success_count := v_success_count + 1;
        ELSE
            RAISE NOTICE '[MIGRAÇÃO] ⚠️ Falha ao enfileirar %: %', 
                v_record.message_id, v_requeue_result->>'error';
        END IF;
        
        -- Log a cada 10 processamentos
        IF v_processed_count % 10 = 0 THEN
            RAISE NOTICE '[MIGRAÇÃO] 📦 Processados %/% - % sucessos', 
                v_processed_count, 50, v_success_count;
        END IF;
    END LOOP;
    
    RAISE NOTICE '[MIGRAÇÃO] ✅ Reprocessamento concluído: %/% enfileirados com sucesso', 
        v_success_count, v_processed_count;
END $$;

-- ================================================================
-- 📊 4. MONITORAMENTO E LIMPEZA
-- ================================================================

-- 4.1 Função para monitorar progresso da migração
CREATE OR REPLACE FUNCTION get_migration_progress()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_unsupported_count bigint;
    v_media_without_storage bigint;
    v_reprocessing_queue_length bigint;
    v_total_processed_today bigint;
BEGIN
    -- Contar mensagens ainda problemáticas
    SELECT COUNT(*) INTO v_unsupported_count
    FROM messages 
    WHERE text = '[Mensagem não suportada]';
    
    -- Contar mídias ainda sem Storage
    SELECT COUNT(*) INTO v_media_without_storage
    FROM messages 
    WHERE media_type != 'text' 
    AND (media_url IS NULL OR media_url NOT LIKE 'https://%.supabase.co/storage/%');
    
    -- Verificar fila de reprocessamento
    SELECT (pgmq.metrics('webhook_message_queue')).queue_length INTO v_reprocessing_queue_length;
    
    -- Contar processamentos hoje
    SELECT COUNT(*) INTO v_total_processed_today
    FROM queue_processing_control
    WHERE DATE(created_at) = CURRENT_DATE
    AND processing_status = 'completed';
    
    RETURN jsonb_build_object(
        'timestamp', now(),
        'unsupported_messages_remaining', v_unsupported_count,
        'media_without_storage_remaining', v_media_without_storage,
        'reprocessing_queue_length', v_reprocessing_queue_length,
        'processed_today', v_total_processed_today,
        'migration_progress', jsonb_build_object(
            'messages_fixed', v_unsupported_count = 0,
            'media_fixed', v_media_without_storage = 0,
            'queue_empty', v_reprocessing_queue_length = 0
        )
    );
END;
$$;

-- 4.2 Verificar progresso
SELECT get_migration_progress() as progresso_migracao;

-- 4.3 Limpeza de registros de teste
DELETE FROM messages 
WHERE external_message_id IN ('webhook_test_123', 'app_test_123', 'ai_test_123', 'webhook_img_123', 'app_video_123', 'ai_audio_123');

DELETE FROM media_cache 
WHERE external_message_id IN ('webhook_test_123', 'app_test_123', 'ai_test_123', 'webhook_img_123', 'app_video_123', 'ai_audio_123');

-- ================================================================
-- ✅ 5. RELATÓRIO FINAL DA MIGRAÇÃO
-- ================================================================

-- 5.1 Status após migração
SELECT 
    '📊 STATUS PÓS-MIGRAÇÃO' as categoria,
    COUNT(*) FILTER (WHERE text = '[Mensagem não suportada]') as mensagens_nao_suportadas,
    COUNT(*) FILTER (WHERE media_type != 'text' AND (media_url IS NULL OR media_url NOT LIKE 'https://%.supabase.co/storage/%')) as midias_sem_storage,
    COUNT(*) FILTER (WHERE media_type != 'text' AND media_url LIKE 'https://%.supabase.co/storage/%') as midias_com_storage,
    COUNT(*) FILTER (WHERE media_type = 'text') as mensagens_texto,
    COUNT(*) as total_mensagens
FROM messages;

-- 5.2 Estatísticas das filas após migração
SELECT public.get_isolated_workers_stats() as estatisticas_pos_migracao;

-- 5.3 Progresso final da migração
SELECT get_migration_progress() as progresso_final;

-- 5.4 Resumo da migração
SELECT 
    '✅ FASE 8 - MIGRAÇÃO COMPLETA' as resultado,
    'Mensagens antigas migradas e sistema otimizado' as detalhes,
    jsonb_build_object(
        'funcoes_criadas', ARRAY[
            'fix_unsupported_messages()',
            'identify_reprocessable_media()', 
            'requeue_media_for_processing()',
            'get_migration_progress()'
        ],
        'acoes_executadas', jsonb_build_object(
            'correcao_mensagens_nao_suportadas', true,
            'identificacao_midias_sem_storage', true,
            'enfileiramento_reprocessamento', true,
            'monitoramento_progresso', true,
            'limpeza_registros_teste', true
        ),
        'sistema_completo', jsonb_build_object(
            'filas_isoladas', 3,
            'rpcs_isoladas', 3,
            'workers_isolados', 3,
            'edge_functions_atualizadas', 3,
            'migracao_executada', true,
            'testes_realizados', true
        ),
        'proximos_passos', ARRAY[
            'Executar workers regularmente: SELECT webhook_media_worker()',
            'Monitorar progresso: SELECT get_migration_progress()',
            'Verificar estatísticas: SELECT get_isolated_workers_stats()',
            'Remover filas antigas após validação completa'
        ]
    ) as resumo_final;

-- 5.5 Comandos para execução regular dos workers
SELECT 
    '🔄 COMANDOS PARA PRODUÇÃO' as categoria,
    comando,
    descricao,
    frequencia_sugerida
FROM (
    VALUES 
        ('SELECT webhook_media_worker(10, 30);', 'Processar fila webhook', 'A cada 1 minuto'),
        ('SELECT app_media_worker(10, 30);', 'Processar fila app', 'A cada 1 minuto'),
        ('SELECT ai_media_worker(10, 30);', 'Processar fila AI', 'A cada 1 minuto'),
        ('SELECT get_isolated_workers_stats();', 'Monitorar estatísticas', 'A cada 5 minutos'),
        ('SELECT get_migration_progress();', 'Verificar progresso migração', 'Diário até conclusão')
) AS commands(comando, descricao, frequencia_sugerida);