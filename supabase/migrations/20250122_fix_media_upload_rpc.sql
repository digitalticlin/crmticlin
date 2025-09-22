-- Adicionar logs detalhados na RPC para debug do upload de mídia

-- Atualizar a função para adicionar mais logs
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
BEGIN
    -- 🧹 LIMPAR TELEFONE
    v_clean_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');

    -- 📞 CORREÇÃO 2: FORMATAR NOME DO LEAD SEMPRE CORRETAMENTE
    -- Sempre usar formato +55 (XX) XXXXX-XXXX, ignorar nome do WhatsApp
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

    -- 🎯 CORREÇÃO 1: TEXTO DA MENSAGEM - CONSERTAR LÓGICA PARA TEXT
    CASE LOWER(COALESCE(p_media_type, 'text'))
        WHEN 'text' THEN
            -- ✅ MENSAGEM DE TEXTO - SEMPRE USAR CONTEÚDO REAL, NUNCA "📎 Mídia"
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
            -- ✅ FALLBACK: Para outros tipos, usar texto se disponível
            v_message_text := COALESCE(NULLIF(TRIM(p_message_text), ''), '📎 Mídia');
    END CASE;

    -- Converter para enum
    v_media_type_enum := COALESCE(p_media_type, 'text')::media_type;

    -- 🔍 BUSCAR INSTÂNCIA E USUÁRIO PELO NOME
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
        -- 🎯 DEFINIR OWNER E BUSCAR FUNIL
        v_owner_id := v_user_id;

        -- Buscar funil padrão
        SELECT id INTO v_funnel_id
        FROM public.funnels
        WHERE created_by_user_id = v_user_id
        ORDER BY created_at ASC
        LIMIT 1;

        -- Buscar primeiro stage
        IF v_funnel_id IS NOT NULL THEN
            SELECT id INTO v_first_stage_id
            FROM public.kanban_stages
            WHERE funnel_id = v_funnel_id
            ORDER BY order_position ASC
            LIMIT 1;
        END IF;

        -- 🎯 CRIAR LEAD COM NOME SEMPRE FORMATADO
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
            v_formatted_name,    -- ✅ SEMPRE FORMATO +55 (XX) XXXXX-XXXX
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
        -- 🔄 ATUALIZAR LEAD EXISTENTE - MANTER NOME ORIGINAL, NÃO SOBRESCREVER
        UPDATE public.leads
        SET
            last_message = v_message_text,
            last_message_time = NOW(),
            profile_pic_url = COALESCE(p_profile_pic_url, profile_pic_url)
        WHERE id = v_lead_id;
    END IF;

    -- 💾 INSERIR MENSAGEM COM CAMPOS CORRETOS
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
        v_message_text,          -- ✅ TEXTO CORRETO - NUNCA "📎 Mídia" PARA TEXT
        p_from_me,
        v_user_id,
        v_lead_id,
        v_media_type_enum,
        NULL,                    -- ✅ SEMPRE NULL inicialmente, será atualizado pela edge
        p_external_message_id,
        v_instance_id,
        p_source_edge,
        'webhook',
        NOW(),
        CASE WHEN p_from_me THEN 'sent'::message_status ELSE 'received'::message_status END
    )
    RETURNING id INTO v_message_id;

    -- 🚀 DEBUG: Verificar condições para chamar edge
    v_should_call_edge := (p_media_type != 'text' AND p_base64_data IS NOT NULL);

    RAISE NOTICE '[RPC] 🔍 DEBUG Upload de mídia: media_type=%, has_base64=%, base64_length=%, should_call_edge=%',
        p_media_type,
        (p_base64_data IS NOT NULL),
        COALESCE(length(p_base64_data), 0),
        v_should_call_edge;

    -- 🚀 CHAMAR EDGE PARA MÍDIA SE NECESSÁRIO
    IF v_should_call_edge THEN
        v_edge_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_storage_upload';

        RAISE NOTICE '[RPC] 📤 Chamando edge de upload: message_id=%, file_path=%',
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
                '{"Content-Type": "application/json"}'::jsonb
            ) INTO v_edge_result;

            RAISE NOTICE '[RPC] ✅ Edge chamada, resultado: %', v_edge_result;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '[RPC] ❌ Erro ao chamar edge upload: %', SQLERRM;
            -- Não falhar a operação, apenas logar
        END;
    ELSE
        RAISE NOTICE '[RPC] ⏭️ Pulando upload - não é mídia ou sem base64';
    END IF;

    -- ✅ RETORNO
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
        RAISE NOTICE '[RPC] ❌ ERRO GERAL: %', SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;