-- ================================================================
-- EXECUTAR FUNÇÃO process_all_media_queues() PARA PROCESSAR TUDO
-- ================================================================

-- Esta função foi criada no setup_worker_automation.sql
-- Ela processa todas as filas usando os workers existentes

SELECT 
    '🎯 EXECUTANDO process_all_media_queues()' as status,
    process_all_media_queues() as resultado;

-- ================================================================
-- VERIFICAR RESULTADOS
-- ================================================================

-- Mensagens com URL após processamento
SELECT 
    '✅ MENSAGENS COM STORAGE URL APÓS PROCESSAMENTO' as categoria,
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
ORDER BY created_at DESC;

-- Resumo final
SELECT 
    '📊 RESUMO APÓS process_all_media_queues()' as categoria,
    COUNT(CASE WHEN media_type != 'text' THEN 1 END) as total_midia,
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