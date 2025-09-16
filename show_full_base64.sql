-- Ver base64 COMPLETO de uma mensagem da fila
SELECT
    '📋 BASE64 COMPLETO' as info,
    msg_id,
    message->>'message_id' as message_id,
    message->>'media_type' as media_type,
    LENGTH(message->>'base64_data') as base64_total_length,
    message->>'base64_data' as base64_completo  -- SEM LIMIT
FROM pgmq.read('webhook_message_queue', 1, 1)
WHERE message->>'base64_data' IS NOT NULL
LIMIT 1;