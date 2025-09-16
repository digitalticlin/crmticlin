-- ================================================================
-- ATUALIZAR SUPORTE A STICKER NAS RPCs APP E AI
-- ================================================================

-- 🎯 ADICIONAR SUPORTE A STICKER NAS FUNÇÕES save_sent_message_from_app E save_sent_message_from_ai

-- ================================================================
-- 1️⃣ ATUALIZAR RPC APP - ADICIONAR STICKER
-- ================================================================

CREATE OR REPLACE FUNCTION public.save_sent_message_from_app(
    p_vps_instance_id text,
    p_phone text,
    p_message_text text,
    p_from_me boolean DEFAULT true,
    p_media_type text DEFAULT 'text',
    p_media_url text DEFAULT NULL,
    p_external_message_id text DEFAULT NULL,
    p_contact_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_instance_id UUID;
    v_user_id UUID;
    v_lead_id UUID;
    v_message_id UUID;
    v_clean_phone text;
    v_has_media BOOLEAN := FALSE;
    v_media_emoji text;
BEGIN
    RAISE NOTICE '[save_sent_message_from_app] 🚀 Processando mensagem enviada pelo app: %', p_vps_instance_id;

    -- ETAPA 1: Buscar instância
    SELECT id, created_by_user_id 
    INTO v_instance_id, v_user_id
    FROM public.whatsapp_instances 
    WHERE vps_instance_id = p_vps_instance_id;
    
    IF v_instance_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Instance not found', 'source', 'app');
    END IF;

    -- ETAPA 2: Limpar telefone
    v_clean_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');

    -- ETAPA 3: Buscar lead
    SELECT id INTO v_lead_id
    FROM public.leads 
    WHERE phone = v_clean_phone 
    AND created_by_user_id = v_user_id;

    -- Determinar emoji para mídia - INCLUINDO STICKER
    IF p_media_type != 'text' THEN
        v_has_media := TRUE;
        v_media_emoji := CASE p_media_type
            WHEN 'image' THEN '📷 Imagem'
            WHEN 'video' THEN '🎥 Vídeo'
            WHEN 'audio' THEN '🎵 Áudio'
            WHEN 'document' THEN '📄 Documento'
            WHEN 'sticker' THEN '😊 Sticker'
            WHEN 'voice' THEN '🎤 Áudio'
            WHEN 'ptt' THEN '🎤 Áudio'
            ELSE '📎 Mídia'
        END;
    END IF;

    -- ETAPA 4: Inserir mensagem
    INSERT INTO public.messages (
        lead_id, whatsapp_number_id, text, from_me, timestamp, status,
        created_by_user_id, media_type, media_url, import_source, external_message_id
    )
    VALUES (
        v_lead_id, v_instance_id,
        CASE 
            WHEN p_message_text IS NOT NULL AND p_message_text != '' THEN p_message_text
            WHEN v_has_media THEN v_media_emoji
            ELSE 'Mensagem'
        END,
        p_from_me, now(), 'sent'::message_status, v_user_id,
        COALESCE(p_media_type::media_type, 'text'::media_type),
        NULL, -- Será preenchida pelo worker
        'app', p_external_message_id
    )
    RETURNING id INTO v_message_id;

    -- ETAPA 5: Enfileirar se há mídia
    IF v_has_media AND p_media_url IS NOT NULL THEN
        PERFORM pgmq.send('app_message_queue', jsonb_build_object(
            'action', 'process_media',
            'source', 'app',
            'priority', 'normal',
            'message_id', v_message_id,
            'media_data', jsonb_build_object(
                'media_type', p_media_type,
                'media_url', p_media_url
            ),
            'metadata', jsonb_build_object(
                'retry_count', 0,
                'created_at', now()
            )
        ));
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'source', 'app',
        'data', jsonb_build_object(
            'message_id', v_message_id,
            'lead_id', v_lead_id,
            'has_media', v_has_media,
            'method', 'app_isolated'
        )
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'source', 'app', 'error', SQLERRM);
END;
$$;

-- ================================================================
-- 2️⃣ ATUALIZAR RPC AI - ADICIONAR STICKER
-- ================================================================

