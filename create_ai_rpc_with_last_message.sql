-- Criar RPC save_sent_message_from_ai com last_message corrigido
-- Padrão: app → ai_storage_upload edge function

CREATE OR REPLACE FUNCTION public.save_sent_message_from_ai(
    p_vps_instance_id uuid,
    p_phone text,
    p_message_text text,
    p_from_me boolean,
    p_media_type text,
    p_media_url text DEFAULT NULL::text,
    p_external_message_id text DEFAULT NULL::text,
    p_contact_name text DEFAULT NULL::text,
    p_profile_pic_url text DEFAULT NULL::text,
    p_base64_data text DEFAULT NULL::text,
    p_mime_type text DEFAULT NULL::text,
    p_file_name text DEFAULT NULL::text,
    p_whatsapp_number_id uuid DEFAULT NULL::uuid,
    p_source_edge text DEFAULT 'ai_messaging_service'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    v_user_id UUID;
    v_instance_id UUID;
BEGIN
    -- 📱 LIMPAR TELEFONE E FORMATAR NOME
    v_clean_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');

    -- 📱 NOME DO LEAD: Formato WhatsApp correto
    CASE
        -- 13 dígitos: 5562986032824 → +55 (62) 9860-3824
        WHEN length(v_clean_phone) = 13 THEN
            v_lead_name := '+55 (' || substring(v_clean_phone, 3, 2) || ') ' ||
                          substring(v_clean_phone, 5, 5) || '-' ||
                          substring(v_clean_phone, 9, 4);

        -- 12 dígitos: 556286032824 → +55 (62) 8603-2824
        WHEN length(v_clean_phone) = 12 THEN
            v_lead_name := '+55 (' || substring(v_clean_phone, 3, 2) || ') ' ||
                          substring(v_clean_phone, 5, 4) || '-' ||
                          substring(v_clean_phone, 9, 4);

        -- 11 dígitos: 62986032824 → +55 (62) 9860-3824
        WHEN length(v_clean_phone) = 11 THEN
            v_lead_name := '+55 (' || substring(v_clean_phone, 1, 2) || ') ' ||
                          substring(v_clean_phone, 3, 5) || '-' ||
                          substring(v_clean_phone, 7, 4);

        -- 10 dígitos: 6286032824 → +55 (62) 9603-2824
        WHEN length(v_clean_phone) = 10 THEN
            v_lead_name := '+55 (' || substring(v_clean_phone, 1, 2) || ') ' ||
                          '9' || substring(v_clean_phone, 3, 3) || '-' ||
                          substring(v_clean_phone, 6, 4);

        -- Outros casos: usar apenas números com +55
        ELSE
            v_lead_name := '+55 ' || v_clean_phone;
    END CASE;

    -- 🎯 TEXTO ESPECÍFICO POR TIPO DE MÍDIA
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

    -- ✅ USAR DIRETAMENTE OS IDs PASSADOS
    v_user_id := p_vps_instance_id;  -- p_vps_instance_id já é o created_by_user_id
    v_instance_id := p_whatsapp_number_id;  -- p_whatsapp_number_id já é o instance.id

    -- 📱 CRIAR/ATUALIZAR LEAD
    INSERT INTO public.leads (
        phone,
        name,
        created_by_user_id,
        import_source,
        profile_pic_url,
        whatsapp_number_id,  -- ✅ Nome correto da coluna
        last_message,        -- ✅ CORREÇÃO: definir última mensagem
        last_message_time    -- ✅ CORREÇÃO: definir timestamp
    )
    VALUES (
        v_clean_phone,
        v_lead_name,
        v_user_id,
        'ai',
        p_profile_pic_url,
        v_instance_id,       -- ✅ ID da instância WhatsApp
        v_message_text,      -- ✅ CORREÇÃO: primeira mensagem do lead
        NOW()                -- ✅ CORREÇÃO: timestamp da primeira mensagem
    )
    ON CONFLICT (phone, created_by_user_id)
    DO UPDATE SET
        -- 🔄 ATUALIZAR nome apenas se for formato de número
        name = CASE
            WHEN leads.name ~ '^\\+55 [0-9 ()-]+$' THEN EXCLUDED.name
            ELSE leads.name
        END,
        -- ✅ ATUALIZAR dados da última mensagem
        last_message = v_message_text,
        last_message_time = now(),
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
        whatsapp_number_id,
        source_edge
    )
    VALUES (
        v_message_id,
        v_message_text,
        p_from_me,
        v_media_type_enum,
        v_user_id,  -- ✅ Usar v_user_id correto
        'ai',
        p_external_message_id,
        NULL,  -- ✅ Edge vai atualizar depois
        v_lead_id,
        v_instance_id,  -- ✅ Usar v_instance_id
        p_source_edge
    );

    -- 🎯 SE TEM MÍDIA: Chamar edge para upload
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

        -- 📤 CHAMAR EDGE (sem aguardar resposta)
        BEGIN
            SELECT net.http_post(
                'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/ai_storage_upload',
                jsonb_build_object(
                    'message_id', v_message_id,
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
        END;
    END IF;

    -- ✅ RETORNAR SUCESSO IMEDIATO
    RETURN jsonb_build_object(
        'success', true,
        'message_id', v_message_id,
        'lead_id', v_lead_id,
        'phone_stored', v_clean_phone,
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
$function$;