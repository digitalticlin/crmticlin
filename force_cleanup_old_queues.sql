-- ================================================================
-- LIMPEZA FORÇADA DAS FILAS ANTIGAS (PERDE MENSAGENS PENDENTES!)
-- ================================================================

-- ⚠️ ATENÇÃO: ESTE SCRIPT APAGA 5.727 MENSAGENS PENDENTES!
-- Use apenas se essas mensagens não são importantes.

-- Verificar novamente quantas mensagens serão perdidas
SELECT 
    '⚠️ MENSAGENS QUE SERÃO PERDIDAS' as aviso,
    queue_name,
    (pgmq.metrics(queue_name)).queue_length as mensagens_perdidas
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

-- DESCOMENTE AS LINHAS ABAIXO APENAS SE TIVER CERTEZA:

-- SELECT pgmq.drop_queue('media_processing_queue');
-- SELECT pgmq.drop_queue('message_sending_queue'); 
-- SELECT pgmq.drop_queue('ai_message_consult_queue');
-- SELECT pgmq.drop_queue('webhook_processing_queue');
-- SELECT pgmq.drop_queue('profile_pic_queue');
-- SELECT pgmq.drop_queue('profile_pic_download_queue');

SELECT '⚠️ COMANDOS COMENTADOS - DESCOMENTE APENAS SE TIVER CERTEZA' as aviso;