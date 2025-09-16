-- ================================================================
-- TESTE COMPLETO DAS 3 EDGES COM TODOS OS TIPOS DE MENSAGENS
-- ================================================================

-- 🧪 TESTAR from_me TRUE/FALSE + TEXTO + TODOS FORMATOS DE MÍDIA
-- Dados do teste: whatsapp_number_id = c3b6cfe7-bc4e-4b1f-9f18-4573f4232785
--                 created_by_user_id = 712e7708-2299-4a00-9128-577c8f113ca4

-- ================================================================
-- 📱 1. VALIDAR DADOS DE TESTE EXISTEM
-- ================================================================

-- 1.1 Verificar se instância existe
SELECT 
    '🔍 VALIDAÇÃO INSTÂNCIA' as categoria,
    id,
    vps_instance_id,
    instance_name,
    connection_status,
    created_by_user_id
FROM whatsapp_instances 
WHERE id = 'c3b6cfe7-bc4e-4b1f-9f18-4573f4232785'::UUID;

-- 1.2 Verificar se usuário existe  
SELECT 
    '👤 VALIDAÇÃO USUÁRIO' as categoria,
    id,
    email,
    created_at
FROM auth.users 
WHERE id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID;

-- ================================================================
-- 🚀 2. TESTE EDGE WEBHOOK (save_received_message_webhook)
-- ================================================================

-- 2.1 WEBHOOK - Texto recebido (from_me = false)
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 TESTE WEBHOOK - TEXTO RECEBIDO ===';
    
    SELECT * FROM save_received_message_webhook(
        'test_vps_instance',          -- vps_instance_id
        '5511987654321',              -- phone
        'Mensagem texto recebida webhook', -- message_text
        false,                        -- from_me (RECEBIDA)
        'text',                       -- media_type
        NULL,                         -- media_url
        'webhook_texto_in_' || extract(epoch from now())::text, -- external_message_id
        NULL,                         -- contact_name
        NULL                          -- profile_pic_url
    ) INTO v_result;
    
    IF (v_result->>'success')::boolean THEN
        v_message_id := (v_result->'data'->>'message_id')::UUID;
        RAISE NOTICE '✅ WEBHOOK TEXTO IN: Message ID = %', v_message_id;
    ELSE
        RAISE NOTICE '❌ WEBHOOK TEXTO IN: Falha - %', v_result->>'error';
    END IF;
END $$;

-- 2.2 WEBHOOK - Imagem recebida (from_me = false)
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 TESTE WEBHOOK - IMAGEM RECEBIDA ===';
    
    SELECT * FROM save_received_message_webhook(
        'test_vps_instance',          -- vps_instance_id
        '5511987654321',              -- phone
        NULL,                         -- message_text (NULL para mídia)
        false,                        -- from_me (RECEBIDA)
        'image',                      -- media_type
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=', -- media_url (base64 mínimo de JPEG)
        'webhook_img_in_' || extract(epoch from now())::text, -- external_message_id
        NULL,                         -- contact_name
        NULL                          -- profile_pic_url
    ) INTO v_result;
    
    IF (v_result->>'success')::boolean THEN
        v_message_id := (v_result->'data'->>'message_id')::UUID;
        RAISE NOTICE '✅ WEBHOOK IMAGEM IN: Message ID = %', v_message_id;
    ELSE
        RAISE NOTICE '❌ WEBHOOK IMAGEM IN: Falha - %', v_result->>'error';
    END IF;
END $$;

