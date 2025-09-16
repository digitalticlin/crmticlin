-- ================================================================
-- 🔍 VERIFICAR SE TRIGGER WEBHOOK FOI CRIADO E TESTAR
-- ================================================================

-- 1. Verificar se nosso trigger webhook foi criado
SELECT 
    'Trigger webhook existe?' as verificacao,
    CASE 
        WHEN COUNT(*) > 0 THEN 'SIM ✅'
        ELSE 'NÃO ❌'
    END as status,
    COUNT(*) as total
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_webhook_media_sync'
AND event_object_table = 'messages';

-- 2. Ver TODOS os triggers (incluindo o nosso)
SELECT 
    'Todos os triggers messages' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    CASE 
        WHEN trigger_name = 'trigger_webhook_media_sync' THEN 'NOSSO TRIGGER ✅'
        ELSE 'TRIGGER EXISTENTE'
    END as tipo
FROM information_schema.triggers 
WHERE event_object_table = 'messages'
ORDER BY trigger_name;

-- 3. Verificar função do trigger
SELECT 
    'Função trigger webhook existe?' as verificacao,
    CASE 
        WHEN COUNT(*) > 0 THEN 'SIM ✅'
        ELSE 'NÃO ❌'
    END as status
FROM pg_proc 
WHERE proname = 'trigger_webhook_media_processing';

-- 4. Verificar função worker síncrono
SELECT 
    'Função worker síncrono existe?' as verificacao,
    CASE 
        WHEN COUNT(*) > 0 THEN 'SIM ✅'  
        ELSE 'NÃO ❌'
    END as status
FROM pg_proc 
WHERE proname = 'webhook_process_media_sync';

-- 5. TESTE FINAL COMPLETO
SELECT save_received_message_webhook(
    '712e7708-2299-4a00-9128-577c8f113ca4'::UUID,
    '+5511777777777',
    'TESTE FINAL COMPLETO',
    false,
    'video',
    'teste_final_completo_' || extract(epoch from now())::text,
    extract(epoch from now())::bigint,
    'base64_video_data_teste_final_12345',
    'video/mp4',
    'teste_final.mp4'
) as resultado_teste_final;

-- 6. Aguardar processamento (trigger é instantâneo)
SELECT pg_sleep(2);

-- 7. VERIFICAR RESULTADO DO TESTE
SELECT 
    '🎯 RESULTADO FINAL' as categoria,
    id,
    text,
    media_type,
    import_source,
    CASE 
        WHEN media_url IS NOT NULL AND media_url LIKE '%webhook/%' THEN 'PERFEITO! SISTEMA FUNCIONANDO ✅'
        WHEN media_url IS NOT NULL THEN 'PROCESSOU MAS URL NÃO ISOLADA ⚠️'
        ELSE 'SISTEMA NÃO FUNCIONOU ❌'
    END as status_sistema,
    CASE 
        WHEN length(media_url) > 80 THEN left(media_url, 77) || '...'
        ELSE media_url
    END as url_gerada,
    created_at
FROM public.messages 
WHERE text = 'TESTE FINAL COMPLETO'
AND created_at > now() - interval '1 minute'
ORDER BY created_at DESC
LIMIT 1;

-- 8. STATUS DA FILA APÓS TESTE
SELECT 
    'Fila webhook após teste final' as info,
    (pgmq.metrics('webhook_message_queue')).queue_length as mensagens_restantes,
    CASE 
        WHEN (pgmq.metrics('webhook_message_queue')).queue_length = 0 THEN 'FILA LIMPA ✅'
        ELSE 'AINDA TEM MENSAGENS PENDENTES ⚠️'
    END as status_fila;

-- 9. DIAGNÓSTICO COMPLETO
SELECT 
    '📊 DIAGNÓSTICO COMPLETO DO SISTEMA' as resumo,
    jsonb_build_object(
        'trigger_webhook_criado', (
            SELECT COUNT(*) > 0 
            FROM information_schema.triggers 
            WHERE trigger_name = 'trigger_webhook_media_sync'
        ),
        'funcao_trigger_existe', (
            SELECT COUNT(*) > 0 
            FROM pg_proc 
            WHERE proname = 'trigger_webhook_media_processing'
        ),
        'funcao_worker_existe', (
            SELECT COUNT(*) > 0 
            FROM pg_proc 
            WHERE proname = 'webhook_process_media_sync'
        ),
        'rpc_atualizada', (
            SELECT prosrc LIKE '%import_source%' 
            FROM pg_proc 
            WHERE proname = 'save_received_message_webhook'
            LIMIT 1
        ),
        'sistema_isolado_funcionando', (
            SELECT COUNT(*) > 0 
            FROM public.messages 
            WHERE import_source = 'webhook' 
            AND media_url LIKE '%webhook/%'
            AND created_at > now() - interval '5 minutes'
        )
    ) as status_componentes;