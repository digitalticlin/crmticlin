-- 🚨 V6 TABLES: Corrigir nomes de tabelas e colunas
-- Erro V5: usava instance_funnels, funnel_stages, current_stage_id (não existem)
-- Correto: funnels, kanban_stages, kanban_stage_id

-- 1️⃣ DROPAR TUDO relacionado à função (CASCADE)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT oid::regprocedure as func_sig
        FROM pg_proc
        WHERE proname = 'save_received_message_webhook'
          AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_sig || ' CASCADE';
        RAISE NOTICE '✅ Dropped: %', r.func_sig;
    END LOOP;
END $$;

-- 2️⃣ Garantir que helper function existe
DROP FUNCTION IF EXISTS public.get_file_extension_from_mime CASCADE;

CREATE OR REPLACE FUNCTION public.get_file_extension_from_mime(p_mime_type text, p_media_type text)
RETURNS text LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_mime text;
BEGIN
    v_mime := LOWER(TRIM(COALESCE(p_mime_type, '')));

    RETURN CASE
        -- 🎵 AUDIO
        WHEN v_mime LIKE 'audio/ogg%' THEN 'ogg'
        WHEN v_mime IN ('audio/mpeg', 'audio/mp3') THEN 'mp3'
        WHEN v_mime = 'audio/wav' THEN 'wav'
        WHEN v_mime = 'audio/aac' THEN 'aac'
        WHEN v_mime = 'audio/m4a' THEN 'm4a'
        WHEN v_mime = 'audio/webm' THEN 'webm'

        -- 🖼️ IMAGE
        WHEN v_mime IN ('image/jpeg', 'image/jpg') THEN 'jpg'
        WHEN v_mime = 'image/png' THEN 'png'
        WHEN v_mime = 'image/gif' THEN 'gif'
        WHEN v_mime = 'image/webp' THEN 'webp'
        WHEN v_mime = 'image/svg+xml' THEN 'svg'

        -- 🎬 VIDEO
        WHEN v_mime = 'video/mp4' THEN 'mp4'
        WHEN v_mime = 'video/webm' THEN 'webm'
        WHEN v_mime = 'video/quicktime' THEN 'mov'
        WHEN v_mime = 'video/x-msvideo' THEN 'avi'

        -- 📄 DOCUMENT
        WHEN v_mime = 'application/pdf' THEN 'pdf'
        WHEN v_mime LIKE 'application/vnd.ms-excel%' THEN 'xls'
        WHEN v_mime LIKE 'application/vnd.openxmlformats-officedocument.spreadsheetml%' THEN 'xlsx'
        WHEN v_mime LIKE 'application/vnd.ms-powerpoint%' THEN 'ppt'
        WHEN v_mime LIKE 'application/vnd.openxmlformats-officedocument.presentationml%' THEN 'pptx'
        WHEN v_mime LIKE 'application/msword%' THEN 'doc'
        WHEN v_mime LIKE 'application/vnd.openxmlformats-officedocument.wordprocessingml%' THEN 'docx'
        WHEN v_mime = 'text/plain' THEN 'txt'
        WHEN v_mime = 'application/zip' THEN 'zip'
        WHEN v_mime = 'application/x-rar-compressed' THEN 'rar'

        -- 🎨 DESIGN
        WHEN v_mime = 'application/postscript' THEN 'ai'
        WHEN v_mime = 'image/vnd.adobe.photoshop' THEN 'psd'

        -- 🔄 FALLBACK: Extrair da segunda parte do MIME (ex: audio/mpeg → mpeg)
        ELSE COALESCE(
            NULLIF(split_part(v_mime, '/', 2), ''),
            -- Se não tiver MIME, usar media_type
            CASE LOWER(TRIM(COALESCE(p_media_type, '')))
                WHEN 'audio' THEN 'ogg'  -- ⚠️ Default para áudio é OGG (WhatsApp)
                WHEN 'image' THEN 'jpg'
                WHEN 'video' THEN 'mp4'
                WHEN 'document' THEN 'pdf'
                WHEN 'sticker' THEN 'webp'
                ELSE 'bin'
            END
        )
    END;
END;
$$;

-- 3️⃣ Recriar RPC com TABELAS E COLUNAS CORRETAS
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
    p_instance_funnel_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_instance_id uuid;
    v_user_id uuid;
    v_lead_id uuid;
    v_clean_phone text;
    v_formatted_name text;
    v_message_id uuid;
    v_funnel_id uuid;
    v_first_stage_id uuid;
    v_owner_id uuid;
    v_media_type_enum media_type;
    v_should_call_edge boolean := false;
    v_edge_url text;
    v_service_role_key text;
    v_edge_result jsonb;
    v_file_extension text;
    v_message_text text;
