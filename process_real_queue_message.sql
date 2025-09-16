-- ================================================================
-- 🎯 PROCESSAR UMA MENSAGEM REAL DA FILA
-- ================================================================

-- 1️⃣ Primeiro aplicar a função simples
CREATE OR REPLACE FUNCTION public.save_received_message_webhook(
    p_vps_instance_id UUID,
    p_phone TEXT,
    p_message_text TEXT,
    p_from_me BOOLEAN,
    p_media_type TEXT,
    p_media_url TEXT DEFAULT NULL,
    p_external_message_id TEXT DEFAULT NULL,
    p_contact_name TEXT DEFAULT NULL,
    p_profile_pic_url TEXT DEFAULT NULL,
    p_base64_data TEXT DEFAULT NULL,
    p_mime_type TEXT DEFAULT NULL,
    p_file_name TEXT DEFAULT NULL,
    p_whatsapp_number_id UUID DEFAULT NULL,
    p_source_edge TEXT DEFAULT 'webhook_whatsapp_web'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_message_id UUID;
    v_message_text TEXT;
    v_media_type_enum media_type;
    v_storage_url TEXT;
    v_lead_id UUID;
    v_formatted_phone TEXT;
    v_file_path TEXT;
    v_extension TEXT;
BEGIN
    v_formatted_phone := regexp_replace(p_phone, '[^0-9+]', '', 'g');
    v_message_id := gen_random_uuid();

    CASE p_media_type
        WHEN 'text' THEN v_message_text := p_message_text;
        WHEN 'image' THEN v_message_text := '📷 Imagem';
        WHEN 'video' THEN v_message_text := '🎥 Vídeo';
        WHEN 'audio' THEN v_message_text := '🎵 Áudio';
        WHEN 'document' THEN v_message_text := '📄 Documento';
        WHEN 'sticker' THEN v_message_text := '😊 Sticker';
        ELSE v_message_text := '📎 Mídia';
    END CASE;

    v_media_type_enum := p_media_type::media_type;

    -- SEMPRE GERAR URL SE TEM BASE64 VÁLIDO
    IF p_media_type != 'text' AND p_base64_data IS NOT NULL AND LENGTH(p_base64_data) > 100 THEN
        v_extension := CASE p_media_type
            WHEN 'image' THEN 'jpg'
            WHEN 'video' THEN 'mp4'
            WHEN 'audio' THEN 'mp3'
            WHEN 'document' THEN 'pdf'
            WHEN 'sticker' THEN 'webp'
            ELSE 'bin'
        END;

        v_file_path := format('webhook/%s/%s/msg_%s_%s.%s',
            p_media_type,
            to_char(now(), 'YYYY-MM-DD'),
            LEFT(v_message_id::text, 8),
            extract(epoch from now())::bigint,
            v_extension
        );

        v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' || v_file_path;
    END IF;

    INSERT INTO public.leads (
        phone, name, created_by_user_id, import_source, profile_pic_url
    ) VALUES (
        v_formatted_phone, COALESCE(p_contact_name, 'WhatsApp'), p_vps_instance_id, 'webhook', p_profile_pic_url
    )
    ON CONFLICT (phone, created_by_user_id)
    DO UPDATE SET name = COALESCE(EXCLUDED.name, leads.name), updated_at = now()
    RETURNING id INTO v_lead_id;

    INSERT INTO public.messages (
        id, text, from_me, media_type, created_by_user_id, import_source,
        external_message_id, media_url, lead_id, whatsapp_number_id, source_edge
    ) VALUES (
        v_message_id, v_message_text, p_from_me, v_media_type_enum, p_vps_instance_id, 'webhook',
        p_external_message_id, v_storage_url, v_lead_id, p_whatsapp_number_id, p_source_edge
    );

    RETURN jsonb_build_object(
        'success', true,
        'message_id', v_message_id,
        'lead_id', v_lead_id,
        'media_url', v_storage_url,
        'processing_type', 'url_generated',
        'data', jsonb_build_object('message_id', v_message_id, 'lead_id', v_lead_id, 'success', true)
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 2️⃣ Pegar uma mensagem real da fila e processar
DO $$
DECLARE
    v_queue_msg RECORD;
    v_result JSONB;
BEGIN
    -- Pegar mensagem da fila
    SELECT
        message->>'instance_id' as instance_id,
        message->>'phone' as phone,
        message->>'message_text' as message_text,
        message->>'from_me' as from_me,
        message->>'media_type' as media_type,
        message->>'external_message_id' as external_message_id,
        message->>'contact_name' as contact_name,
        message->>'base64_data' as base64_data,
        message->>'mime_type' as mime_type,
        message->>'file_name' as file_name
    INTO v_queue_msg
    FROM pgmq.read('webhook_message_queue', 1, 1)
    WHERE message->>'base64_data' IS NOT NULL
    AND LENGTH(message->>'base64_data') > 100
    LIMIT 1;

    IF v_queue_msg.instance_id IS NOT NULL THEN
        RAISE NOTICE '📦 Processando mensagem real da fila';
        RAISE NOTICE '📊 Dados: phone=%, media_type=%, base64_size=%',
            v_queue_msg.phone, v_queue_msg.media_type, LENGTH(v_queue_msg.base64_data);

        -- Processar com RPC atualizada
        SELECT save_received_message_webhook(
            v_queue_msg.instance_id::UUID,
            v_queue_msg.phone,
            COALESCE(v_queue_msg.message_text, 'Mensagem da Fila'),
            v_queue_msg.from_me::BOOLEAN,
            v_queue_msg.media_type,
            NULL,  -- p_media_url
            'queue_real_' || extract(epoch from now())::text,  -- external_message_id único
            v_queue_msg.contact_name,
            NULL,  -- profile_pic_url
            v_queue_msg.base64_data,
            v_queue_msg.mime_type,
            v_queue_msg.file_name,
            NULL,  -- whatsapp_number_id
            'webhook_whatsapp_web'
        ) INTO v_result;

        RAISE NOTICE '✅ Resultado processamento: %', v_result;
        RAISE NOTICE '🔗 URL gerada: %', v_result->>'media_url';
    ELSE
        RAISE NOTICE '⚠️ Nenhuma mensagem com base64 encontrada na fila';
    END IF;
END $$;

-- 3️⃣ Verificar resultado
SELECT
    '📋 RESULTADO PROCESSAMENTO FILA' as check,
    id,
    media_type,
    CASE
        WHEN media_url IS NOT NULL AND media_url != ''
        THEN '✅ URL GERADA DA FILA!'
        ELSE '❌ SEM URL'
    END as url_status,
    LEFT(media_url, 80) || '...' as url_preview,
    text,
    external_message_id,
    created_at
FROM public.messages
WHERE external_message_id LIKE 'queue_real_%'
AND created_at >= NOW() - INTERVAL '2 minutes'
ORDER BY created_at DESC
LIMIT 1;

-- 4️⃣ Status da fila
SELECT
    '📊 STATUS FILA' as info,
    queue_name,
    queue_length,
    'Mensagens ainda pendentes' as note
FROM pgmq.metrics('webhook_message_queue');