-- 🔐 Adicionar JWT Authorization na chamada HTTP para Edge Function
-- Resolve: Edge Function webhook_storage_upload exigindo JWT

-- Atualizar RPC para incluir Authorization header
CREATE OR REPLACE FUNCTION public.save_received_message_webhook(
    p_vps_instance_id text,
    p_phone text,
    p_message_text text,
    p_from_me boolean,
    p_media_type text DEFAULT 'text',
    p_media_url text DEFAULT NULL,
    p_external_message_id text DEFAULT NULL,
    p_contact_name text DEFAULT NULL,
    p_profile_pic_url text DEFAULT NULL,
    p_base64_data text DEFAULT NULL,
    p_mime_type text DEFAULT NULL,
    p_file_name text DEFAULT NULL,
    p_whatsapp_number_id uuid DEFAULT NULL,
    p_source_edge text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_message_id UUID;
    v_lead_id UUID;
    v_instance_id UUID;
    v_user_id UUID;
    v_clean_phone TEXT;
    v_message_text TEXT;
    v_media_type_enum media_type;
    v_edge_result jsonb;
    v_formatted_name TEXT;
    v_first_stage_id UUID;
    v_funnel_id UUID;
    v_owner_id UUID;
    v_should_call_edge BOOLEAN;
    v_edge_url TEXT;
    v_service_role_key TEXT;
BEGIN
    -- 🧹 LIMPAR TELEFONE
    v_clean_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');

    -- 📞 FORMATAR NOME DO LEAD
    IF length(v_clean_phone) = 13 AND v_clean_phone ~ '^55\d{11}$' THEN
        v_formatted_name := '+55 (' || substring(v_clean_phone from 3 for 2) || ') ' ||
                           substring(v_clean_phone from 5 for 5) || '-' ||
                           substring(v_clean_phone from 10 for 4);
    ELSIF length(v_clean_phone) = 12 AND v_clean_phone ~ '^55\d{10}$' THEN
        v_formatted_name := '+55 (' || substring(v_clean_phone from 3 for 2) || ') ' ||
                           substring(v_clean_phone from 5 for 4) || '-' ||
                           substring(v_clean_phone from 9 for 4);
    ELSE
        v_formatted_name := '+' || v_clean_phone;
    END IF;

    -- 🎯 TEXTO DA MENSAGEM
    CASE LOWER(COALESCE(p_media_type, 'text'))
        WHEN 'text' THEN
            v_message_text := COALESCE(NULLIF(TRIM(p_message_text), ''), 'Mensagem vazia');
        WHEN 'image' THEN
            v_message_text := '📷 Imagem';
        WHEN 'video' THEN
            v_message_text := '🎥 Vídeo';
        WHEN 'audio' THEN
            v_message_text := '🎵 Áudio';
        WHEN 'document' THEN
            v_message_text := '📄 Documento';
        WHEN 'sticker' THEN
            v_message_text := '😊 Sticker';
        ELSE
            v_message_text := COALESCE(NULLIF(TRIM(p_message_text), ''), '📎 Mídia');
    END CASE;

    v_media_type_enum := COALESCE(p_media_type, 'text')::media_type;

    -- 🔍 BUSCAR INSTÂNCIA E USUÁRIO
    SELECT id, created_by_user_id INTO v_instance_id, v_user_id
    FROM public.whatsapp_instances
    WHERE instance_name = p_vps_instance_id;

    IF v_user_id IS NULL OR v_instance_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Instância não encontrada: ' || COALESCE(p_vps_instance_id, 'NULL')
        );
    END IF;

    -- 🔍 BUSCAR OU CRIAR LEAD
    SELECT id INTO v_lead_id
    FROM public.leads
    WHERE phone = v_clean_phone
      AND created_by_user_id = v_user_id
    LIMIT 1;

    IF v_lead_id IS NULL THEN
        v_owner_id := v_user_id;

        SELECT id INTO v_funnel_id
        FROM public.funnels
        WHERE created_by_user_id = v_user_id
        ORDER BY created_at ASC
        LIMIT 1;

        IF v_funnel_id IS NOT NULL THEN
            SELECT id INTO v_first_stage_id
            FROM public.kanban_stages
            WHERE funnel_id = v_funnel_id
            ORDER BY order_position ASC
            LIMIT 1;
        END IF;

        INSERT INTO public.leads (
            name,
            phone,
            profile_pic_url,
            whatsapp_number_id,
            created_by_user_id,
            import_source,
            funnel_id,
            kanban_stage_id,
            owner_id,
            country,
            last_message,
            last_message_time
        ) VALUES (
            v_formatted_name,
            v_clean_phone,
            p_profile_pic_url,
            v_instance_id,
            v_user_id,
            'webhook',
            v_funnel_id,
            v_first_stage_id,
            v_owner_id,
            NULL,
            v_message_text,
            NOW()
        )
        RETURNING id INTO v_lead_id;
    ELSE
        UPDATE public.leads
        SET
            last_message = v_message_text,
            last_message_time = NOW(),
            profile_pic_url = COALESCE(p_profile_pic_url, profile_pic_url)
        WHERE id = v_lead_id;
    END IF;

    -- 💾 INSERIR MENSAGEM
    INSERT INTO public.messages (
        text,
        from_me,
        created_by_user_id,
        lead_id,
        media_type,
        media_url,
        external_message_id,
        whatsapp_number_id,
        source_edge,
        import_source,
        timestamp,
        status
    ) VALUES (
        v_message_text,
        p_from_me,
        v_user_id,
        v_lead_id,
        v_media_type_enum,
        NULL,
        p_external_message_id,
        v_instance_id,
        p_source_edge,
        'webhook',
        NOW(),
        CASE WHEN p_from_me THEN 'sent'::message_status ELSE 'received'::message_status END
    )
    RETURNING id INTO v_message_id;

    -- 🚀 CHAMAR EDGE COM JWT CORRETO
    v_should_call_edge := (p_media_type != 'text' AND p_base64_data IS NOT NULL);

    RAISE NOTICE '[RPC] 🔍 DEBUG Upload: media_type=%, has_base64=%, should_call=%',
        p_media_type,
        (p_base64_data IS NOT NULL),
        v_should_call_edge;

    IF v_should_call_edge THEN
        v_edge_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_storage_upload';

        -- 🔐 BUSCAR SERVICE_ROLE_KEY (disponível em SECURITY DEFINER functions)
        v_service_role_key := current_setting('app.settings.service_role_key', true);

        -- Se não estiver configurada, usar a do ambiente (Supabase injeta automaticamente)
        IF v_service_role_key IS NULL THEN
            v_service_role_key := current_setting('supabase.service_role_key', true);
        END IF;

        RAISE NOTICE '[RPC] 📤 Chamando edge com JWT: message_id=%, file_path=%',
            v_message_id,
            'webhook/' || v_instance_id || '/' || v_message_id || '.' || COALESCE(split_part(p_mime_type, '/', 2), 'bin');

        BEGIN
            SELECT net.http_post(
                v_edge_url,
                jsonb_build_object(
                    'message_id', v_message_id,
                    'file_path', 'webhook/' || v_instance_id || '/' || v_message_id || '.' ||
                                 COALESCE(split_part(p_mime_type, '/', 2), 'bin'),
                    'base64_data', p_base64_data,
                    'content_type', p_mime_type
                ),
                jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || COALESCE(v_service_role_key, '')
                )
            ) INTO v_edge_result;

            RAISE NOTICE '[RPC] ✅ Edge chamada com sucesso: %', v_edge_result;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '[RPC] ❌ Erro ao chamar edge: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE '[RPC] ⏭️ Pulando upload - não é mídia';
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message_id', v_message_id,
        'lead_id', v_lead_id,
        'lead_name', v_formatted_name,
        'message_text', v_message_text,
        'media_processing', v_should_call_edge
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '[RPC] ❌ ERRO: %', SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- 📝 Comentário explicativo
COMMENT ON FUNCTION public.save_received_message_webhook IS
'RPC que salva mensagens recebidas via webhook e chama edge function com JWT Authorization para upload de mídia';
