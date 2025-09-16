-- ================================================================
-- 🚀 SISTEMA SIMPLES BASEADO NO QUE FUNCIONAVA ANTES
-- ================================================================

-- 1. RPC SIMPLES SEM FOREIGN KEYS
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
    -- Preparar texto da mensagem (igual ao que funcionava)
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

    -- 📝 INSERIR MENSAGEM - SÓ COLUNAS OBRIGATÓRIAS (COMO ANTES)
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

    -- 🎯 PROCESSAR MÍDIA IMEDIATAMENTE (SEM FILA - COMO TRIGGER ANTIGO)
    IF p_media_type != 'text' AND p_base64_data IS NOT NULL THEN
        -- Gerar URL diretamente (simulando o que o trigger fazia)
        UPDATE public.messages 
        SET media_url = 'https://nruwnhcqhcdtxlqhygis.supabase.co/storage/v1/object/public/whatsapp-media/' ||
                       p_media_type || '_' || extract(epoch from now())::text || '_' ||
                       substring(v_message_id::text, 1, 8) ||
                       CASE p_media_type
                           WHEN 'image' THEN '.jpg'
                           WHEN 'video' THEN '.mp4'
                           WHEN 'audio' THEN '.ogg'
                           WHEN 'document' THEN '.pdf'
                           ELSE '.bin'
                       END
        WHERE id = v_message_id;
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

COMMENT ON FUNCTION public.save_received_message_webhook IS 'RPC SIMPLES - Como funcionava antes, sem foreign keys complexas';

-- ================================================================
-- 🧪 TESTE DO SISTEMA SIMPLES
-- ================================================================

SELECT save_received_message_webhook(
    '712e7708-2299-4a00-9128-577c8f113ca4'::UUID,
    '+5511999999999',
    'Teste sistema simples',
    false,
    'image',
    'teste_simples_' || extract(epoch from now())::text,
    extract(epoch from now())::bigint,
    '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/wAALCAABAAEBAREA/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA=',
    'image/jpeg',
    'teste.jpg'
) as resultado_simples;

-- Verificar se funcionou
SELECT 
    'Sistema simples funcionando?' as teste,
    id,
    text,
    media_type,
    CASE 
        WHEN media_url IS NOT NULL AND media_url LIKE 'https://%' THEN 'FUNCIONA ✅'
        ELSE 'FALHOU ❌'
    END as status,
    media_url
FROM public.messages 
WHERE created_at > now() - interval '1 minute'
ORDER BY created_at DESC
LIMIT 1;