-- 2.3 WEBHOOK - Vídeo recebido (from_me = false)
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 TESTE WEBHOOK - VÍDEO RECEBIDO ===';
    
    SELECT * FROM save_received_message_webhook(
        'test_vps_instance',          -- vps_instance_id
        '5511987654321',              -- phone
        NULL,                         -- message_text (NULL para mídia)
        false,                        -- from_me (RECEBIDA)
        'video',                      -- media_type
        'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMWF2YzEAAAAIZnJlZQAAAAxtZGF0AAAAlHUADW5kc2RzAA==', -- media_url (base64 mínimo de MP4)
        'webhook_video_in_' || extract(epoch from now())::text, -- external_message_id
        NULL,                         -- contact_name
        NULL                          -- profile_pic_url
    ) INTO v_result;
    
    IF (v_result->>'success')::boolean THEN
        v_message_id := (v_result->'data'->>'message_id')::UUID;
        RAISE NOTICE '✅ WEBHOOK VÍDEO IN: Message ID = %', v_message_id;
    ELSE
        RAISE NOTICE '❌ WEBHOOK VÍDEO IN: Falha - %', v_result->>'error';
    END IF;
END $$;

-- 2.4 WEBHOOK - Áudio recebido (from_me = false)
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 TESTE WEBHOOK - ÁUDIO RECEBIDO ===';
    
    SELECT * FROM save_received_message_webhook(
        'test_vps_instance',          -- vps_instance_id
        '5511987654321',              -- phone
        NULL,                         -- message_text (NULL para mídia)
        false,                        -- from_me (RECEBIDA)
        'audio',                      -- media_type
        'data:audio/ogg;base64,T2dnUwACAAAAAAAAC+RDAAAAAAADfNH8AU9nZ1MAAgAAAAAAALzkQgAAAAAAAHzR/AE=', -- media_url (base64 mínimo de OGG)
        'webhook_audio_in_' || extract(epoch from now())::text, -- external_message_id
        NULL,                         -- contact_name
        NULL                          -- profile_pic_url
    ) INTO v_result;
    
    IF (v_result->>'success')::boolean THEN
        v_message_id := (v_result->'data'->>'message_id')::UUID;
        RAISE NOTICE '✅ WEBHOOK ÁUDIO IN: Message ID = %', v_message_id;
    ELSE
        RAISE NOTICE '❌ WEBHOOK ÁUDIO IN: Falha - %', v_result->>'error';
    END IF;
END $$;

-- 2.5 WEBHOOK - Documento recebido (from_me = false)
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 TESTE WEBHOOK - DOCUMENTO RECEBIDO ===';
    
    SELECT * FROM save_received_message_webhook(
        'test_vps_instance',          -- vps_instance_id
        '5511987654321',              -- phone
        NULL,                         -- message_text (NULL para mídia)
        false,                        -- from_me (RECEBIDA)
        'document',                   -- media_type
        'data:application/pdf;base64,JVBERi0xLjMKJf////8KMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovT3V0bGluZXMgMiAwIFIKL1BhZ2VzIDMgMCBSCj4+CmVuZG9iago=', -- media_url (base64 mínimo de PDF)
        'webhook_doc_in_' || extract(epoch from now())::text, -- external_message_id
        NULL,                         -- contact_name
        NULL                          -- profile_pic_url
    ) INTO v_result;
    
    IF (v_result->>'success')::boolean THEN
        v_message_id := (v_result->'data'->>'message_id')::UUID;
        RAISE NOTICE '✅ WEBHOOK DOCUMENTO IN: Message ID = %', v_message_id;
    ELSE
        RAISE NOTICE '❌ WEBHOOK DOCUMENTO IN: Falha - %', v_result->>'error';
    END IF;
END $$;

-- ================================================================
-- 📱 3. TESTE EDGE APP (save_sent_message_from_app)
-- ================================================================

-- 3.1 APP - Texto enviado (from_me = true)
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 TESTE APP - TEXTO ENVIADO ===';
    
    SELECT * FROM save_sent_message_from_app(
        'test_vps_instance',          -- vps_instance_id
        '5511987654321',              -- phone
        'Mensagem texto enviada pelo app', -- message_text
        true,                         -- from_me (ENVIADA)
        'text',                       -- media_type
        NULL,                         -- media_url
        'app_texto_out_' || extract(epoch from now())::text, -- external_message_id
        NULL                          -- contact_name
    ) INTO v_result;
    
    IF (v_result->>'success')::boolean THEN
        v_message_id := (v_result->'data'->>'message_id')::UUID;
        RAISE NOTICE '✅ APP TEXTO OUT: Message ID = %', v_message_id;
    ELSE
        RAISE NOTICE '❌ APP TEXTO OUT: Falha - %', v_result->>'error';
    END IF;
