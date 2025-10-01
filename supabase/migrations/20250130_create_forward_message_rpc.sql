-- RPC para encaminhar mensagem duplicando todos os dados
-- Copia a mensagem original para um novo lead, mantendo mídia e metadados
CREATE OR REPLACE FUNCTION public.forward_message_to_contact(
    p_message_id uuid,
    p_target_lead_id uuid,
    p_instance_id uuid,
    p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_original_message RECORD;
    v_target_lead RECORD;
    v_new_message_id uuid;
    v_media_cache RECORD;
    v_new_media_cache_id uuid;
    v_last_message_text text;
BEGIN
    -- 🔍 BUSCAR MENSAGEM ORIGINAL
    SELECT
        text,
        media_type,
        media_url,
        id as original_id
    INTO v_original_message
    FROM public.messages
    WHERE id = p_message_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Mensagem original não encontrada'
        );
    END IF;

    -- 🔍 BUSCAR LEAD DESTINO
    SELECT
        id,
        phone,
        name
    INTO v_target_lead
    FROM public.leads
    WHERE id = p_target_lead_id
      AND created_by_user_id = p_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Lead destino não encontrado ou sem permissão'
        );
    END IF;

    -- 📝 PREPARAR TEXTO PARA last_message
    CASE v_original_message.media_type
        WHEN 'text' THEN
            v_last_message_text := v_original_message.text;
        WHEN 'image' THEN
            v_last_message_text := '📷 Imagem';
        WHEN 'video' THEN
            v_last_message_text := '🎥 Vídeo';
        WHEN 'audio' THEN
            v_last_message_text := '�� Áudio';
        WHEN 'document' THEN
            v_last_message_text := '📄 Documento';
        ELSE
            v_last_message_text := COALESCE(v_original_message.text, '📎 Mídia');
    END CASE;

    -- 💾 INSERIR NOVA MENSAGEM (DUPLICADA)
    INSERT INTO public.messages (
        text,
        from_me,
        created_by_user_id,
        lead_id,
        media_type,
        media_url,
        whatsapp_number_id,
        source_edge,
        import_source,
        timestamp,
        status,
        is_forwarded,
        original_message_id
    ) VALUES (
        v_original_message.text,
        true,                                    -- ✅ Mensagem enviada por nós
        p_user_id,
        p_target_lead_id,
        v_original_message.media_type,
        v_original_message.media_url,            -- ✅ COPIA URL DIRETAMENTE
        p_instance_id,
        'whatsapp_messaging_forward',
        'forward',
        NOW(),
        'sent'::message_status,
        true,                                    -- ✅ MARCADA COMO ENCAMINHADA
        p_message_id                             -- ✅ REFERÊNCIA À ORIGINAL
    )
    RETURNING id INTO v_new_message_id;

    -- 🗄️ DUPLICAR MEDIA_CACHE SE EXISTIR
    SELECT
        base64_data,
        original_url,
        cached_url,
        file_size,
        media_type,
        file_name
    INTO v_media_cache
    FROM public.media_cache
    WHERE message_id = p_message_id;

    IF FOUND THEN
        INSERT INTO public.media_cache (
            message_id,
            base64_data,
            original_url,
            cached_url,
            file_size,
            media_type,
            file_name
        ) VALUES (
            v_new_message_id,
            v_media_cache.base64_data,
            v_media_cache.original_url,
            v_media_cache.cached_url,
            v_media_cache.file_size,
            v_media_cache.media_type,
            v_media_cache.file_name
        )
        RETURNING id INTO v_new_media_cache_id;

        RAISE NOTICE '[RPC Forward] 🗄️ Media cache duplicado: % -> %', p_message_id, v_new_message_id;
    END IF;

    -- 🔄 ATUALIZAR LAST_MESSAGE DO LEAD DESTINO
    UPDATE public.leads
    SET
        last_message = v_last_message_text,
        last_message_time = NOW()
    WHERE id = p_target_lead_id;

    -- ✅ RETORNO
    RETURN jsonb_build_object(
        'success', true,
        'new_message_id', v_new_message_id,
        'target_lead_id', p_target_lead_id,
        'target_lead_name', v_target_lead.name,
        'target_lead_phone', v_target_lead.phone,
        'media_cache_duplicated', (v_new_media_cache_id IS NOT NULL)
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '[RPC Forward] ❌ ERRO: %', SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Comentário da função
COMMENT ON FUNCTION public.forward_message_to_contact IS 'Encaminha mensagem para outro lead duplicando dados e media_cache';
