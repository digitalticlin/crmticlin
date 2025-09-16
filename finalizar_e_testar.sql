-- ================================================================
-- 🔍 DEBUGAR E FINALIZAR SISTEMA PARA PRODUÇÃO
-- ================================================================

-- 1. VERIFICAR SE WORKER EXISTE E FUNCIONA
DO $$
DECLARE
    v_worker_exists boolean := false;
    v_result jsonb;
BEGIN
    -- Verificar se função webhook_isolated_worker existe
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'webhook_isolated_worker'
    ) INTO v_worker_exists;
    
    IF v_worker_exists THEN
        RAISE NOTICE '✅ Worker webhook_isolated_worker existe';
        
        -- Testar worker manualmente
        SELECT webhook_isolated_worker() INTO v_result;
        RAISE NOTICE '📊 Resultado do worker: %', v_result;
    ELSE
        RAISE NOTICE '❌ Worker webhook_isolated_worker NÃO existe';
    END IF;
END $$;

-- 2. VERIFICAR FILA webhook_message_queue
SELECT 
    'Status fila webhook' as info,
    CASE 
        WHEN (pgmq.metrics('webhook_message_queue')).queue_length >= 0 THEN 'FILA EXISTE ✅'
        ELSE 'FILA NÃO EXISTE ❌'
    END as status_fila,
    (pgmq.metrics('webhook_message_queue')).queue_length as mensagens_na_fila;

-- 3. EXECUTAR WORKER MANUALMENTE PARA PROCESSAR MENSAGEM PENDENTE
SELECT webhook_isolated_worker() as resultado_manual;

-- 4. VERIFICAR SE MENSAGEM AGORA TEM URL
SELECT 
    'Após executar worker manual' as teste,
    id,
    text,
    media_type,
    CASE 
        WHEN media_url IS NOT NULL AND media_url LIKE '%webhook_%' THEN 'PROCESSADA ✅'
        WHEN media_url IS NOT NULL THEN 'URL GENÉRICA ⚠️'
        ELSE 'AINDA SEM URL ❌'
    END as status,
    media_url
FROM public.messages 
WHERE id = 'aee999ad-cf70-4129-afd7-07491730eaf5';

-- 5. TESTAR NOVO FLUXO COMPLETO
SELECT save_received_message_webhook(
    '712e7708-2299-4a00-9128-577c8f113ca4'::UUID,
    '+5511888888888',
    'Teste final produção',
    false,
    'video',
    'final_prod_' || extract(epoch from now())::text,
    extract(epoch from now())::bigint,
    'base64_video_test_data',
    'video/mp4',
    'final_test.mp4'
) as novo_teste_completo;

-- 6. VERIFICAR ÚLTIMA MENSAGEM CRIADA
SELECT 
    'Último teste completo' as resultado,
    id,
    text,
    media_type,
    CASE 
        WHEN media_url IS NOT NULL AND media_url LIKE '%webhook_%' THEN 'SISTEMA OK PARA PRODUÇÃO ✅'
        WHEN media_url IS NOT NULL THEN 'URL GENÉRICA ⚠️'
        ELSE 'AINDA COM PROBLEMA ❌'
    END as status_producao,
    media_url
FROM public.messages 
WHERE created_at > now() - interval '30 seconds'
ORDER BY created_at DESC
LIMIT 1;

-- 7. STATUS FINAL DO SISTEMA
SELECT 
    '🎯 DIAGNÓSTICO FINAL' as categoria,
    CASE 
        WHEN COUNT(*) FILTER (WHERE media_url IS NOT NULL AND media_url LIKE '%webhook_%') > 0 
        THEN '✅ SISTEMA PRONTO PARA PRODUÇÃO'
        WHEN COUNT(*) FILTER (WHERE media_url IS NOT NULL) > 0
        THEN '⚠️ SISTEMA FUNCIONA MAS PRECISA AJUSTE'
        ELSE '❌ SISTEMA AINDA COM PROBLEMAS'
    END as status_geral,
    COUNT(*) as total_testes,
    COUNT(*) FILTER (WHERE media_url IS NOT NULL) as com_url,
    COUNT(*) FILTER (WHERE media_url LIKE '%webhook_%') as com_url_isolada
FROM public.messages 
WHERE created_at > now() - interval '5 minutes'
AND media_type != 'text';