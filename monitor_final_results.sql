-- ================================================================
-- MONITORAMENTO FINAL: VERIFICAR SE CORREÇÃO RESOLVEU O PROBLEMA
-- ================================================================

-- 🎯 OBJETIVO: Monitorar se "Message ID not returned" foi resolvido
-- 🔍 VERIFICAR: Se Storage URLs estão sendo geradas após correção

-- ================================================================
-- 1️⃣ RESUMO GERAL DO PROBLEMA RESOLVIDO
-- ================================================================

SELECT 
    '📊 ANÁLISE ANTES VS DEPOIS DA CORREÇÃO' as categoria,
    jsonb_build_object(
        'problema_identificado', 'RPC retornava { message_id: "..." } mas Edge Function esperava { data: { message_id: "..." } }',
        'sintoma', 'Message ID not returned - Edge Function não conseguia acessar result.data.message_id',
        'consequencia', 'Mensagens não eram enfileiradas, workers não processavam, Storage URLs não geradas',
        'correção_aplicada', 'RPC modificada para retornar estrutura aninhada em "data"',
        'resultado_esperado', 'Edge Function agora acessa result.data.message_id corretamente'
    ) as detalhes;

-- ================================================================
-- 2️⃣ VERIFICAR ESTRUTURA ATUAL DAS MENSAGENS
-- ================================================================

SELECT 
    '📈 ESTATÍSTICAS ATUAIS' as status,
    COUNT(*) as total_mensagens_midia,
    COUNT(*) FILTER (WHERE media_url IS NOT NULL AND media_url LIKE 'https://%') as com_storage_url,
    COUNT(*) FILTER (WHERE media_url IS NULL OR media_url NOT LIKE 'https://%') as sem_storage_url,
    ROUND(
        COUNT(*) FILTER (WHERE media_url IS NOT NULL AND media_url LIKE 'https://%')::numeric * 100.0 / 
        NULLIF(COUNT(*), 0), 2
    ) as percentual_processado
FROM messages 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID
AND media_type != 'text'
AND created_at > now() - interval '3 hours';

-- ================================================================
-- 3️⃣ MENSAGENS MAIS RECENTES E SEUS STATUS
-- ================================================================

SELECT 
    '🔍 ÚLTIMAS MENSAGENS POR TIPO' as categoria,
    media_type::text,
    COUNT(*) as quantidade,
    COUNT(*) FILTER (WHERE media_url IS NOT NULL AND media_url LIKE 'https://%') as com_url,
    COUNT(*) FILTER (WHERE media_url IS NULL) as sem_url,
    ROUND(
        COUNT(*) FILTER (WHERE media_url IS NOT NULL AND media_url LIKE 'https://%')::numeric * 100.0 / 
        NULLIF(COUNT(*), 0), 2
    ) as percentual_sucesso
FROM messages 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID
AND media_type != 'text'
AND created_at > now() - interval '3 hours'
GROUP BY media_type
ORDER BY quantidade DESC;

-- ================================================================
-- 4️⃣ DETALHES DAS MENSAGENS MAIS RECENTES
-- ================================================================

SELECT 
    '📱 MENSAGENS RECENTES DETALHADAS' as status,
    id,
    text,
    media_type::text,
    CASE 
        WHEN media_url IS NOT NULL AND media_url LIKE 'https://nruwnhcqhcdtxlqhygis.supabase.co/storage%' THEN 'URL STORAGE ✅'
        WHEN media_url IS NOT NULL THEN 'URL EXTERNA 🔗'
        ELSE 'SEM URL ❌'
    END as status_media_url,
    CASE 
        WHEN length(media_url) > 50 THEN left(media_url, 47) || '...'
        ELSE media_url
    END as url_preview,
    external_message_id,
    to_char(created_at, 'DD/MM HH24:MI:SS') as criado_em
FROM messages 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID
AND media_type != 'text'
AND created_at > now() - interval '2 hours'
ORDER BY created_at DESC
LIMIT 10;

-- ================================================================
-- 5️⃣ STATUS DAS FILAS E WORKERS
-- ================================================================

SELECT 
    '📦 STATUS FILAS E PROCESSAMENTO' as categoria,
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
-- 6️⃣ VERIFICAR CONTROLE DE PROCESSAMENTO
-- ================================================================

