-- ================================================================
-- TESTE COMPLETO CORRIGIDO DAS 3 EDGES
-- ================================================================

-- 🔧 CORREÇÕES APLICADAS:
-- - Usar apenas save_received_message_webhook (que sabemos que existe)
-- - Remover "voice" e usar "audio" 
-- - Verificar funções antes de testar

-- ================================================================
-- 📊 1. VERIFICAR FUNÇÕES DISPONÍVEIS
-- ================================================================

-- 1.1 Listar todas as funções de salvamento disponíveis
SELECT 
    '🔍 FUNÇÕES DE SALVAMENTO DISPONÍVEIS' as categoria,
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%save%message%'
ORDER BY routine_name;

-- 1.2 Verificar enum media_type válidos
SELECT 
    '📋 TIPOS DE MÍDIA VÁLIDOS' as categoria,
    unnest(enum_range(NULL::media_type)) as media_type_valido;

-- ================================================================
-- 🚀 2. TESTE APENAS COM FUNÇÕES QUE SABEMOS QUE EXISTEM
-- ================================================================

-- 2.1 WEBHOOK - Texto recebido (from_me = false)
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 TESTE WEBHOOK - TEXTO RECEBIDO ===';
    
    SELECT * FROM save_received_message_webhook(
        'test_vps_instance'::text,
        '5511987654321'::text,
        'Mensagem texto recebida webhook'::text,
        false::boolean,
        'text'::text,
        NULL::text,
        ('webhook_texto_in_' || extract(epoch from now())::text)::text,
        NULL::text,
        NULL::text
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
        'test_vps_instance'::text,
        '5511987654321'::text,
        NULL::text,
        false::boolean,
        'image'::text,
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='::text,
        ('webhook_img_in_' || extract(epoch from now())::text)::text,
        NULL::text,
        NULL::text
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
        'test_vps_instance'::text,
        '5511987654321'::text,
        NULL::text,
        false::boolean,
        'video'::text,
        'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMWF2YzEAAAAIZnJlZQAAAAxtZGF0AAAAlHUADW5kc2RzAA=='::text,
        ('webhook_video_in_' || extract(epoch from now())::text)::text,
        NULL::text,
        NULL::text
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
        'test_vps_instance'::text,
        '5511987654321'::text,
        NULL::text,
        false::boolean,
        'audio'::text,
        'data:audio/ogg;base64,T2dnUwACAAAAAAAAC+RDAAAAAAADfNH8AU9nZ1MAAgAAAAAAALzkQgAAAAAAAHzR/AE='::text,
        ('webhook_audio_in_' || extract(epoch from now())::text)::text,
        NULL::text,
        NULL::text
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
        'test_vps_instance'::text,
        '5511987654321'::text,
        NULL::text,
        false::boolean,
        'document'::text,
        'data:application/pdf;base64,JVBERi0xLjMKJf////8KMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovT3V0bGluZXMgMiAwIFIKL1BhZ2VzIDMgMCBSCj4+CmVuZG9iago='::text,
        ('webhook_doc_in_' || extract(epoch from now())::text)::text,
        NULL::text,
        NULL::text
    ) INTO v_result;
    
    IF (v_result->>'success')::boolean THEN
        v_message_id := (v_result->'data'->>'message_id')::UUID;
        RAISE NOTICE '✅ WEBHOOK DOCUMENTO IN: Message ID = %', v_message_id;
    ELSE
        RAISE NOTICE '❌ WEBHOOK DOCUMENTO IN: Falha - %', v_result->>'error';
    END IF;
END $$;

-- ================================================================
-- 🧪 3. TESTE COM A FUNÇÃO ANTIGA (SE AS NOVAS NÃO EXISTEM)
-- ================================================================

-- 3.1 Testar com save_whatsapp_message_service_role (função antiga)
DO $$
DECLARE
    v_result jsonb;
    v_message_id UUID;
BEGIN
    RAISE NOTICE '=== 🧪 TESTE COM FUNÇÃO ANTIGA - TEXTO ENVIADO ===';
    
    -- Verificar se função antiga existe
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'save_whatsapp_message_service_role'
    ) THEN
        SELECT * FROM save_whatsapp_message_service_role(
            'test_vps_instance'::text,
            '5511987654321'::text,
            'Mensagem texto enviada função antiga'::text,
            true::boolean,
            'text'::text,
            NULL::text,
            ('old_func_texto_out_' || extract(epoch from now())::text)::text,
            NULL::text,
            NULL::text
        ) INTO v_result;
        
        IF (v_result->>'success')::boolean THEN
            v_message_id := (v_result->'data'->>'message_id')::UUID;
            RAISE NOTICE '✅ FUNÇÃO ANTIGA TEXTO OUT: Message ID = %', v_message_id;
        ELSE
            RAISE NOTICE '❌ FUNÇÃO ANTIGA TEXTO OUT: Falha - %', v_result->>'error';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ FUNÇÃO ANTIGA NÃO ENCONTRADA: save_whatsapp_message_service_role';
    END IF;
END $$;

-- ================================================================
-- 📊 4. VALIDAR RESULTADOS DOS TESTES
-- ================================================================

-- 4.1 Verificar mensagens criadas nos testes
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
    created_at
FROM messages 
WHERE external_message_id LIKE 'webhook_%' || extract(epoch from date_trunc('hour', now()))::text || '%'
   OR external_message_id LIKE 'old_func_%' || extract(epoch from date_trunc('hour', now()))::text || '%'
ORDER BY created_at DESC;

-- 4.2 Verificar emojis corretos
SELECT 
    '🎭 VALIDAÇÃO DE EMOJIS' as categoria,
    media_type,
    text,
    COUNT(*) as quantidade,
    CASE media_type
        WHEN 'text' THEN text != '' AND text NOT LIKE '%📷%' AND text NOT LIKE '%🎥%' AND text NOT LIKE '%🎤%' AND text NOT LIKE '%📄%'
        WHEN 'image' THEN text = '📷 Imagem'
        WHEN 'video' THEN text = '🎥 Vídeo'  
        WHEN 'audio' THEN text = '🎵 Áudio' OR text = '🎤 Áudio'
        WHEN 'document' THEN text = '📄 Documento'
        WHEN 'sticker' THEN text = '😊 Sticker'
        ELSE false
    END as emoji_correto
FROM messages 
WHERE external_message_id LIKE 'webhook_%' || extract(epoch from date_trunc('hour', now()))::text || '%'
   OR external_message_id LIKE 'old_func_%' || extract(epoch from date_trunc('hour', now()))::text || '%'
GROUP BY media_type, text
ORDER BY media_type, text;

-- 4.3 Status das filas
SELECT 
    '📦 STATUS DAS FILAS' as categoria,
    queue_name,
    (pgmq.metrics(queue_name)).queue_length as mensagens_pendentes,
    (pgmq.metrics(queue_name)).total_messages as total_processadas
FROM (
    VALUES 
        ('webhook_message_queue'),
        ('app_message_queue'),
        ('ai_message_queue')
) AS queues(queue_name)
WHERE EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'pgmq' 
    AND tablename = 'q_' || queues.queue_name
);

-- 4.4 Verificar se precisa recriar as RPCs isoladas
SELECT 
    '🔧 DIAGNÓSTICO FINAL' as categoria,
    'Funções APP e AI não encontradas' as problema,
    'Execute novamente phase2_create_isolated_rpcs.sql' as solucao;