END $$;

-- 3.2 APP - Imagem enviada (from_me = true)
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 TESTE APP - IMAGEM ENVIADA ===';
    
    SELECT * FROM save_sent_message_from_app(
        'test_vps_instance',          -- vps_instance_id
        '5511987654321',              -- phone
        NULL,                         -- message_text (NULL para mídia)
        true,                         -- from_me (ENVIADA)
        'image',                      -- media_type
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', -- media_url (base64 mínimo de PNG)
        'app_img_out_' || extract(epoch from now())::text, -- external_message_id
        NULL                          -- contact_name
    ) INTO v_result;
    
    IF (v_result->>'success')::boolean THEN
        v_message_id := (v_result->'data'->>'message_id')::UUID;
        RAISE NOTICE '✅ APP IMAGEM OUT: Message ID = %', v_message_id;
    ELSE
        RAISE NOTICE '❌ APP IMAGEM OUT: Falha - %', v_result->>'error';
    END IF;
END $$;

-- 3.3 APP - Vídeo enviado (from_me = true)
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 TESTE APP - VÍDEO ENVIADO ===';
    
    SELECT * FROM save_sent_message_from_app(
        'test_vps_instance',          -- vps_instance_id
        '5511987654321',              -- phone
        NULL,                         -- message_text (NULL para mídia)
        true,                         -- from_me (ENVIADA)
        'video',                      -- media_type
        'data:video/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOANwEAAMA=', -- media_url (base64 mínimo de WEBM)
        'app_video_out_' || extract(epoch from now())::text, -- external_message_id
        NULL                          -- contact_name
    ) INTO v_result;
    
    IF (v_result->>'success')::boolean THEN
        v_message_id := (v_result->'data'->>'message_id')::UUID;
        RAISE NOTICE '✅ APP VÍDEO OUT: Message ID = %', v_message_id;
    ELSE
        RAISE NOTICE '❌ APP VÍDEO OUT: Falha - %', v_result->>'error';
    END IF;
END $$;

-- ================================================================
-- 🤖 4. TESTE EDGE AI (save_sent_message_from_ai)
-- ================================================================

-- 4.1 AI - Texto enviado (from_me = true)
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 TESTE AI - TEXTO ENVIADO ===';
    
    SELECT * FROM save_sent_message_from_ai(
        'test_vps_instance',          -- vps_instance_id
        '5511987654321',              -- phone
        'Mensagem texto enviada pela IA', -- message_text
        true,                         -- from_me (ENVIADA)
        'text',                       -- media_type
        NULL,                         -- media_url
        'ai_texto_out_' || extract(epoch from now())::text, -- external_message_id
        NULL                          -- contact_name
    ) INTO v_result;
    
    IF (v_result->>'success')::boolean THEN
        v_message_id := (v_result->'data'->>'message_id')::UUID;
        RAISE NOTICE '✅ AI TEXTO OUT: Message ID = %', v_message_id;
    ELSE
        RAISE NOTICE '❌ AI TEXTO OUT: Falha - %', v_result->>'error';
    END IF;
END $$;

-- 4.2 AI - Áudio enviado (from_me = true) - PTT/Voice
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 TESTE AI - ÁUDIO PTT ENVIADO ===';
    
    SELECT * FROM save_sent_message_from_ai(
        'test_vps_instance',          -- vps_instance_id
        '5511987654321',              -- phone
        NULL,                         -- message_text (NULL para áudio PTT)
        true,                         -- from_me (ENVIADA)
        'voice',                      -- media_type (PTT)
        'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAABAAABhGQwMDBkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGR//uQxAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', -- media_url (base64 mínimo de MP3)
        'ai_voice_out_' || extract(epoch from now())::text, -- external_message_id
        NULL                          -- contact_name
    ) INTO v_result;
    
    IF (v_result->>'success')::boolean THEN
        v_message_id := (v_result->'data'->>'message_id')::UUID;
        RAISE NOTICE '✅ AI VOICE OUT: Message ID = %', v_message_id;
    ELSE
        RAISE NOTICE '❌ AI VOICE OUT: Falha - %', v_result->>'error';
    END IF;
