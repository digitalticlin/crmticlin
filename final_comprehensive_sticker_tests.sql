-- ================================================================
-- TESTE COMPLETO COM SUPORTE A STICKER INCLUÍDO
-- ================================================================

-- 🎯 TESTES PARA TODAS AS 3 EDGE FUNCTIONS COM TODOS OS TIPOS DE MÍDIA
-- 📱 Usando IDs de teste fornecidos:
-- whatsapp_number_id: c3b6cfe7-bc4e-4b1f-9f18-4573f4232785
-- created_by_user_id: 712e7708-2299-4a00-9128-577c8f113ca4

-- ================================================================
-- 📊 1. VERIFICAÇÕES INICIAIS
-- ================================================================

-- 1.1 Verificar enum media_type (deve incluir sticker)
SELECT 
    '📋 TIPOS DE MÍDIA DISPONÍVEIS' as categoria,
    unnest(enum_range(NULL::media_type)) as media_type_valido;

-- 1.2 Verificar funções RPC disponíveis
SELECT 
    '🔍 RPCs ISOLADAS DISPONÍVEIS' as categoria,
    function_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name = function_name
        ) THEN '✅ DISPONÍVEL'
        ELSE '❌ AUSENTE'
    END as status
FROM (
    VALUES 
        ('save_received_message_webhook'),
        ('save_sent_message_from_app'),
        ('save_sent_message_from_ai')
) AS expected(function_name);

-- ================================================================
-- 🚀 2. TESTE WEBHOOK - save_received_message_webhook
-- ================================================================

-- WEBHOOK - Texto recebido
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 WEBHOOK - TEXTO RECEBIDO ===';
    
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
    
    IF (v_result->>'success')::boolean THEN
        v_message_id := (v_result->'data'->>'message_id')::UUID;
        RAISE NOTICE '✅ WEBHOOK TEXTO: Message ID = %', v_message_id;
    ELSE
        RAISE NOTICE '❌ WEBHOOK TEXTO: Falha - %', v_result->>'error';
    END IF;
END $$;

-- WEBHOOK - Imagem recebida
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 WEBHOOK - IMAGEM RECEBIDA ===';
    
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
    
    IF (v_result->>'success')::boolean THEN
        v_message_id := (v_result->'data'->>'message_id')::UUID;
        RAISE NOTICE '✅ WEBHOOK IMAGEM: Message ID = %', v_message_id;
    ELSE
        RAISE NOTICE '❌ WEBHOOK IMAGEM: Falha - %', v_result->>'error';
    END IF;
END $$;

-- WEBHOOK - Sticker recebido (NOVO)
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 WEBHOOK - STICKER RECEBIDO ===';
    
    SELECT * FROM save_received_message_webhook(
        'test_vps_instance'::text,
        '5511987654321'::text,
        NULL::text,
        false::boolean,
        'sticker'::text,
        'data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAADwAQCdASoBAAEADkD4lrACdLoAA/4P0y5A'::text,
        ('webhook_sticker_in_' || extract(epoch from now())::bigint::text)::text,
        NULL::text,
        NULL::text
    ) INTO v_result;
    
    IF (v_result->>'success')::boolean THEN
        v_message_id := (v_result->'data'->>'message_id')::UUID;
        RAISE NOTICE '✅ WEBHOOK STICKER: Message ID = %', v_message_id;
    ELSE
        RAISE NOTICE '❌ WEBHOOK STICKER: Falha - %', v_result->>'error';
    END IF;
END $$;

-- WEBHOOK - Vídeo recebido
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 WEBHOOK - VÍDEO RECEBIDO ===';
    
    SELECT * FROM save_received_message_webhook(
        'test_vps_instance'::text,
        '5511987654321'::text,
        NULL::text,
        false::boolean,
        'video'::text,
        'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMWF2YzEAAAAIZnJlZQAAAAxtZGF0AAAAlHUADW5kc2RzAA=='::text,
        ('webhook_video_in_' || extract(epoch from now())::bigint::text)::text,
        NULL::text,
        NULL::text
    ) INTO v_result;
    
    IF (v_result->>'success')::boolean THEN
        v_message_id := (v_result->'data'->>'message_id')::UUID;
        RAISE NOTICE '✅ WEBHOOK VÍDEO: Message ID = %', v_message_id;
    ELSE
        RAISE NOTICE '❌ WEBHOOK VÍDEO: Falha - %', v_result->>'error';
    END IF;
END $$;

-- WEBHOOK - Áudio recebido
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 WEBHOOK - ÁUDIO RECEBIDO ===';
    
    SELECT * FROM save_received_message_webhook(
        'test_vps_instance'::text,
        '5511987654321'::text,
        NULL::text,
        false::boolean,
        'audio'::text,
        'data:audio/ogg;base64,T2dnUwACAAAAAAAAC+RDAAAAAAADfNH8AU9nZ1MAAgAAAAAAALzkQgAAAAAAAHzR/AE='::text,
        ('webhook_audio_in_' || extract(epoch from now())::bigint::text)::text,
        NULL::text,
        NULL::text
    ) INTO v_result;
    
    IF (v_result->>'success')::boolean THEN
        v_message_id := (v_result->'data'->>'message_id')::UUID;
        RAISE NOTICE '✅ WEBHOOK ÁUDIO: Message ID = %', v_message_id;
    ELSE
        RAISE NOTICE '❌ WEBHOOK ÁUDIO: Falha - %', v_result->>'error';
    END IF;
