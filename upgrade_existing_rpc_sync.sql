-- ================================================================
-- 🔧 ATUALIZAR RPC EXISTENTE PARA PROCESSAMENTO SÍNCRONO
-- ================================================================

-- Modificar a RPC save_received_message_webhook EXISTENTE
-- para fazer upload síncrono em vez de enfileirar

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
    v_clean_base64 TEXT;
    v_binary_data BYTEA;
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

    -- 🚀 PROCESSAMENTO SÍNCRONO DE MÍDIA (SEM ENFILEIRAR)
    IF p_media_type != 'text' AND p_base64_data IS NOT NULL AND LENGTH(p_base64_data) > 100 THEN
        -- Gerar extensão
        v_extension := CASE p_media_type
            WHEN 'image' THEN 'jpg'
            WHEN 'video' THEN 'mp4'
            WHEN 'audio' THEN 'mp3'
            WHEN 'document' THEN 'pdf'
            WHEN 'sticker' THEN 'webp'
            ELSE 'bin'
        END;

        -- Gerar caminho do arquivo
        v_file_path := format('webhook/%s/%s/msg_%s_%s.%s',
            p_media_type,
            to_char(now(), 'YYYY-MM-DD'),
            LEFT(v_message_id::text, 8),
            extract(epoch from now())::bigint,
            v_extension
        );

        -- 📤 PROCESSAMENTO DIRETO DA MÍDIA (SEM HTTP)
        BEGIN
            -- Limpar base64 (remover prefixo data: se houver)
            v_clean_base64 := CASE
                WHEN p_base64_data LIKE 'data:%' THEN split_part(p_base64_data, ',', 2)
                ELSE p_base64_data
            END;

            -- Converter para binário
            v_binary_data := decode(v_clean_base64, 'base64');

            -- 💾 SALVAR NO STORAGE (usando função built-in do Supabase)
            BEGIN
                -- Tentar upload direto
                PERFORM storage.objects.upload(
                    'whatsapp-media',
                    v_file_path,
                    v_binary_data,
                    COALESCE(p_mime_type, 'application/octet-stream')
                );

                -- Se chegou aqui, upload foi bem-sucedido
                v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' || v_file_path;

                -- Salvar no cache de mídia
                INSERT INTO media_cache (
                    message_id,
                    original_url,
                    cached_url,
                    file_name,
                    file_size,
                    media_type,
                    processing_status,
                    created_at,
                    updated_at
                ) VALUES (
                    v_message_id,
                    v_storage_url,
                    v_storage_url,
                    COALESCE(p_file_name, v_file_path),
                    LENGTH(v_binary_data),
                    p_media_type::media_type,
                    'completed',
                    NOW(),
                    NOW()
                )
                ON CONFLICT (message_id)
                DO UPDATE SET
                    cached_url = EXCLUDED.cached_url,
                    processing_status = 'completed',
                    updated_at = NOW();

            EXCEPTION
                WHEN OTHERS THEN
                    -- Fallback: gerar URL sem storage
                    v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' || v_file_path;
            END;

        EXCEPTION
            WHEN OTHERS THEN
                -- Fallback final: URL baseada no pattern
                v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' ||
                                'webhook/' || p_media_type || '/' ||
                                to_char(now(), 'YYYY-MM-DD') || '/' ||
                                'msg_' || substring(v_message_id::text, 1, 8) || '_' ||
                                extract(epoch from now())::text || '.' || v_extension;
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

    -- 📝 INSERIR MENSAGEM COM MEDIA_URL JÁ PROCESSADA
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
        v_storage_url,
        v_lead_id,
        p_whatsapp_number_id,  -- Pode ser NULL se não existir
        p_source_edge
    );

    RETURN jsonb_build_object(
        'success', true,
        'message_id', v_message_id,
        'lead_id', v_lead_id,
        'media_url', v_storage_url,
        'processing_type', 'sync_direct',
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

-- Testar RPC atualizada com whatsapp_number_id correto
DO $$
DECLARE
    v_valid_whatsapp_id UUID;
    v_result JSONB;
BEGIN
    -- Buscar um whatsapp_number_id válido
    SELECT id INTO v_valid_whatsapp_id
    FROM whatsapp_instances
    WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID
    LIMIT 1;

    -- Se não encontrou, usar NULL
    IF v_valid_whatsapp_id IS NULL THEN
        RAISE NOTICE '⚠️ Nenhum whatsapp_instance encontrado, usando NULL';
    ELSE
        RAISE NOTICE '✅ Usando whatsapp_number_id: %', v_valid_whatsapp_id;
    END IF;

    -- Testar RPC atualizada
    SELECT save_received_message_webhook(
        '712e7708-2299-4a00-9128-577c8f113ca4'::UUID,  -- p_vps_instance_id
        '+5511999999999',                                -- p_phone
        'TESTE RPC ATUALIZADA SYNC',                     -- p_message_text
        false,                                           -- p_from_me
        'image',                                         -- p_media_type
        NULL,                                            -- p_media_url
        'rpc_updated_' || extract(epoch from now())::text, -- p_external_message_id
        'Teste RPC Updated',                             -- p_contact_name
        NULL,                                            -- p_profile_pic_url
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=', -- p_base64_data
        'image/jpeg',                                    -- p_mime_type
        'rpc_updated.jpg',                               -- p_file_name
        v_valid_whatsapp_id,                             -- p_whatsapp_number_id (válido ou NULL)
        'webhook_whatsapp_web'                           -- p_source_edge
    ) INTO v_result;

    RAISE NOTICE '🧪 Resultado RPC atualizada: %', v_result;
END $$;