BEGIN
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

    -- 🔍 BUSCAR INSTÂNCIA E USUÁRIO (TABELA CORRETA: whatsapp_instances)
    SELECT id, created_by_user_id INTO v_instance_id, v_user_id
    FROM public.whatsapp_instances
    WHERE instance_name = p_vps_instance_id OR id = p_whatsapp_number_id
    LIMIT 1;

    IF v_instance_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Instance not found');
    END IF;

    -- 🧹 Limpar telefone (apenas números)
    v_clean_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');

    -- 📞 Formatar nome (SEMPRE usar telefone formatado, nunca contact_name)
    IF length(v_clean_phone) = 13 AND v_clean_phone ~ '^55\d{11}' THEN
        v_formatted_name := '+55 (' || substring(v_clean_phone from 3 for 2) || ') ' || substring(v_clean_phone from 5 for 5) || '-' || substring(v_clean_phone from 10 for 4);
    ELSIF length(v_clean_phone) = 12 AND v_clean_phone ~ '^55\d{10}' THEN
        v_formatted_name := '+55 (' || substring(v_clean_phone from 3 for 2) || ') ' || substring(v_clean_phone from 5 for 4) || '-' || substring(v_clean_phone from 9 for 4);
    ELSE
        v_formatted_name := '+' || v_clean_phone;
    END IF;

    -- Converter media_type para enum
    v_media_type_enum := CASE
        WHEN p_media_type IN ('image', 'video', 'audio', 'document', 'text') THEN p_media_type::media_type
        ELSE 'text'::media_type
    END;

    -- 🔍 BUSCAR OU CRIAR LEAD (lookup por created_by_user_id)
    SELECT id INTO v_lead_id
    FROM public.leads
    WHERE phone = v_clean_phone
      AND created_by_user_id = v_user_id
    LIMIT 1;

    IF v_lead_id IS NULL THEN
        -- ✅ Owner é sempre o dono da instância
        v_owner_id := v_user_id;

        -- ✅ BUSCAR FUNIL (tabela correta: funnels)
        SELECT id INTO v_funnel_id
        FROM public.funnels
        WHERE created_by_user_id = v_user_id
        ORDER BY created_at ASC
        LIMIT 1;

        IF v_funnel_id IS NOT NULL THEN
            -- ✅ BUSCAR PRIMEIRO STAGE (tabela correta: kanban_stages, coluna: order_position)
            SELECT id INTO v_first_stage_id
            FROM public.kanban_stages
            WHERE funnel_id = v_funnel_id
            ORDER BY order_position ASC
            LIMIT 1;
        END IF;

        -- ✅ INSERIR LEAD (colunas corretas)
        INSERT INTO public.leads (
            name,                   -- ✅ Telefone formatado: +55 (11) 98765-4321
            phone,                  -- ✅ Telefone limpo: 5511987654321
            profile_pic_url,
            whatsapp_number_id,
            created_by_user_id,
            import_source,
            funnel_id,
            kanban_stage_id,        -- ✅ CORRETO (não current_stage_id)
            owner_id,
            country,                -- ✅ Adicionar campo country
            last_message,
            last_message_time
        ) VALUES (
            v_formatted_name,       -- ✅ Nome = telefone formatado
            v_clean_phone,          -- ✅ Phone = números apenas
            p_profile_pic_url,      -- 📸 Base64 da foto de perfil
            v_instance_id,
            v_user_id,
            'webhook',
            v_funnel_id,
            v_first_stage_id,
            v_owner_id,
            NULL,                   -- country
            v_message_text,
            NOW()
        )
        RETURNING id INTO v_lead_id;
    ELSE
        -- Atualizar lead existente
        UPDATE public.leads
        SET
            last_message = v_message_text,
            last_message_time = NOW(),
            -- 📸 Só atualiza profile_pic se vier nova (não NULL) E for diferente da atual
            profile_pic_url = CASE
                WHEN p_profile_pic_url IS NOT NULL
                     AND (profile_pic_url IS NULL OR LEFT(p_profile_pic_url, 100) != LEFT(profile_pic_url, 100))
                THEN p_profile_pic_url
                ELSE profile_pic_url
            END
        WHERE id = v_lead_id;
    END IF;

    -- Inserir mensagem (media_url NULL - será preenchida pela edge)
    INSERT INTO public.messages (text, from_me, created_by_user_id, lead_id, media_type, media_url, external_message_id, whatsapp_number_id, source_edge, import_source, timestamp, status)
    VALUES (v_message_text, p_from_me, v_user_id, v_lead_id, v_media_type_enum, NULL, p_external_message_id, v_instance_id, p_source_edge, 'webhook', NOW(), CASE WHEN p_from_me THEN 'sent'::message_status ELSE 'received'::message_status END)
    RETURNING id INTO v_message_id;

    -- ⚠️ CALCULAR EXTENSÃO **ANTES** DE CHAMAR EDGE
    v_should_call_edge := (p_media_type != 'text' AND p_base64_data IS NOT NULL);

    IF v_should_call_edge THEN
        -- 🎯 USAR HELPER FUNCTION
        v_file_extension := get_file_extension_from_mime(p_mime_type, p_media_type);

        -- Chamar edge de upload (comentado - upload é feito pelo webhook diretamente)
        -- O webhook chama webhook_storage_upload com extensão correta
    ELSE
        v_file_extension := NULL;
    END IF;

    RETURN jsonb_build_object('success', true, 'message_id', v_message_id, 'lead_id', v_lead_id, 'file_extension', v_file_extension);
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ✅ Log de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ V6 TABLES aplicada com tabelas e colunas corretas!';
    RAISE NOTICE '📊 Tabelas: whatsapp_instances, funnels, kanban_stages, leads';
    RAISE NOTICE '📊 Colunas: kanban_stage_id (não current_stage_id)';
    RAISE NOTICE '📊 Lookup lead: created_by_user_id (não whatsapp_number_id)';
    RAISE NOTICE '📞 Nome lead: telefone formatado (+55 11 98765-4321)';
    RAISE NOTICE '📞 Phone lead: números apenas (5511987654321)';
END $$;
