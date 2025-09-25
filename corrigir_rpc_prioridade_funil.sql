-- ============================================
-- CORREÇÃO RPC: Prioridade de funil da instância
-- ============================================

-- Atualizar save_received_message_webhook para receber funnel_id da instância
-- e usar ordem de prioridade: 1º instância, 2º mais antigo

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
    p_source_edge text DEFAULT NULL,
    p_instance_funnel_id uuid DEFAULT NULL  -- ← NOVO PARÂMETRO
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
    v_formatted_name TEXT;
    v_first_stage_id UUID;
    v_funnel_id UUID;
    v_owner_id UUID;
BEGIN
    -- 🧹 LIMPAR TELEFONE
    v_clean_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');

    -- 📞 FORMATAR NOME DO LEAD SEMPRE CORRETAMENTE
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

    -- 🎯 NOVA LÓGICA: PRIORIDADE DE FUNIL
    -- 1º PRIORIDADE: Funil da instância (se veio da edge)
    -- 2º PRIORIDADE: Funil mais antigo do usuário

    IF p_instance_funnel_id IS NOT NULL THEN
        -- ✅ USAR FUNIL DA INSTÂNCIA (prioridade 1)
        v_funnel_id := p_instance_funnel_id;
        RAISE NOTICE '[save_received_message] 🎯 Usando funil da instância: %', v_funnel_id;
    ELSE
        -- 🔍 BUSCAR FUNIL MAIS ANTIGO DO USUÁRIO (prioridade 2)
        SELECT id INTO v_funnel_id
        FROM public.funnels
        WHERE created_by_user_id = v_user_id
          AND is_active = true
        ORDER BY created_at ASC
        LIMIT 1;

        IF v_funnel_id IS NOT NULL THEN
            RAISE NOTICE '[save_received_message] 🔄 Usando funil mais antigo do usuário: %', v_funnel_id;
        ELSE
            RAISE WARNING '[save_received_message] ❌ Nenhum funil encontrado para usuário: %', v_user_id;
        END IF;
    END IF;

    -- Buscar primeira etapa do funil
    IF v_funnel_id IS NOT NULL THEN
        SELECT id INTO v_first_stage_id
        FROM public.kanban_stages
        WHERE funnel_id = v_funnel_id
          AND order_position = 1
        LIMIT 1;

        IF v_first_stage_id IS NULL THEN
            RAISE WARNING '[save_received_message] ❌ Primeira etapa não encontrada para funil: %', v_funnel_id;
        END IF;
    END IF;

    -- 🔍 BUSCAR OU CRIAR LEAD
    SELECT id INTO v_lead_id
    FROM public.leads
    WHERE phone = v_clean_phone
      AND created_by_user_id = v_user_id
    LIMIT 1;

    IF v_lead_id IS NULL THEN
        -- 🎯 CRIAR LEAD COM FUNIL PRIORITÁRIO
        v_owner_id := v_user_id;

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
            v_formatted_name,    -- ✅ SEMPRE NÚMERO FORMATADO
            v_clean_phone,
            p_profile_pic_url,
            v_instance_id,
            v_user_id,
            'webhook',
            v_funnel_id,         -- ✅ FUNIL COM PRIORIDADE
            v_first_stage_id,    -- ✅ PRIMEIRA ETAPA
            v_owner_id,
            NULL,
            v_message_text,
            NOW()
        )
        RETURNING id INTO v_lead_id;

        RAISE NOTICE '[save_received_message] ✅ Lead criado no funil % etapa %', v_funnel_id, v_first_stage_id;
    ELSE
        -- 🔄 ATUALIZAR LEAD EXISTENTE - NÃO ALTERAR FUNIL/ETAPA
        UPDATE public.leads
        SET
            last_message = v_message_text,
            last_message_time = NOW(),
            profile_pic_url = COALESCE(p_profile_pic_url, profile_pic_url)
        WHERE id = v_lead_id;

        RAISE NOTICE '[save_received_message] ✅ Lead existente atualizado: %', v_lead_id;
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
        'sent'
    )
    RETURNING id INTO v_message_id;

    -- ✅ RETORNO COM INFORMAÇÕES COMPLETAS
    RETURN jsonb_build_object(
        'success', true,
        'message_id', v_message_id,
        'lead_id', v_lead_id,
        'funnel_id', v_funnel_id,
        'stage_id', v_first_stage_id,
        'instance_id', v_instance_id,
        'funnel_source', CASE
            WHEN p_instance_funnel_id IS NOT NULL THEN 'instance'
            ELSE 'oldest_user_funnel'
        END,
        'debug', jsonb_build_object(
            'clean_phone', v_clean_phone,
            'formatted_name', v_formatted_name,
            'message_text', v_message_text,
            'user_id', v_user_id,
            'instance_funnel_id', p_instance_funnel_id,
            'selected_funnel_id', v_funnel_id
        )
    );

EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[save_received_message] ❌ Erro: % - SQLSTATE: %', SQLERRM, SQLSTATE;
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'sqlstate', SQLSTATE
    );
END;
$$;

-- VERIFICAÇÃO: Testar se a função foi atualizada
SELECT
    'FUNÇÃO ATUALIZADA COM SUCESSO!' as resultado,
    p.proname as function_name,
    array_length(p.proargtypes, 1) as parameter_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'save_received_message_webhook';