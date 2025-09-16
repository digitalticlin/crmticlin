-- ================================================================
-- TESTE FINAL CORRIGIDO COM TYPE CASTING EXPLÍCITO
-- ================================================================

-- 🔧 CORREÇÃO: Usar type casting explícito para todos parâmetros
-- 🔧 CORREÇÃO: Usar apenas enum válidos (sem "voice")

-- ================================================================
-- 🚀 TESTE EDGE WEBHOOK - save_received_message_webhook
-- ================================================================

-- WEBHOOK - Texto recebido (from_me = false)
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 WEBHOOK TEXTO RECEBIDO ===';
    
    SELECT * FROM save_received_message_webhook(
        'test_vps_instance'::text,
        '5511987654321'::text,
        'Mensagem texto recebida webhook'::text,
        false::boolean,
        'text'::text,
        NULL::text,
        ('webhook_texto_in_' || extract(epoch from now())::bigint::text)::text,
        NULL::text,
        NULL::text
    ) INTO v_result;
    
    v_message_id := (v_result->'data'->>'message_id')::UUID;
    RAISE NOTICE '✅ WEBHOOK TEXTO: % - Message ID: %', (v_result->>'success')::boolean, v_message_id;
END $$;

-- WEBHOOK - Imagem recebida 
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 WEBHOOK IMAGEM RECEBIDA ===';
    
    SELECT * FROM save_received_message_webhook(
        'test_vps_instance'::text,
        '5511987654321'::text,
        NULL::text,
        false::boolean,
        'image'::text,
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='::text,
        ('webhook_img_in_' || extract(epoch from now())::bigint::text)::text,
        NULL::text,
        NULL::text
    ) INTO v_result;
    
    v_message_id := (v_result->'data'->>'message_id')::UUID;
    RAISE NOTICE '✅ WEBHOOK IMAGEM: % - Message ID: %', (v_result->>'success')::boolean, v_message_id;
END $$;

-- ================================================================
-- 📱 TESTE EDGE APP - save_sent_message_from_app  
-- ================================================================

-- APP - Texto enviado (from_me = true)
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 APP TEXTO ENVIADO ===';
    
    SELECT * FROM save_sent_message_from_app(
        'test_vps_instance'::text,
        '5511987654321'::text,
        'Mensagem texto enviada pelo app'::text,
        true::boolean,
        'text'::text,
        NULL::text,
        ('app_texto_out_' || extract(epoch from now())::bigint::text)::text,
        NULL::text
    ) INTO v_result;
    
    v_message_id := (v_result->'data'->>'message_id')::UUID;
    RAISE NOTICE '✅ APP TEXTO: % - Message ID: %', (v_result->>'success')::boolean, v_message_id;
END $$;

-- APP - Vídeo enviado
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 APP VÍDEO ENVIADO ===';
    
    SELECT * FROM save_sent_message_from_app(
        'test_vps_instance'::text,
        '5511987654321'::text,
        NULL::text,
        true::boolean,
        'video'::text,
        'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMWF2YzEAAAAIZnJlZQAAAAxtZGF0AAAAlHUADW5kc2RzAA=='::text,
        ('app_video_out_' || extract(epoch from now())::bigint::text)::text,
        NULL::text
    ) INTO v_result;
    
    v_message_id := (v_result->'data'->>'message_id')::UUID;
    RAISE NOTICE '✅ APP VÍDEO: % - Message ID: %', (v_result->>'success')::boolean, v_message_id;
END $$;

-- ================================================================
-- 🤖 TESTE EDGE AI - save_sent_message_from_ai
-- ================================================================

-- AI - Texto enviado (from_me = true)
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 AI TEXTO ENVIADO ===';
    
    SELECT * FROM save_sent_message_from_ai(
        'test_vps_instance'::text,
        '5511987654321'::text,
        'Mensagem texto enviada pela IA'::text,
        true::boolean,
        'text'::text,
        NULL::text,
        ('ai_texto_out_' || extract(epoch from now())::bigint::text)::text,
        NULL::text
    ) INTO v_result;
    
    v_message_id := (v_result->'data'->>'message_id')::UUID;
    RAISE NOTICE '✅ AI TEXTO: % - Message ID: %', (v_result->>'success')::boolean, v_message_id;
END $$;

-- AI - Áudio enviado (usando "audio" ao invés de "voice")
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 AI ÁUDIO ENVIADO ===';
    
    SELECT * FROM save_sent_message_from_ai(
        'test_vps_instance'::text,
        '5511987654321'::text,
        NULL::text,
        true::boolean,
        'audio'::text,  -- CORRIGIDO: usar "audio" ao invés de "voice"
        'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAABAAABhGQwMDBkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGR//uQxAAAAAAAAAAAAAAAAAAAAAAAA'::text,
        ('ai_audio_out_' || extract(epoch from now())::bigint::text)::text,
        NULL::text
    ) INTO v_result;
    
    v_message_id := (v_result->'data'->>'message_id')::UUID;
    RAISE NOTICE '✅ AI ÁUDIO: % - Message ID: %', (v_result->>'success')::boolean, v_message_id;