CREATE OR REPLACE FUNCTION public.save_sent_message_from_ai(
    p_vps_instance_id text,
    p_phone text,
    p_message_text text,
    p_from_me boolean DEFAULT true,
    p_media_type text DEFAULT 'text',
    p_media_url text DEFAULT NULL,
    p_external_message_id text DEFAULT NULL,
    p_contact_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_instance_id UUID;
    v_user_id UUID;
    v_lead_id UUID;
    v_message_id UUID;
    v_clean_phone text;
    v_has_media BOOLEAN := FALSE;
    v_media_emoji text;
BEGIN
    RAISE NOTICE '[save_sent_message_from_ai] 🤖 Processando mensagem do AI/N8N: %', p_vps_instance_id;

    -- ETAPA 1: Buscar instância
    SELECT id, created_by_user_id 
    INTO v_instance_id, v_user_id
    FROM public.whatsapp_instances 
    WHERE vps_instance_id = p_vps_instance_id;
    
    IF v_instance_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Instance not found', 'source', 'ai');
    END IF;

    -- ETAPA 2: Limpar telefone
    v_clean_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');

    -- ETAPA 3: Buscar lead
    SELECT id INTO v_lead_id
    FROM public.leads 
    WHERE phone = v_clean_phone 
    AND created_by_user_id = v_user_id;

    -- Determinar emoji para mídia - INCLUINDO STICKER
    IF p_media_type != 'text' THEN
        v_has_media := TRUE;
        v_media_emoji := CASE p_media_type
            WHEN 'image' THEN '📷 Imagem'
            WHEN 'video' THEN '🎥 Vídeo'
            WHEN 'audio' THEN '🎵 Áudio'
            WHEN 'document' THEN '📄 Documento'
            WHEN 'sticker' THEN '😊 Sticker'
            WHEN 'voice' THEN '🎤 Áudio'
            WHEN 'ptt' THEN '🎤 Áudio'
            ELSE '📎 Mídia'
        END;
    END IF;

    -- ETAPA 4: Inserir mensagem COM FLAG AI
    INSERT INTO public.messages (
        lead_id, whatsapp_number_id, text, from_me, timestamp, status,
        created_by_user_id, media_type, media_url, import_source, 
        external_message_id, ai_description
    )
    VALUES (
        v_lead_id, v_instance_id,
        CASE 
            WHEN p_message_text IS NOT NULL AND p_message_text != '' THEN p_message_text
            WHEN v_has_media THEN v_media_emoji
            ELSE 'Mensagem AI'
        END,
        p_from_me, now(), 'sent'::message_status, v_user_id,
        COALESCE(p_media_type::media_type, 'text'::media_type),
        NULL, -- Será preenchida pelo worker
        'ai', p_external_message_id,
        'AI Generated Message' -- FLAG para identificar mensagens AI
    )
    RETURNING id INTO v_message_id;

    -- ETAPA 5: Enfileirar se há mídia
    IF v_has_media AND p_media_url IS NOT NULL THEN
        PERFORM pgmq.send('ai_message_queue', jsonb_build_object(
            'action', 'process_media',
            'source', 'ai',
            'priority', 'normal',
            'message_id', v_message_id,
            'media_data', jsonb_build_object(
                'media_type', p_media_type,
                'media_url', p_media_url
            ),
            'metadata', jsonb_build_object(
                'retry_count', 0,
                'created_at', now()
            )
        ));
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'source', 'ai',
        'data', jsonb_build_object(
            'message_id', v_message_id,
            'lead_id', v_lead_id,
            'has_media', v_has_media,
            'ai_flag_set', true,
            'method', 'ai_isolated'
        )
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'source', 'ai', 'error', SQLERRM);
END;
$$;

-- ================================================================
-- ✅ CONFIRMAR SUPORTE STICKER EM TODAS AS RPCS
-- ================================================================

SELECT 
    '✅ STICKER SUPPORT ATUALIZADO' as resultado,
    'Todas as RPCs agora suportam sticker' as detalhes,
    jsonb_build_object(
        'webhook_rpc', 'save_received_message_webhook - ✅ Já tinha suporte',
        'app_rpc', 'save_sent_message_from_app - ✅ Adicionado',
        'ai_rpc', 'save_sent_message_from_ai - ✅ Adicionado',
        'emoji_sticker', '😊 Sticker',
        'processamento', 'Mesmo formato que outras mídias'
    ) as suporte_completo;