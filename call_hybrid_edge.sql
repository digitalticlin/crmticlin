-- ================================================================
-- 🚀 CHAMAR EDGE FUNCTION HÍBRIDA VIA POSTGRESQL
-- ================================================================

-- Simular chamada HTTP para Edge Function modo worker
DO $$
DECLARE
    v_result JSONB;
BEGIN
    -- Tentar chamar edge function híbrida
    BEGIN
        SELECT net.http_post(
            'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_storage_upload',
            jsonb_build_object(
                'mode', 'process_queue',
                'batch_size', 15
            ),
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdnZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTkzNzU4MzYsImV4cCI6MjAzNDk1MTgzNn0.sKNGcO4Tv8S-hHeBpBG8nSoIvJagCx5QO4qNOj2wYSg'
            )
        ) INTO v_result;

        RAISE NOTICE '🎯 Edge Function Result: Status %, Body: %',
            COALESCE(v_result->>'status_code', 'NULL'),
            LEFT(COALESCE(v_result->>'body', 'NULL'), 200);

    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Erro chamando Edge Function: %', SQLERRM;
    END;
END $$;

-- Verificar resultado após chamada
SELECT
    '📊 STATUS FILA APÓS EDGE' as info,
    queue_name,
    queue_length as mensagens_restantes,
    CASE
        WHEN queue_length < 300 THEN '✅ PROCESSOU ALGUMAS'
        WHEN queue_length = 307 THEN '⚠️ NADA PROCESSADO'
        ELSE '📊 STATUS ALTERADO'
    END as resultado
FROM pgmq.metrics('webhook_message_queue');

-- Verificar novas mensagens criadas
SELECT
    '📝 NOVAS MENSAGENS' as check,
    COUNT(*) as novas_mensagens
FROM public.messages
WHERE external_message_id LIKE 'queue_%'
AND created_at >= NOW() - INTERVAL '2 minutes';