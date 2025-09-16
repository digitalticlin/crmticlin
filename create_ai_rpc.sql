-- ================================================================
-- 🚀 RPC ISOLADA PARA AI: save_sent_message_from_ai
-- ================================================================

CREATE OR REPLACE FUNCTION public.save_sent_message_from_ai(
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
    p_source_edge TEXT DEFAULT 'ai_messaging_service'
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
    v_lead_id UUID;
    v_lead_name TEXT;
    v_file_path TEXT;
    v_extension TEXT;
    v_request_id BIGINT;
    v_clean_phone TEXT;
BEGIN
    -- 📱 LIMPAR TELEFONE E FORMATAR NOME
    v_clean_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');

    -- 📱 NOME DO LEAD: Formato WhatsApp correto (4 dígitos após hífen)
    CASE
        -- 13 dígitos: 5562986032824 → +55 (62) 9860-32824
        WHEN length(v_clean_phone) = 13 THEN
            v_lead_name := '+55 (' || substring(v_clean_phone, 3, 2) || ') ' ||
                          substring(v_clean_phone, 5, 4) || '-' ||
                          substring(v_clean_phone, 9, 4);

        -- 12 dígitos: 556286032824 → +55 (56) 8603-2824
        WHEN length(v_clean_phone) = 12 THEN
            v_lead_name := '+55 (' || substring(v_clean_phone, 3, 2) || ') ' ||
                          substring(v_clean_phone, 5, 4) || '-' ||
                          substring(v_clean_phone, 9, 4);

        -- 11 dígitos: 62986032824 → +55 (62) 9860-32824
        WHEN length(v_clean_phone) = 11 THEN
            v_lead_name := '+55 (' || substring(v_clean_phone, 1, 2) || ') ' ||
                          substring(v_clean_phone, 3, 4) || '-' ||
                          substring(v_clean_phone, 7, 4);

        -- 10 dígitos: 6286032824 → +55 (62) 9603-2824 (adicionar 9)
        WHEN length(v_clean_phone) = 10 THEN
            v_lead_name := '+55 (' || substring(v_clean_phone, 1, 2) || ') ' ||
                          '9' || substring(v_clean_phone, 3, 3) || '-' ||
                          substring(v_clean_phone, 6, 4);

        -- Outros casos: usar apenas números com +55
        ELSE
            v_lead_name := '+55 ' || v_clean_phone;
    END CASE;

    -- 🎯 TEXTO ESPECÍFICO POR TIPO DE MÍDIA (AI pode ter mensagens vazias para áudio PTT)
    CASE
        WHEN p_media_type = 'text' THEN
            v_message_text := p_message_text;
        WHEN p_media_type = 'audio' AND (p_message_text IS NULL OR p_message_text = '') THEN
            v_message_text := '🎵 Áudio';  -- PTT do AI
        WHEN p_media_type = 'image' THEN
            v_message_text := COALESCE(p_message_text, '📷 Imagem');
        WHEN p_media_type = 'video' THEN
            v_message_text := COALESCE(p_message_text, '🎥 Vídeo');
        WHEN p_media_type = 'audio' THEN
            v_message_text := COALESCE(p_message_text, '🎵 Áudio');
        WHEN p_media_type = 'document' THEN
            v_message_text := COALESCE(p_message_text, '📄 Documento');
        WHEN p_media_type = 'sticker' THEN
            v_message_text := COALESCE(p_message_text, '😊 Sticker');
        ELSE
            v_message_text := COALESCE(p_message_text, '📎 Mídia');
    END CASE;

    -- Converter para enum
    v_media_type_enum := p_media_type::media_type;
    v_message_id := gen_random_uuid();

    -- 📱 CRIAR/ATUALIZAR LEAD (preservar dados existentes)
    INSERT INTO public.leads (
        phone,
        name,
        created_by_user_id,
        import_source,
        profile_pic_url
    )
    VALUES (
        p_phone,          -- ✅ Telefone limpo: 5562986032824
        v_lead_name,      -- ✅ Nome formatado: +55 (62) 8603-2824
        p_vps_instance_id,
        'ai',
        p_profile_pic_url
    )
    ON CONFLICT (phone, created_by_user_id)
    DO UPDATE SET
        -- 🔄 ATUALIZAR nome apenas se for formato de número (+55 XXXXX)
        name = CASE
            WHEN leads.name ~ '^\+55 [0-9]+$' THEN EXCLUDED.name  -- Se é só número, atualizar
            ELSE leads.name  -- Se é nome personalizado, preservar
        END,
        -- ✅ ATUALIZAR dados da última mensagem
        last_message = v_message_text,  -- ✅ Salvar texto da mensagem
        last_message_time = now(),
        profile_pic_url = COALESCE(EXCLUDED.profile_pic_url, leads.profile_pic_url),
        updated_at = now()
        -- 🔒 PRESERVAR: stage_id, tags (manter para leads existentes)
    RETURNING id INTO v_lead_id;

    -- 📝 INSERIR MENSAGEM (SEM media_url por enquanto)
    INSERT INTO public.messages (
        id,
        text,
        from_me,
        media_type,
        created_by_user_id,
        import_source,
        external_message_id,
        media_url,          -- ✅ NULL por enquanto (edge vai atualizar)
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
        'ai',
        p_external_message_id,
        NULL,               -- ✅ Edge vai atualizar depois
        v_lead_id,
        p_whatsapp_number_id,
        p_source_edge
    );

    -- 🎯 SE TEM MÍDIA: Chamar edge para upload + update URL
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
        v_file_path := format('ai/%s/%s/msg_%s_%s.%s',
            p_media_type,
            to_char(now(), 'YYYY-MM-DD'),
            LEFT(v_message_id::text, 8),
            extract(epoch from now())::bigint,
            v_extension
        );

        -- 📤 CHAMAR EDGE (sem aguardar resposta - assíncrono)
        BEGIN
            SELECT net.http_post(
                'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/ai_storage_upload',
                jsonb_build_object(
                    'message_id', v_message_id,    -- ✅ Passar ID da mensagem
                    'file_path', v_file_path,
                    'base64_data', p_base64_data,
                    'content_type', p_mime_type
                ),
                '{"Content-Type": "application/json"}'::jsonb
            ) INTO v_request_id;

            RAISE NOTICE '📤 Upload AI iniciado para message_id: % (request_id: %)', v_message_id, v_request_id;

        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '⚠️ Erro ao iniciar upload AI: %', SQLERRM;
                -- Não falhar a mensagem por causa do upload
        END;
    END IF;

    -- ✅ RETORNAR SUCESSO IMEDIATO (não aguarda upload)
    RETURN jsonb_build_object(
        'success', true,
        'message_id', v_message_id,
        'lead_id', v_lead_id,
        'phone_stored', p_phone,
        'name_formatted', v_lead_name,
        'upload_initiated', p_media_type != 'text',
        'processing_mode', 'optimized_async_ai',
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