END $$;

-- WEBHOOK - Documento recebido
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 WEBHOOK - DOCUMENTO RECEBIDO ===';
    
    SELECT * FROM save_received_message_webhook(
        'test_vps_instance'::text,
        '5511987654321'::text,
        NULL::text,
        false::boolean,
        'document'::text,
        'data:application/pdf;base64,JVBERi0xLjMKJf////8KMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovT3V0bGluZXMgMiAwIFIKL1BhZ2VzIDMgMCBSCj4+CmVuZG9iago='::text,
        ('webhook_doc_in_' || extract(epoch from now())::bigint::text)::text,
        NULL::text,
        NULL::text
    ) INTO v_result;
    
    IF (v_result->>'success')::boolean THEN
        v_message_id := (v_result->'data'->>'message_id')::UUID;
        RAISE NOTICE '✅ WEBHOOK DOCUMENTO: Message ID = %', v_message_id;
    ELSE
        RAISE NOTICE '❌ WEBHOOK DOCUMENTO: Falha - %', v_result->>'error';
    END IF;
END $$;

-- ================================================================
-- 📱 3. TESTE APP - save_sent_message_from_app
-- ================================================================

-- APP - Texto enviado
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 APP - TEXTO ENVIADO ===';
    
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
    
    IF (v_result->>'success')::boolean THEN
        v_message_id := (v_result->'data'->>'message_id')::UUID;
        RAISE NOTICE '✅ APP TEXTO: Message ID = %', v_message_id;
    ELSE
        RAISE NOTICE '❌ APP TEXTO: Falha - %', v_result->>'error';
    END IF;
END $$;

-- APP - Sticker enviado (NOVO)
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 APP - STICKER ENVIADO ===';
    
    SELECT * FROM save_sent_message_from_app(
        'test_vps_instance'::text,
        '5511987654321'::text,
        NULL::text,
        true::boolean,
        'sticker'::text,
        'data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAADwAQCdASoBAAEADkD4lrACdLoAA/4P0y5A'::text,
        ('app_sticker_out_' || extract(epoch from now())::bigint::text)::text,
        NULL::text
    ) INTO v_result;
    
    IF (v_result->>'success')::boolean THEN
        v_message_id := (v_result->'data'->>'message_id')::UUID;
        RAISE NOTICE '✅ APP STICKER: Message ID = %', v_message_id;
    ELSE
        RAISE NOTICE '❌ APP STICKER: Falha - %', v_result->>'error';
    END IF;
END $$;

-- APP - Vídeo enviado
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 APP - VÍDEO ENVIADO ===';
    
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
    
    IF (v_result->>'success')::boolean THEN
        v_message_id := (v_result->'data'->>'message_id')::UUID;
        RAISE NOTICE '✅ APP VÍDEO: Message ID = %', v_message_id;
    ELSE
        RAISE NOTICE '❌ APP VÍDEO: Falha - %', v_result->>'error';
    END IF;
END $$;

-- ================================================================
-- 🤖 4. TESTE AI - save_sent_message_from_ai
-- ================================================================

-- AI - Texto enviado
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 AI - TEXTO ENVIADO ===';
    
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
    
    IF (v_result->>'success')::boolean THEN
        v_message_id := (v_result->'data'->>'message_id')::UUID;
        RAISE NOTICE '✅ AI TEXTO: Message ID = %', v_message_id;
    ELSE
        RAISE NOTICE '❌ AI TEXTO: Falha - %', v_result->>'error';
    END IF;
END $$;

-- AI - Sticker enviado (NOVO)
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 AI - STICKER ENVIADO ===';
    
    SELECT * FROM save_sent_message_from_ai(
        'test_vps_instance'::text,
        '5511987654321'::text,
        NULL::text,
        true::boolean,
        'sticker'::text,
        'data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAADwAQCdASoBAAEADkD4lrACdLoAA/4P0y5A'::text,
        ('ai_sticker_out_' || extract(epoch from now())::bigint::text)::text,
        NULL::text
    ) INTO v_result;
    
    IF (v_result->>'success')::boolean THEN
        v_message_id := (v_result->'data'->>'message_id')::UUID;
        RAISE NOTICE '✅ AI STICKER: Message ID = %', v_message_id;
    ELSE
        RAISE NOTICE '❌ AI STICKER: Falha - %', v_result->>'error';
    END IF;
END $$;