SELECT 
    '⚙️ CONTROLE DE PROCESSAMENTO WORKERS' as status,
    processing_status,
    COUNT(*) as quantidade,
    COUNT(*) FILTER (WHERE processing_status = 'completed') as concluidos,
    COUNT(*) FILTER (WHERE processing_status = 'failed') as falhas,
    COUNT(*) FILTER (WHERE processing_status = 'processing') as em_processamento
FROM public.queue_processing_control
WHERE started_at > now() - interval '2 hours'
GROUP BY processing_status
ORDER BY quantidade DESC;

-- ================================================================
-- 7️⃣ TESTE FINAL: SIMULAR NOVA MENSAGEM
-- ================================================================

DO $$
DECLARE
    v_test_result jsonb;
    v_message_id text;
    v_success boolean;
    v_external_id text;
BEGIN
    RAISE NOTICE '🧪 TESTE FINAL: NOVA MENSAGEM COM CORREÇÃO APLICADA...';
    
    v_external_id := 'FINAL_TEST_' || extract(epoch from now())::text;
    
    -- Simular exatamente como webhook real chama
    SELECT save_received_message_webhook(
        '012c87cc-e10a-47e0-96c6-6f7d28beb7c6',
        '5511999888777@c.us',
        'Teste final correção',
        false,
        'image',
        NULL,
        v_external_id,
        'Usuario Teste',
        NULL,
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        'image/png',
        'teste_final.png'
    ) INTO v_test_result;
    
    -- Extrair dados como Edge Function faz
    v_message_id := v_test_result->'data'->>'message_id';
    v_success := (v_test_result->'data'->>'success')::boolean;
    
    RAISE NOTICE '📊 RESULTADO TESTE FINAL:';
    RAISE NOTICE '  - result.data.message_id: %', v_message_id;
    RAISE NOTICE '  - result.data.success: %', v_success;
    RAISE NOTICE '  - Estrutura completa: %', v_test_result;
    
    IF v_message_id IS NOT NULL AND v_success THEN
        RAISE NOTICE '✅ CORREÇÃO CONFIRMADA: Edge Function agora recebe message_id';
        RAISE NOTICE '🚀 Próximo: Executar worker para gerar Storage URL';
        
        -- Executar worker uma vez para processar
        BEGIN
            DECLARE
                v_worker_result jsonb;
            BEGIN
                SELECT webhook_media_worker() INTO v_worker_result;
                RAISE NOTICE '⚙️ Worker executado: %', v_worker_result;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '❌ Erro no worker: %', SQLERRM;
            END;
        END;
        
    ELSE
        RAISE NOTICE '❌ CORREÇÃO AINDA TEM PROBLEMA';
    END IF;
END $$;

-- ================================================================
-- 8️⃣ RESULTADO DO TESTE FINAL
-- ================================================================

SELECT 
    '🎯 RESULTADO DO TESTE FINAL' as status,
    id,
    text,
    media_type::text,
    CASE 
        WHEN media_url IS NOT NULL AND media_url LIKE 'https://%' THEN 'SUCESSO COMPLETO ✅'
        WHEN media_url IS NULL THEN 'PROCESSAMENTO PENDENTE ⏳'
        ELSE 'PROBLEMA ❌'
    END as status_final,
    media_url,
    external_message_id
FROM messages 
WHERE external_message_id LIKE 'FINAL_TEST_%'
ORDER BY created_at DESC
LIMIT 1;

-- ================================================================
-- 9️⃣ RESUMO EXECUTIVO
-- ================================================================

SELECT 
    '📋 RESUMO EXECUTIVO DA CORREÇÃO' as resultado,
    jsonb_build_object(
        'problema_original', 'Message ID not returned',
        'causa_raiz', 'RPC retornava estrutura incompatível com Edge Function',
        'correção_aplicada', 'RPC modificada para retornar { data: { message_id } }',
        'status_correção', 
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM messages 
                    WHERE external_message_id LIKE 'FINAL_TEST_%'
                    AND media_url IS NOT NULL 
                    AND media_url LIKE 'https://%'
                ) THEN 'CORREÇÃO FUNCIONANDO ✅'
                WHEN EXISTS (
                    SELECT 1 FROM messages 
                    WHERE external_message_id LIKE 'FINAL_TEST_%'
                ) THEN 'MENSAGEM SALVA, AGUARDANDO WORKER ⏳'
                ELSE 'NECESSITA INVESTIGAÇÃO ❌'
            END,
        'próximos_passos', 'Monitorar novas mensagens para confirmar Storage URLs'
    ) as detalhes;