END $$;

-- 4.3 AI - Sticker enviado (from_me = true)
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 TESTE AI - STICKER ENVIADO ===';
    
    SELECT * FROM save_sent_message_from_ai(
        'test_vps_instance',          -- vps_instance_id
        '5511987654321',              -- phone
        NULL,                         -- message_text (NULL para sticker)
        true,                         -- from_me (ENVIADA)
        'sticker',                    -- media_type
        'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEAD8D+JaQAA3AAAAAA', -- media_url (base64 mínimo de WEBP)
        'ai_sticker_out_' || extract(epoch from now())::text, -- external_message_id
        NULL                          -- contact_name
    ) INTO v_result;
    
    IF (v_result->>'success')::boolean THEN
        v_message_id := (v_result->'data'->>'message_id')::UUID;
        RAISE NOTICE '✅ AI STICKER OUT: Message ID = %', v_message_id;
    ELSE
        RAISE NOTICE '❌ AI STICKER OUT: Falha - %', v_result->>'error';
    END IF;
END $$;

-- ================================================================
-- 📊 5. VALIDAR RESULTADOS DOS TESTES
-- ================================================================

-- 5.1 Verificar todas as mensagens de teste criadas
SELECT 
    '📝 MENSAGENS DE TESTE CRIADAS' as categoria,
    id,
    text,
    media_type,
    from_me,
    media_url,
    CASE 
        WHEN media_url IS NULL AND media_type = 'text' THEN '✅ Texto sem mídia'
        WHEN media_url IS NULL AND media_type != 'text' THEN '⚠️ Mídia aguardando processamento'
        WHEN media_url LIKE 'data:%' THEN '🔄 Base64 (será processado)'
        WHEN media_url LIKE 'https://%.supabase.co/storage/%' THEN '✅ Storage URL'
        ELSE '❓ URL desconhecida'
    END as status_media,
    external_message_id,
    CASE 
        WHEN external_message_id LIKE 'webhook_%' THEN 'WEBHOOK (from_me=false)'
        WHEN external_message_id LIKE 'app_%' THEN 'APP (from_me=true)'
        WHEN external_message_id LIKE 'ai_%' THEN 'AI (from_me=true)'
        ELSE 'ORIGEM DESCONHECIDA'
    END as origem_teste,
    created_at
FROM messages 
WHERE external_message_id LIKE 'webhook_%_' || extract(epoch from date_trunc('hour', now()))::text || '%'
   OR external_message_id LIKE 'app_%_' || extract(epoch from date_trunc('hour', now()))::text || '%'
   OR external_message_id LIKE 'ai_%_' || extract(epoch from date_trunc('hour', now()))::text || '%'
ORDER BY created_at DESC;

-- 5.2 Contagem por edge e tipo
SELECT 
    '📊 RESUMO DOS TESTES' as categoria,
    CASE 
        WHEN external_message_id LIKE 'webhook_%' THEN 'WEBHOOK'
        WHEN external_message_id LIKE 'app_%' THEN 'APP'
        WHEN external_message_id LIKE 'ai_%' THEN 'AI'
    END as edge_function,
    from_me,
    media_type,
    COUNT(*) as total_mensagens,
    COUNT(*) FILTER (WHERE text IS NOT NULL AND text != '') as com_texto,
    COUNT(*) FILTER (WHERE media_url IS NOT NULL) as com_media_url
