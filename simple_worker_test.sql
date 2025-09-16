-- TESTE SIMPLES: APENAS EXECUTAR O WORKER
SELECT webhook_media_worker() as resultado_worker;

-- Ver quantas mensagens tem na fila agora  
SELECT 
    'Fila após teste' as status,
    (pgmq.metrics('webhook_message_queue')).queue_length as mensagens;
