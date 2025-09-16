-- FIX 1: Corrigir RPC save_received_message_webhook para não sobrescrever mensagens de texto
-- Problema: Mensagens de texto estão sendo salvas como "📎 Mídia"

CREATE OR REPLACE FUNCTION public.save_received_message_webhook(
    p_vps_instance_id text,
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
    p_source_edge text DEFAULT 'webhook_whatsapp_web'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_message_id UUID;
    v_lead_id UUID;
    v_instance_id UUID;
    v_user_id UUID;
    v_formatted_phone TEXT;
    v_clean_phone TEXT;
    v_message_text TEXT;
    v_media_type_enum media_type;
    v_edge_result jsonb;
    v_formatted_name TEXT;
    v_first_stage_id UUID;  -- ✅ Para buscar primeiro stage do funil
    v_funnel_id UUID;       -- ✅ ID do funil padrão da instância
    v_owner_id UUID;        -- ✅ Responsável padrão (criador da instância)
    v_country TEXT;         -- ✅ País baseado no código do telefone
BEGIN
    -- 🧹 LIMPAR TELEFONE - MANTER APENAS NÚMEROS
    v_clean_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');

    -- 📞 FORMATAR NOME DO LEAD NO PADRÃO +55 (XX) XXXX-XXXX ou +55 (XX) XXXXX-XXXX
    IF length(v_clean_phone) = 13 AND v_clean_phone ~ '^55\d{11}$' THEN
        -- Formato: 5562986032824 -> +55 (62) 98603-2824
        v_formatted_name := '+55 (' || substring(v_clean_phone from 3 for 2) || ') ' ||
                           substring(v_clean_phone from 5 for 5) || '-' ||
                           substring(v_clean_phone from 10 for 4);
    ELSIF length(v_clean_phone) = 12 AND v_clean_phone ~ '^55\d{10}$' THEN
        -- Formato: 556232323232 -> +55 (62) 3232-3232
        v_formatted_name := '+55 (' || substring(v_clean_phone from 3 for 2) || ') ' ||
                           substring(v_clean_phone from 5 for 4) || '-' ||
                           substring(v_clean_phone from 9 for 4);
    ELSE
        -- Fallback para outros formatos
        v_formatted_name := '+' || v_clean_phone;
    END IF;

    -- 🎯 CORREÇÃO: Definir texto da mensagem ANTES de converter para enum
    CASE p_media_type
        WHEN 'text' THEN
            -- ✅ MENSAGEM DE TEXTO - USAR O TEXTO ORIGINAL SEMPRE
            v_message_text := COALESCE(p_message_text, '');
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
            -- Para tipos desconhecidos, preservar o texto se for tipo 'text'
            v_message_text := CASE
                WHEN COALESCE(p_media_type, 'text') = 'text' THEN COALESCE(p_message_text, '')
                ELSE '📎 Mídia'
            END;
    END CASE;

    -- Converter tipo para enum
    v_media_type_enum := COALESCE(p_media_type, 'text')::media_type;

    -- 🔍 BUSCAR DADOS DA INSTÂNCIA PELO NOME (p_vps_instance_id contém o nome)
    SELECT id, created_by_user_id INTO v_instance_id, v_user_id
    FROM public.whatsapp_instances
    WHERE instance_name = p_vps_instance_id;

    IF v_user_id IS NULL OR v_instance_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Instância não encontrada pelo nome: ' || COALESCE(p_vps_instance_id::text, 'NULL')
        );
    END IF;

    -- 🔍 BUSCAR OU CRIAR LEAD
    SELECT id INTO v_lead_id
    FROM public.leads
    WHERE phone = v_clean_phone
      AND created_by_user_id = v_user_id  -- ✅ MULTITENANT: buscar lead do usuário correto
    LIMIT 1;

    IF v_lead_id IS NULL THEN
        -- 🎯 DEFINIR OWNER PADRÃO (criador da instância)
        v_owner_id := v_user_id;

        -- 🎯 BUSCAR FUNIL PADRÃO DO USUÁRIO (primeiro criado)
        SELECT id INTO v_funnel_id
        FROM public.funnels
        WHERE created_by_user_id = v_user_id
        ORDER BY created_at ASC
        LIMIT 1;

        -- 🎯 BUSCAR PRIMEIRO STAGE DO FUNIL
        IF v_funnel_id IS NOT NULL THEN
            SELECT id INTO v_first_stage_id
            FROM public.kanban_stages
            WHERE funnel_id = v_funnel_id
            ORDER BY stage_order ASC
            LIMIT 1;
        END IF;

        -- 🎯 CRIAR LEAD COM DADOS COMPLETOS
        INSERT INTO public.leads (
            name,
            phone,
            profile_pic_url,
            whatsapp_number_id,  -- ✅ Campo correto
            created_by_user_id,
            import_source,
            funnel_id,           -- ✅ Funil padrão
            kanban_stage_id,     -- ✅ Campo correto (não stage_id)
            owner_id,            -- ✅ Responsável padrão
            country,             -- ✅ País padrão
            last_message,        -- ✅ CORREÇÃO: definir última mensagem
            last_message_time    -- ✅ CORREÇÃO: definir timestamp
        ) VALUES (
            v_formatted_name,
            v_clean_phone,
            p_profile_pic_url,
            v_instance_id,
            v_user_id,
            'webhook',
            v_funnel_id,         -- ✅ Pode ser NULL
            v_first_stage_id,    -- ✅ Primeiro stage (pode ser NULL)
            v_owner_id,          -- ✅ Criador da instância
            NULL,                -- ✅ País NULL (pode ser internacional)
            v_message_text,      -- ✅ CORREÇÃO: primeira mensagem do lead
            NOW()                -- ✅ CORREÇÃO: timestamp da primeira mensagem
        )
        RETURNING id INTO v_lead_id;
    ELSE
        -- 🔄 ATUALIZAR APENAS DADOS DA ÚLTIMA MENSAGEM (NÃO ALTERAR STAGE)
        UPDATE public.leads
        SET
            last_message = v_message_text,
            last_message_time = NOW(),
            profile_pic_url = COALESCE(p_profile_pic_url, profile_pic_url),
            updated_at = NOW()
            -- ✅ NÃO alterar stage_id para leads existentes
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
        source_edge
    ) VALUES (
        v_message_text,  -- ✅ Usar o texto processado corretamente
        p_from_me,
        v_user_id,
        v_lead_id,
        v_media_type_enum,
        NULL,
        p_external_message_id,
        p_whatsapp_number_id,  -- ✅ CORREÇÃO: usar parâmetro recebido, não v_instance_id
        p_source_edge
    )
    RETURNING id INTO v_message_id;

    -- 🚀 SE TEM MÍDIA, CHAMAR EDGE DE UPLOAD
    IF p_media_type != 'text' AND p_base64_data IS NOT NULL THEN
        BEGIN
            -- 🔄 CHAMAR EDGE webhook_storage_upload
            SELECT net.http_post(
                'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_storage_upload',
                jsonb_build_object(
                    'message_id', v_message_id,
                    'file_path', 'webhook/' || v_instance_id || '/' || v_message_id || '.' ||
                                 COALESCE(split_part(p_mime_type, '/', 2), 'bin'),
                    'base64_data', p_base64_data,
                    'content_type', p_mime_type
                ),
                '{"Content-Type": "application/json"}'::jsonb
            ) INTO v_edge_result;

            -- Log da chamada edge
            RAISE NOTICE 'Edge webhook_storage_upload chamada para message_id: %', v_message_id;
        EXCEPTION WHEN OTHERS THEN
            -- Log erro mas não falha a operação
            RAISE NOTICE 'Erro ao chamar edge upload: %', SQLERRM;
        END;
    END IF;

    -- ✅ RETORNO DE SUCESSO
    RETURN jsonb_build_object(
        'success', true,
        'message_id', v_message_id,
        'lead_id', v_lead_id,
        'lead_name', v_formatted_name,
        'media_processing', (p_media_type != 'text' AND p_base64_data IS NOT NULL)
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$function$;