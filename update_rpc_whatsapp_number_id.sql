-- ================================================================
-- 🔧 ATUALIZAR RPC PARA INCLUIR whatsapp_number_id
-- ================================================================

-- Remover versões antigas
DROP FUNCTION IF EXISTS public.save_received_message_webhook(
    p_vps_instance_id UUID,
    p_phone TEXT,
    p_message_text TEXT,
    p_from_me BOOLEAN,
    p_media_type TEXT,
    p_media_url TEXT,
    p_external_message_id TEXT,
    p_contact_name TEXT,
    p_profile_pic_url TEXT,
    p_base64_data TEXT,
    p_mime_type TEXT,
    p_file_name TEXT
);

-- Criar versão atualizada com whatsapp_number_id
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
    p_whatsapp_number_id UUID DEFAULT NULL
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
BEGIN
    -- Formatar telefone
    v_formatted_phone := regexp_replace(p_phone, '[^0-9+]', '', 'g');
    
    -- Preparar texto da mensagem com emojis
    CASE p_media_type
        WHEN 'text' THEN v_message_text := p_message_text;
        WHEN 'image' THEN v_message_text := '📷 Imagem';
        WHEN 'video' THEN v_message_text := '🎥 Vídeo';
        WHEN 'audio' THEN v_message_text := '🎵 Áudio';
        WHEN 'document' THEN v_message_text := '📄 Documento';
        WHEN 'sticker' THEN v_message_text := '😊 Sticker';
        ELSE v_message_text := '📎 Mídia';
    END CASE;

    -- Converter para enum
    v_media_type_enum := p_media_type::media_type;
    v_message_id := gen_random_uuid();

    -- 🎯 GERAR URL ISOLADA PARA WEBHOOK COM ID CORRETO DO PROJETO
    IF p_media_type != 'text' AND p_base64_data IS NOT NULL THEN
        v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' ||
                        'webhook/' || p_media_type || '/' ||
                        to_char(now(), 'YYYY-MM-DD') || '/' ||
                        'msg_' || substring(v_message_id::text, 1, 8) || '_' || 
                        extract(epoch from now())::text ||
                        CASE p_media_type
                            WHEN 'image' THEN '.jpg'
                            WHEN 'video' THEN '.mp4'
                            WHEN 'audio' THEN '.ogg'
                            WHEN 'document' THEN '.pdf'
                            WHEN 'sticker' THEN '.webp'
                            ELSE '.bin'
                        END;
    END IF;

    -- 📱 CRIAR/ATUALIZAR LEAD
    INSERT INTO public.leads (
        phone,
        name,
        created_by_user_id,
        import_source,
        profile_pic_url
    )
    VALUES (
        v_formatted_phone,
        COALESCE(p_contact_name, v_formatted_phone),
        p_vps_instance_id,
        'webhook',
        p_profile_pic_url
    )
    ON CONFLICT (phone, created_by_user_id) 
    DO UPDATE SET
        name = COALESCE(EXCLUDED.name, leads.name),
        profile_pic_url = COALESCE(EXCLUDED.profile_pic_url, leads.profile_pic_url),
        updated_at = now()
    RETURNING id INTO v_lead_id;

    -- 📝 INSERIR MENSAGEM
    INSERT INTO public.messages (
        id,
        text, 
        from_me, 
        media_type, 
        created_by_user_id,
        import_source,
        external_message_id,
        media_url,
        lead_id,
        whatsapp_number_id
    )
    VALUES (
        v_message_id,
        v_message_text,
        p_from_me,
        v_media_type_enum,
        p_vps_instance_id,
        'webhook',
        p_external_message_id,
        v_storage_url,
        v_lead_id,
        p_whatsapp_number_id
    );

    -- 🔄 ENFILEIRAR NA FILA ISOLADA WEBHOOK_MESSAGE_QUEUE
    IF p_base64_data IS NOT NULL AND p_media_type != 'text' THEN
        PERFORM pgmq.send(
            'webhook_message_queue',  -- Fila isolada para webhook
            jsonb_build_object(
                'message_id', v_message_id,
                'media_type', p_media_type,
                'base64_data', p_base64_data,
                'mime_type', p_mime_type,
                'file_name', p_file_name,
                'external_message_id', p_external_message_id
            )
        );
    END IF;

    RETURN jsonb_build_object(
        'data', jsonb_build_object(
            'success', true,
            'message_id', v_message_id,
            'lead_id', v_lead_id,
            'media_url', v_storage_url
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'data', jsonb_build_object(
                'success', false,
                'error', SQLERRM
            )
        );
END;
$$;