FROM messages 
WHERE (external_message_id LIKE 'webhook_%_' || extract(epoch from date_trunc('hour', now()))::text || '%'
    OR external_message_id LIKE 'app_%_' || extract(epoch from date_trunc('hour', now()))::text || '%'  
    OR external_message_id LIKE 'ai_%_' || extract(epoch from date_trunc('hour', now()))::text || '%')
GROUP BY 
    CASE 
        WHEN external_message_id LIKE 'webhook_%' THEN 'WEBHOOK'
        WHEN external_message_id LIKE 'app_%' THEN 'APP'
        WHEN external_message_id LIKE 'ai_%' THEN 'AI'
    END,
    from_me,
    media_type
ORDER BY edge_function, from_me, media_type;

-- 5.3 Verificar emojis corretos para mídia
SELECT 
    '🎭 VALIDAÇÃO DE EMOJIS' as categoria,
    media_type,
    text,
    COUNT(*) as quantidade,
    CASE media_type
        WHEN 'text' THEN text != '' AND text NOT LIKE '%📷%' AND text NOT LIKE '%🎥%' AND text NOT LIKE '%🎤%' AND text NOT LIKE '%📄%' AND text NOT LIKE '%😊%'
        WHEN 'image' THEN text = '📷 Imagem'
        WHEN 'video' THEN text = '🎥 Vídeo'  
        WHEN 'audio' THEN text = '🎵 Áudio'
        WHEN 'voice' THEN text = '🎤 Áudio'
        WHEN 'document' THEN text = '📄 Documento'
        WHEN 'sticker' THEN text = '😊 Sticker'
        ELSE false
    END as emoji_correto
FROM messages 
WHERE (external_message_id LIKE 'webhook_%_' || extract(epoch from date_trunc('hour', now()))::text || '%'
    OR external_message_id LIKE 'app_%_' || extract(epoch from date_trunc('hour', now()))::text || '%'
    OR external_message_id LIKE 'ai_%_' || extract(epoch from date_trunc('hour', now()))::text || '%')
GROUP BY media_type, text
ORDER BY media_type, text;

-- 5.4 Status das filas após testes
SELECT 
    '📦 STATUS DAS FILAS APÓS TESTES' as categoria,
    queue_name,
    (pgmq.metrics(queue_name)).queue_length as mensagens_pendentes,
    (pgmq.metrics(queue_name)).total_messages as total_processadas
FROM (
    VALUES 
        ('webhook_message_queue'),
        ('app_message_queue'),
        ('ai_message_queue')
) AS queues(queue_name);

-- 5.5 Resumo final dos testes
SELECT 
    '✅ TESTE COMPLETO DAS 3 EDGES' as resultado,
    'Testadas todas as combinações: from_me + tipos de mídia' as detalhes,
    jsonb_build_object(
        'edges_testadas', 3,
        'tipos_testados', jsonb_build_object(
            'webhook', ARRAY['texto_in', 'imagem_in', 'video_in', 'audio_in', 'documento_in'],
            'app', ARRAY['texto_out', 'imagem_out', 'video_out'], 
            'ai', ARRAY['texto_out', 'voice_out', 'sticker_out']
        ),
        'from_me_testado', jsonb_build_object(
            'webhook', false,  -- Sempre false (mensagens recebidas)
            'app', true,      -- Sempre true (mensagens enviadas)
            'ai', true        -- Sempre true (mensagens enviadas)
        ),
        'formatos_midia_testados', ARRAY['text', 'image', 'video', 'audio', 'voice', 'document', 'sticker'],
        'total_mensagens_teste', (
            SELECT COUNT(*) FROM messages 
            WHERE external_message_id LIKE 'webhook_%_' || extract(epoch from date_trunc('hour', now()))::text || '%'
               OR external_message_id LIKE 'app_%_' || extract(epoch from date_trunc('hour', now()))::text || '%'
               OR external_message_id LIKE 'ai_%_' || extract(epoch from date_trunc('hour', now()))::text || '%'
        )
    ) as resumo_teste;