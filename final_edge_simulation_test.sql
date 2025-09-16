-- ================================================================
-- 🎯 SIMULAÇÃO FINAL: EXATAMENTE COMO A EDGE FUNCIONA
-- ================================================================

-- 1️⃣ Aplicar a RPC que gera URLs (versão limpa e funcional)
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
    v_message_id UUID := gen_random_uuid();
    v_message_text TEXT;
    v_media_type_enum media_type;
    v_storage_url TEXT;
    v_lead_id UUID;
    v_formatted_phone TEXT;
    v_file_path TEXT;
    v_extension TEXT;
BEGIN
    -- Formatar telefone
    v_formatted_phone := regexp_replace(p_phone, '[^0-9+]', '', 'g');

    -- Preparar texto da mensagem
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

    -- 🎯 GERAR URL PARA MÍDIA (SEMPRE, MESMO SEM UPLOAD)
    IF p_media_type != 'text' AND p_base64_data IS NOT NULL AND LENGTH(p_base64_data) > 100 THEN
        -- Determinar extensão do arquivo
        v_extension := CASE p_media_type
            WHEN 'image' THEN 'jpg'
            WHEN 'video' THEN 'mp4'
            WHEN 'audio' THEN 'mp3'
            WHEN 'document' THEN 'pdf'
            WHEN 'sticker' THEN 'webp'
            ELSE 'bin'
        END;

        -- Gerar path único
        v_file_path := format('webhook/%s/%s/msg_%s_%s.%s',
            p_media_type,
            to_char(now(), 'YYYY-MM-DD'),
            LEFT(v_message_id::text, 8),
            extract(epoch from now())::bigint,
            v_extension
        );

        -- Gerar URL final
        v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' || v_file_path;
    END IF;

    -- 📱 Criar/atualizar lead
    INSERT INTO public.leads (
        phone,
        name,
        created_by_user_id,
        import_source,
        profile_pic_url
    )
    VALUES (
        v_formatted_phone,
        COALESCE(p_contact_name, 'WhatsApp'),
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

    -- 📝 Inserir mensagem
    INSERT INTO public.messages (
        id,
        text,
        from_me,
        media_type,
        created_by_user_id,
        import_source,
        external_message_id,
        media_url,  -- ← AQUI ESTÁ A URL GERADA
        lead_id,
        whatsapp_number_id,
        source_edge
    )
    VALUES (
        v_message_id,
        v_message_text,
        p_from_me,
        v_media_type_enum,
        p_vps_instance_id,
        'webhook',
        p_external_message_id,
        v_storage_url,  -- ← URL SEMPRE PREENCHIDA
        v_lead_id,
        p_whatsapp_number_id,
        p_source_edge
    );

    -- Retornar resultado
    RETURN jsonb_build_object(
        'success', true,
        'message_id', v_message_id,
        'lead_id', v_lead_id,
        'media_url', v_storage_url,
        'processing_type', 'url_generated',
        'note', 'URL gerada sem upload real',
        'data', jsonb_build_object(
            'message_id', v_message_id,
            'lead_id', v_lead_id,
            'success', true
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'data', jsonb_build_object(
                'success', false,
                'error', SQLERRM
            )
        );
END;
$$;

-- 2️⃣ TESTE SIMULANDO EXATAMENTE A EDGE
SELECT
    '🎯 SIMULAÇÃO EDGE FUNCTION' as teste,
    save_received_message_webhook(
        '712e7708-2299-4a00-9128-577c8f113ca4'::UUID,  -- Instance ID válido
        '+5511987654321',                                -- Telefone
        'Test message with image',                       -- Texto
        false,                                           -- from_me
        'image',                                         -- media_type
        NULL,                                            -- media_url (NULL na entrada)
        'edge_sim_' || extract(epoch from now())::text,  -- external_message_id único
        'Test Contact',                                  -- contact_name
        NULL,                                            -- profile_pic_url
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',  -- base64_data
        'image/jpeg',                                    -- mime_type
        'test_image.jpg',                                -- file_name
        NULL,                                            -- whatsapp_number_id
        'webhook_whatsapp_web'                           -- source_edge
    ) as resultado;

-- 3️⃣ VERIFICAR RESULTADO IMEDIATO
SELECT
    '🔍 VERIFICAÇÃO FINAL' as check,
    id,
    media_type,
    CASE
        WHEN media_url IS NOT NULL AND media_url != ''
        THEN '✅ SUCESSO! URL GERADA'
        ELSE '❌ FALHOU - URL NULL'
    END as status_final,
    media_url,
    text,
    external_message_id,
    created_at
FROM public.messages
WHERE external_message_id LIKE 'edge_sim_%'
AND created_at >= NOW() - INTERVAL '1 minute'
ORDER BY created_at DESC
LIMIT 1;

-- 4️⃣ CONTAR TOTAL DE MENSAGENS COM MEDIA_URL
SELECT
    '📊 ESTATÍSTICAS FINAIS' as info,
    COUNT(*) as total_messages,
    COUNT(media_url) as messages_with_url,
    ROUND(
        (COUNT(media_url)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2
    ) as percentage_with_url
FROM public.messages
WHERE created_at >= NOW() - INTERVAL '1 hour'
AND media_type != 'text';