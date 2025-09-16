-- ================================================================
-- CONFIGURAR EXECUÇÃO AUTOMÁTICA DOS WORKERS JÁ EXISTENTES
-- ================================================================

-- 🎯 USANDO OS WORKERS QUE JÁ CRIAMOS NA FASE 3!
-- NÃO precisa criar mais nada, apenas executar o que já existe

-- ================================================================
-- 1️⃣ VERIFICAR WORKERS EXISTENTES
-- ================================================================

SELECT 
    '✅ WORKERS JÁ CRIADOS' as status,
    routine_name as worker_name,
    CASE 
        WHEN routine_name = 'webhook_media_worker' THEN 'Processa fila WEBHOOK'
        WHEN routine_name = 'app_media_worker' THEN 'Processa fila APP'
        WHEN routine_name = 'ai_media_worker' THEN 'Processa fila AI'
    END as funcao
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('webhook_media_worker', 'app_media_worker', 'ai_media_worker');

-- ================================================================
-- 2️⃣ EXECUTAR WORKERS MANUALMENTE AGORA
-- ================================================================

-- 2.1 Processar fila WEBHOOK
DO $$
DECLARE
    v_result RECORD;
    v_count INT := 0;
BEGIN
    RAISE NOTICE '🔄 PROCESSANDO FILA WEBHOOK...';
    
    -- Processar até 20 mensagens
    FOR i IN 1..20 LOOP
        SELECT * FROM webhook_media_worker() INTO v_result;
        
        IF v_result IS NULL THEN
            EXIT; -- Fila vazia
        END IF;
        
        v_count := v_count + 1;
        RAISE NOTICE '✅ Webhook worker processou mensagem %', i;
    END LOOP;
    
    RAISE NOTICE '✅ WEBHOOK: % mensagens processadas', v_count;
END $$;

-- 2.2 Processar fila APP
DO $$
DECLARE
    v_result RECORD;
    v_count INT := 0;
BEGIN
    RAISE NOTICE '🔄 PROCESSANDO FILA APP...';
    
    FOR i IN 1..20 LOOP
        SELECT * FROM app_media_worker() INTO v_result;
        
        IF v_result IS NULL THEN
            EXIT; -- Fila vazia
        END IF;
        
        v_count := v_count + 1;
        RAISE NOTICE '✅ App worker processou mensagem %', i;
    END LOOP;
    
    RAISE NOTICE '✅ APP: % mensagens processadas', v_count;
END $$;

-- 2.3 Processar fila AI
DO $$
DECLARE
    v_result RECORD;
    v_count INT := 0;
BEGIN
    RAISE NOTICE '🔄 PROCESSANDO FILA AI...';
    
    FOR i IN 1..20 LOOP
        SELECT * FROM ai_media_worker() INTO v_result;
        
        IF v_result IS NULL THEN
            EXIT; -- Fila vazia
        END IF;
        
        v_count := v_count + 1;
        RAISE NOTICE '✅ AI worker processou mensagem %', i;
    END LOOP;
    
    RAISE NOTICE '✅ AI: % mensagens processadas', v_count;
END $$;

-- ================================================================
-- 3️⃣ VERIFICAR MENSAGENS APÓS PROCESSAMENTO
-- ================================================================

SELECT 
    '📊 MENSAGENS PROCESSADAS (ÚLTIMOS 10 MIN)' as categoria,
    id,
    text,
    media_type,
    media_url,
    CASE 
        WHEN media_url IS NULL THEN '❌ SEM URL'
        WHEN media_url LIKE 'https://%' THEN '✅ COM STORAGE URL'
        ELSE '⚠️ URL ESTRANHA'
    END as status_url,
    created_at
FROM messages 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID
AND media_type != 'text'
AND created_at > now() - interval '10 minutes'
ORDER BY created_at DESC;

-- ================================================================
-- 4️⃣ CONFIGURAR CRON PARA EXECUÇÃO AUTOMÁTICA
-- ================================================================

-- 4.1 Verificar se extensão pg_cron existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        RAISE NOTICE '✅ pg_cron disponível - configurando jobs...';
        
        -- Remover jobs antigos se existirem
        PERFORM cron.unschedule('process_webhook_media');
        PERFORM cron.unschedule('process_app_media');
        PERFORM cron.unschedule('process_ai_media');
        
        -- Criar novos jobs - executar a cada 30 segundos
        PERFORM cron.schedule(
            'process_webhook_media',
            '*/30 * * * * *', -- A cada 30 segundos
            $$SELECT webhook_media_worker();$$
        );
        
        PERFORM cron.schedule(
            'process_app_media',
            '*/30 * * * * *', -- A cada 30 segundos
            $$SELECT app_media_worker();$$
        );
        
        PERFORM cron.schedule(
            'process_ai_media',
            '*/30 * * * * *', -- A cada 30 segundos
            $$SELECT ai_media_worker();$$
        );
        
        RAISE NOTICE '✅ Jobs agendados para rodar a cada 30 segundos';
    ELSE
        RAISE NOTICE '⚠️ pg_cron NÃO disponível - workers precisam ser executados manualmente';
    END IF;
END $$;

-- ================================================================
-- 5️⃣ ALTERNATIVA: CRIAR FUNÇÃO PARA EXECUTAR TODOS WORKERS
-- ================================================================

CREATE OR REPLACE FUNCTION process_all_media_queues()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_webhook_count INT := 0;
    v_app_count INT := 0;
    v_ai_count INT := 0;
    v_result RECORD;
BEGIN
    -- Processar webhook queue
    FOR i IN 1..10 LOOP
        SELECT * FROM webhook_media_worker() INTO v_result;
        EXIT WHEN v_result IS NULL;
        v_webhook_count := v_webhook_count + 1;
    END LOOP;
    
    -- Processar app queue
    FOR i IN 1..10 LOOP
        SELECT * FROM app_media_worker() INTO v_result;
        EXIT WHEN v_result IS NULL;
        v_app_count := v_app_count + 1;
    END LOOP;
    
    -- Processar ai queue
    FOR i IN 1..10 LOOP
        SELECT * FROM ai_media_worker() INTO v_result;
        EXIT WHEN v_result IS NULL;
        v_ai_count := v_ai_count + 1;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'webhook_processed', v_webhook_count,
        'app_processed', v_app_count,
        'ai_processed', v_ai_count,
        'total_processed', v_webhook_count + v_app_count + v_ai_count
    );
END;
$$;

-- Executar a função
SELECT process_all_media_queues();

-- ================================================================
-- 6️⃣ VERIFICAR RESULTADO FINAL
-- ================================================================

SELECT 
    '✅ RESUMO FINAL' as categoria,
    COUNT(*) FILTER (WHERE media_type != 'text') as total_midia,
    COUNT(*) FILTER (WHERE media_type != 'text' AND media_url IS NULL) as sem_url,
    COUNT(*) FILTER (WHERE media_type != 'text' AND media_url LIKE 'https://%') as com_storage_url,
    ROUND(
        COUNT(*) FILTER (WHERE media_type != 'text' AND media_url LIKE 'https://%')::numeric * 100.0 /
        NULLIF(COUNT(*) FILTER (WHERE media_type != 'text'), 0),
        2
    ) as percentual_processado
FROM messages 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID;

-- ================================================================
-- ✅ WORKERS JÁ EXISTENTES CONFIGURADOS PARA RODAR!
-- ================================================================