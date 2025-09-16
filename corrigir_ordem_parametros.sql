-- ================================================================
-- 🔧 CORRIGIR ORDEM DOS PARÂMETROS DA RPC
-- ================================================================

-- PROBLEMA: Ordem dos parâmetros diferente entre Edge Function e RPC
-- SOLUÇÃO: Usar exatamente a ordem que a Edge Function está enviando

-- ================================================================
-- 1️⃣ RPC COM ORDEM EXATA DOS PARÂMETROS DA EDGE
-- ================================================================

CREATE OR REPLACE FUNCTION public.save_received_message_webhook(
    p_base64_data TEXT DEFAULT NULL,
    p_contact_name TEXT DEFAULT NULL,
    p_external_message_id TEXT DEFAULT NULL,
    p_file_name TEXT DEFAULT NULL,
    p_from_me BOOLEAN DEFAULT false,
    p_media_type TEXT DEFAULT 'text',
    p_media_url TEXT DEFAULT NULL,
    p_message_text TEXT DEFAULT '',
    p_mime_type TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT '',
    p_profile_pic_url TEXT DEFAULT NULL,
    p_timestamp BIGINT DEFAULT NULL,
    p_vps_instance_id UUID DEFAULT NULL
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
    v_storage_url TEXT;
    v_timestamp_value BIGINT;
BEGIN
    -- Validar parâmetros obrigatórios
    IF p_vps_instance_id IS NULL OR p_phone IS NULL OR p_phone = '' THEN
        RETURN jsonb_build_object(
            'data', jsonb_build_object(
                'success', false,
                'error', 'vps_instance_id and phone are required'
            )
        );
    END IF;

    -- Preparar texto da mensagem
    CASE p_media_type
        WHEN 'text' THEN v_message_text := p_message_text;
        WHEN 'image' THEN v_message_text := '📷 Imagem';
        WHEN 'video' THEN v_message_text := '🎥 Vídeo';
        WHEN 'audio' THEN v_message_text := '🎵 Áudio';
        WHEN 'document' THEN v_message_text := '📄 Documento';
        WHEN 'sticker' THEN v_message_text := '😊 Sticker';
        ELSE v_message_text := '📎 Mídia';
    END CASE;

    v_media_type_enum := p_media_type::media_type;
    v_message_id := gen_random_uuid();
    v_timestamp_value := COALESCE(p_timestamp, extract(epoch from now())::bigint);

    -- 🎯 SE TEM MÍDIA, GERAR URL COM ID CORRETO
    IF p_media_type != 'text' AND p_base64_data IS NOT NULL THEN
        v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' ||
                        'webhook/' || p_media_type || '/' ||
                        to_char(now(), 'YYYY-MM-DD') || '/' ||
                        'msg_' || substring(v_message_id::text, 1, 8) || '_' || 
                        extract(epoch from now())::text ||
                        CASE p_media_type
                            WHEN 'image' THEN '.jpg'
                            WHEN 'video' THEN '.mp4'
                            WHEN 'audio' THEN '.ogg'
                            WHEN 'document' THEN '.pdf'
                            WHEN 'sticker' THEN '.webp'
                            ELSE '.bin'
                        END;
    END IF;

    -- 📝 INSERIR MENSAGEM COM URL CORRETA
    INSERT INTO public.messages (
        id,
        text, 
        from_me, 
        media_type, 
        created_by_user_id,
        import_source,
        external_message_id,
        media_url
    )
    VALUES (
        v_message_id,
        v_message_text,
        p_from_me,
        v_media_type_enum,
        p_vps_instance_id,
        'webhook',
        p_external_message_id,
        v_storage_url  -- URL COM ID CORRETO
    );

    RETURN jsonb_build_object(
        'data', jsonb_build_object(
            'success', true,
            'message_id', v_message_id,
            'media_url', v_storage_url
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
-- 2️⃣ TESTE DA RPC COM ORDEM CORRIGIDA
-- ================================================================

-- Teste seguindo exatamente a ordem da Edge Function
SELECT save_received_message_webhook(
    'base64_teste_ordem_corrigida',  -- p_base64_data
    'Nome do Contato',               -- p_contact_name  
    'ordem_corrigida_' || extract(epoch from now())::text, -- p_external_message_id
    'teste_ordem.jpg',               -- p_file_name
    false,                           -- p_from_me
    'image',                         -- p_media_type
    'https://exemplo.com/media',     -- p_media_url
    'TESTE ORDEM CORRIGIDA',         -- p_message_text
    'image/jpeg',                    -- p_mime_type
    '+5511888888888',                -- p_phone
    'https://exemplo.com/pic',       -- p_profile_pic_url
    extract(epoch from now())::bigint, -- p_timestamp
    '712e7708-2299-4a00-9128-577c8f113ca4'::UUID -- p_vps_instance_id
) as resultado_ordem_corrigida;

-- Verificar resultado
SELECT 
    '🎯 ORDEM CORRIGIDA - RESULTADO' as categoria,
    id,
    text,
    media_type,
    CASE 
        WHEN media_url LIKE '%rhjgagzstjzynvrakdyj.supabase.co%' THEN 'URL CORRETA ✅'
        ELSE 'URL PROBLEMA'
    END as status_url,
    media_url,
    created_at
FROM public.messages 
WHERE text = 'TESTE ORDEM CORRIGIDA'
ORDER BY created_at DESC
LIMIT 1;