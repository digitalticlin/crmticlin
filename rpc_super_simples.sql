-- ================================================================
-- 🚀 RPC SUPER SIMPLES - SÓ O ESSENCIAL
-- ================================================================

-- Remover função problemática
DROP FUNCTION IF EXISTS public.save_received_message_webhook CASCADE;

-- RPC mínima que funciona
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
    v_message_text TEXT;
    v_media_type_enum media_type;
BEGIN
    -- Texto da mensagem
    CASE p_media_type
        WHEN 'text' THEN v_message_text := p_message_text;
        WHEN 'image' THEN v_message_text := '📷 Imagem';
        WHEN 'video' THEN v_message_text := '🎥 Vídeo';
        WHEN 'audio' THEN v_message_text := '🎵 Áudio';
        WHEN 'document' THEN v_message_text := '📄 Documento';
        WHEN 'sticker' THEN v_message_text := '😊 Sticker';
        ELSE v_message_text := '📎 Mídia';
    END CASE;

    -- Converter enum
    v_media_type_enum := p_media_type::media_type;

    -- 📝 INSERIR MENSAGEM APENAS COM COLUNAS OBRIGATÓRIAS
    INSERT INTO public.messages (
        text, from_me, media_type, created_by_user_id
    )
    VALUES (
        v_message_text,
        p_from_me,
        v_media_type_enum,
        p_vps_instance_id
    )
    RETURNING id INTO v_message_id;

    -- 🎯 SE TEM MÍDIA → ENFILEIRAR E PROCESSAR
    IF p_media_type != 'text' AND p_base64_data IS NOT NULL THEN
        -- Enfileirar
        PERFORM pgmq.send(
            'webhook_message_queue',
            jsonb_build_object(
                'message_id', v_message_id,
                'source', 'webhook',
                'media_data', jsonb_build_object(
                    'media_type', p_media_type,
                    'base64_data', p_base64_data,
                    'mime_type', p_mime_type,
                    'file_name', p_file_name
                )
            )
        );

        -- ✅ EXECUTAR WORKER IMEDIATAMENTE
        PERFORM webhook_whatsapp_web_media_worker(1);
    END IF;

    RETURN jsonb_build_object(
        'data', jsonb_build_object(
            'success', true,
            'message_id', v_message_id
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

-- ================================================================
-- ✅ TESTAR RPC MÍNIMA
-- ================================================================

SELECT save_received_message_webhook(
    '712e7708-2299-4a00-9128-577c8f113ca4'::UUID,
    '+5511999999999',
    'Teste',
    false,
    'image',
    'teste_123',
    1234567890,
    'fake_base64_data_here',
    'image/jpeg',
    'teste.jpg'
) as teste_rpc_simples;