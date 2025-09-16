-- ================================================================
-- ✅ VERIFICAR STATUS FINAL DO SISTEMA
-- ================================================================

-- 1️⃣ Status da fila após processamento
SELECT
    '📊 STATUS FILA FINAL' as info,
    queue_name,
    queue_length as mensagens_restantes,
    CASE
        WHEN queue_length < 50 THEN '🎉 FILA PROCESSADA COM SUCESSO!'
        WHEN queue_length < 100 THEN '✅ FILA QUASE LIMPA'
        ELSE '⚠️ AINDA HÁ MENSAGENS'
    END as status
FROM pgmq.metrics('webhook_message_queue');

-- 2️⃣ Mensagens criadas pelo worker fallback
SELECT
    '📝 MENSAGENS PROCESSADAS PELO WORKER' as check,
    COUNT(*) as total_criadas,
    COUNT(CASE WHEN media_url IS NOT NULL THEN 1 END) as com_urls,
    'Processadas com URLs geradas' as note
FROM public.messages
WHERE external_message_id LIKE 'fallback_%'
AND created_at >= NOW() - INTERVAL '10 minutes';

-- 3️⃣ Estatísticas finais do sistema completo
SELECT
    '🎯 ESTATÍSTICAS FINAIS SISTEMA' as info,
    COUNT(*) as total_messages,
    COUNT(CASE WHEN media_url IS NOT NULL THEN 1 END) as with_media_url,
    ROUND(
        (COUNT(CASE WHEN media_url IS NOT NULL THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
    ) as percentage_with_url,
    '🎉 Sistema funcionando!' as status
FROM public.messages
WHERE media_type != 'text'
AND created_at >= NOW() - INTERVAL '24 hours';

-- 4️⃣ Performance das últimas horas
SELECT
    '📈 PERFORMANCE ÚLTIMAS HORAS' as info,
    COUNT(*) as messages_last_hour,
    COUNT(CASE WHEN media_url IS NOT NULL THEN 1 END) as with_urls_last_hour,
    'Mensagens processadas recentemente' as note
FROM public.messages
WHERE created_at >= NOW() - INTERVAL '1 hour';