END $$;

-- AI - Documento enviado
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 AI DOCUMENTO ENVIADO ===';
    
    SELECT * FROM save_sent_message_from_ai(
        'test_vps_instance'::text,
        '5511987654321'::text,
        NULL::text,
        true::boolean,
        'document'::text,
        'data:application/pdf;base64,JVBERi0xLjMKJf////8KMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovT3V0bGluZXMgMiAwIFIKL1BhZ2VzIDMgMCBSCj4+CmVuZG9iago='::text,
        ('ai_doc_out_' || extract(epoch from now())::bigint::text)::text,
        NULL::text
    ) INTO v_result;
    
    v_message_id := (v_result->'data'->>'message_id')::UUID;
    RAISE NOTICE '✅ AI DOCUMENTO: % - Message ID: %', (v_result->>'success')::boolean, v_message_id;
END $$;

-- ================================================================
-- 📊 VALIDAR RESULTADOS
-- ================================================================

-- Verificar mensagens criadas
SELECT 
    '📝 MENSAGENS DE TESTE CRIADAS' as categoria,
    id,
    text,
    media_type,
    from_me,
    CASE 
        WHEN media_url IS NULL AND media_type = 'text' THEN '✅ OK - Texto sem mídia'
        WHEN media_url IS NULL AND media_type != 'text' THEN '⚠️ Mídia será processada'
        WHEN media_url LIKE 'data:%' THEN '🔄 Base64 (enfileirada)'
        WHEN media_url LIKE 'https://%.storage%' THEN '✅ Storage URL'
        ELSE '❓ Outro: ' || COALESCE(left(media_url, 30), 'NULL')
    END as status_media,
    external_message_id,
    CASE 
        WHEN external_message_id LIKE 'webhook_%' THEN '📞 WEBHOOK (IN)'
        WHEN external_message_id LIKE 'app_%' THEN '📱 APP (OUT)'
        WHEN external_message_id LIKE 'ai_%' THEN '🤖 AI (OUT)'
        ELSE 'OUTRO'
    END as origem_teste,
    created_at
FROM messages 
WHERE (
    external_message_id LIKE 'webhook_%' || extract(epoch from date_trunc('minute', now()))::text || '%'
    OR external_message_id LIKE 'app_%' || extract(epoch from date_trunc('minute', now()))::text || '%'
    OR external_message_id LIKE 'ai_%' || extract(epoch from date_trunc('minute', now()))::text || '%'
)
ORDER BY created_at DESC;

-- Resumo por edge
SELECT 
    '📊 RESUMO POR EDGE' as categoria,
    CASE 
        WHEN external_message_id LIKE 'webhook_%' THEN 'WEBHOOK'
        WHEN external_message_id LIKE 'app_%' THEN 'APP'
        WHEN external_message_id LIKE 'ai_%' THEN 'AI'
    END as edge_function,
    from_me,
    media_type,
    COUNT(*) as total_mensagens,
    array_agg(text ORDER BY created_at) as textos_salvos
FROM messages 
WHERE (
    external_message_id LIKE 'webhook_%' || extract(epoch from date_trunc('minute', now()))::text || '%'
    OR external_message_id LIKE 'app_%' || extract(epoch from date_trunc('minute', now()))::text || '%'
    OR external_message_id LIKE 'ai_%' || extract(epoch from date_trunc('minute', now()))::text || '%'
)
GROUP BY 
    CASE 
        WHEN external_message_id LIKE 'webhook_%' THEN 'WEBHOOK'
        WHEN external_message_id LIKE 'app_%' THEN 'APP'
        WHEN external_message_id LIKE 'ai_%' THEN 'AI'
    END,
    from_me,
    media_type
ORDER BY edge_function, from_me, media_type;

-- Status das filas (deve haver mensagens para processar)
SELECT 
    '📦 FILAS APÓS TESTES' as categoria,
    queue_name,
    (pgmq.metrics(queue_name)).queue_length as mensagens_pendentes
FROM (
    VALUES ('webhook_message_queue'), ('app_message_queue'), ('ai_message_queue')
) AS queues(queue_name);

-- Resultado final
SELECT 
    '✅ TESTE COMPLETO EXECUTADO' as resultado,
    'Verificar mensagens criadas e filas populadas' as proxima_acao;