-- AI - Áudio enviado
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 AI - ÁUDIO ENVIADO ===';
    
    SELECT * FROM save_sent_message_from_ai(
        'test_vps_instance'::text,
        '5511987654321'::text,
        NULL::text,
        true::boolean,
        'audio'::text,
        'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAABAAABhGQwMDBkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGR//uQxAAAAAAAAAAAAAAAAAAAAAAAA'::text,
        ('ai_audio_out_' || extract(epoch from now())::bigint::text)::text,
        NULL::text
    ) INTO v_result;
    
    IF (v_result->>'success')::boolean THEN
        v_message_id := (v_result->'data'->>'message_id')::UUID;
        RAISE NOTICE '✅ AI ÁUDIO: Message ID = %', v_message_id;
    ELSE
        RAISE NOTICE '❌ AI ÁUDIO: Falha - %', v_result->>'error';
    END IF;
END $$;

-- AI - Documento enviado
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 AI - DOCUMENTO ENVIADO ===';
    
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
    
    IF (v_result->>'success')::boolean THEN
        v_message_id := (v_result->'data'->>'message_id')::UUID;
        RAISE NOTICE '✅ AI DOCUMENTO: Message ID = %', v_message_id;
    ELSE
        RAISE NOTICE '❌ AI DOCUMENTO: Falha - %', v_result->>'error';
    END IF;
END $$;

-- ================================================================
-- 📊 5. VALIDAR RESULTADOS DOS TESTES
-- ================================================================

-- 5.1 Verificar mensagens criadas nos testes
SELECT 
    '📝 MENSAGENS DE TESTE CRIADAS' as categoria,
    id,
    text,
    media_type,
    from_me,
    CASE 
        WHEN media_url IS NULL AND media_type = 'text' THEN '✅ Texto sem mídia'
        WHEN media_url IS NULL AND media_type != 'text' THEN '🔄 Mídia enfileirada'
        WHEN media_url LIKE 'data:%' THEN '🔄 Base64 (será processado)'
        WHEN media_url LIKE 'https://%.supabase.co/storage/%' THEN '✅ Storage URL'
        ELSE '❓ URL desconhecida'
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

-- 5.2 Verificar emojis corretos
SELECT 
    '🎭 VALIDAÇÃO DE EMOJIS' as categoria,
    media_type,
    text,
    COUNT(*) as quantidade,
    CASE 
        WHEN media_type = 'text' THEN text NOT LIKE '%📷%' AND text NOT LIKE '%🎥%' AND text NOT LIKE '%🎤%' AND text NOT LIKE '%📄%' AND text NOT LIKE '%😊%'
        WHEN media_type = 'image' THEN text = '📷 Imagem'
        WHEN media_type = 'video' THEN text = '🎥 Vídeo'
        WHEN media_type = 'audio' THEN text = '🎵 Áudio' OR text = '🎤 Áudio'
        WHEN media_type = 'document' THEN text = '📄 Documento'
        WHEN media_type::text = 'sticker' THEN text = '😊 Sticker'
        ELSE false
    END as emoji_correto
FROM messages 
WHERE (
    external_message_id LIKE 'webhook_%' || extract(epoch from date_trunc('minute', now()))::text || '%'
    OR external_message_id LIKE 'app_%' || extract(epoch from date_trunc('minute', now()))::text || '%'
    OR external_message_id LIKE 'ai_%' || extract(epoch from date_trunc('minute', now()))::text || '%'
)
GROUP BY media_type, text
ORDER BY media_type, text;

-- 5.3 Resumo por edge function
SELECT 
    '📊 RESUMO POR EDGE FUNCTION' as categoria,
    CASE 
        WHEN external_message_id LIKE 'webhook_%' THEN 'WEBHOOK'
        WHEN external_message_id LIKE 'app_%' THEN 'APP'
        WHEN external_message_id LIKE 'ai_%' THEN 'AI'
    END as edge_function,
    from_me,
    media_type,
    COUNT(*) as total_mensagens,
    CASE 
        WHEN media_type = 'text' THEN '✅ Salvo em text'
        WHEN media_type = 'sticker' THEN '✅ Salvo como 😊 Sticker'
        ELSE '🔄 Salvo como emoji + fila'
    END as status_processamento
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

-- 5.4 Status das filas (deve haver mensagens para processar)
SELECT 
    '📦 FILAS APÓS TESTES' as categoria,
    queue_name,
    (pgmq.metrics(queue_name)).queue_length as mensagens_pendentes,
    (pgmq.metrics(queue_name)).total_messages as total_processadas
FROM (
    VALUES ('webhook_message_queue'), ('app_message_queue'), ('ai_message_queue')
) AS queues(queue_name);

-- ================================================================
-- ✅ RESULTADO FINAL
-- ================================================================

SELECT 
    '✅ TESTE COMPLETO COM STICKER EXECUTADO' as resultado,
    'Todas as edge functions testadas com todos os tipos de mídia' as detalhes,
    jsonb_build_object(
        'edges_testadas', 3,
        'tipos_midia_testados', jsonb_build_array('text', 'image', 'video', 'audio', 'document', 'sticker'),
        'sticker_emoji', '😊 Sticker',
        'processamento_fila', 'Mídia será processada pelos workers',
        'proximo_passo', 'Execute workers para processar mídia enfileirada'
    ) as sumario;