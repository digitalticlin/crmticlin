-- ================================================================
-- 🔧 ATUALIZAR RPC WEBHOOK PARA USAR NOVO WORKER
-- ================================================================

-- 1. REMOVER FUNÇÃO ANTIGA COM CONFLITO
DROP FUNCTION IF EXISTS public.save_received_message_webhook CASCADE;

-- 2. CRIAR NOVA FUNÇÃO LIMPA
CREATE OR REPLACE FUNCTION public.save_received_message_webhook(
    p_vps_instance_id UUID,
    p_phone TEXT,
    p_message_text TEXT,
    p_from_me BOOLEAN,
    p_media_type TEXT,
    p_external_message_id TEXT,
    p_timestamp BIGINT,
    p_base64_data TEXT DEFAULT NULL,
    p_mime_type TEXT DEFAULT NULL,
    p_file_name TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_message_id UUID;
    v_lead_id UUID;
    v_funnel_id UUID := '712e7708-2299-4a00-9128-577c8f113ca4'::UUID;
    v_phone_clean TEXT;
    v_message_text TEXT;
    v_media_type_enum media_type;
    v_queue_result jsonb;
BEGIN
    -- Limpar telefone
    v_phone_clean := regexp_replace(p_phone, '[^0-9]', '', 'g');
    IF length(v_phone_clean) = 11 AND v_phone_clean ~ '^[0-9]{11}$' THEN
        v_phone_clean := '+55' || v_phone_clean;
    END IF;

    -- Preparar texto baseado no tipo de mídia
    CASE p_media_type
        WHEN 'text' THEN v_message_text := p_message_text;
        WHEN 'image' THEN v_message_text := '📷 Imagem';
        WHEN 'video' THEN v_message_text := '🎥 Vídeo';
        WHEN 'audio' THEN v_message_text := '🎵 Áudio';
        WHEN 'document' THEN v_message_text := '📄 Documento';
        WHEN 'sticker' THEN v_message_text := '😊 Sticker';
        ELSE v_message_text := '📎 Mídia';
    END CASE;

    -- Converter tipo para enum
    v_media_type_enum := p_media_type::media_type;

    -- Buscar ou criar lead
    SELECT id INTO v_lead_id
    FROM public.leads
    WHERE whatsapp_display_phone = v_phone_clean
    LIMIT 1;

    IF v_lead_id IS NULL THEN
        INSERT INTO public.leads (
            name, phone, whatsapp_display_phone, profile_pic_url,
            funnel_id, created_by_user_id
        )
        VALUES (
            'Lead ' || v_phone_clean,
            v_phone_clean,
            v_phone_clean,
            NULL,
            v_funnel_id,
            v_funnel_id
        )
        RETURNING id INTO v_lead_id;
    END IF;

    -- Inserir mensagem
    INSERT INTO public.messages (
        text, from_me, created_by_user_id, lead_id, media_type
    )
    VALUES (
        v_message_text,
        p_from_me,
        v_funnel_id,
        v_lead_id,
        v_media_type_enum
    )
    RETURNING id INTO v_message_id;

    -- 🎯 ENFILEIRAR PARA NOVO WORKER SE TEM MÍDIA
    IF p_media_type != 'text' AND (p_base64_data IS NOT NULL OR p_external_message_id IS NOT NULL) THEN
        -- Enfileirar na fila webhook_message_queue
        SELECT pgmq.send(
            'webhook_message_queue',
            jsonb_build_object(
                'message_id', v_message_id,
                'source', 'webhook',
                'message_data', jsonb_build_object(
                    'external_message_id', p_external_message_id,
                    'timestamp', p_timestamp
                ),
                'media_data', jsonb_build_object(
                    'media_type', p_media_type,
                    'base64_data', p_base64_data,
                    'mime_type', p_mime_type,
                    'file_name', p_file_name,
                    'media_url', NULL
                )
            )
        ) INTO v_queue_result;

        -- ✅ EXECUTAR NOVO WORKER AUTOMATICAMENTE
        PERFORM webhook_whatsapp_web_media_worker(1);

        RETURN jsonb_build_object(
            'data', jsonb_build_object(
                'success', true,
                'message_id', v_message_id,
                'lead_id', v_lead_id,
                'queued_for_processing', true,
                'worker_executed', true
            )
        );
    END IF;

    -- Retorno para mensagens de texto
    RETURN jsonb_build_object(
        'data', jsonb_build_object(
            'success', true,
            'message_id', v_message_id,
            'lead_id', v_lead_id,
            'queued_for_processing', false
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'data', jsonb_build_object(
                'success', false,
                'error', SQLERRM
            )
        );
END;
$$;

COMMENT ON FUNCTION public.save_received_message_webhook IS 'RPC ATUALIZADA - Usa novo worker webhook_whatsapp_web_media_worker';

-- ================================================================
-- ✅ TESTAR RPC ATUALIZADA
-- ================================================================

-- Testar com dados simulados
SELECT save_received_message_webhook(
    '712e7708-2299-4a00-9128-577c8f113ca4'::UUID,
    '+5511999999999',
    'Teste de imagem',
    false,
    'image',
    'teste_' || extract(epoch from now())::text,
    extract(epoch from now())::bigint,
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...',
    'image/jpeg',
    'teste.jpg'
) as resultado_rpc_atualizada;