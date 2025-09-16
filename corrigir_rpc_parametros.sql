-- ================================================================
-- 🔧 CORRIGIR RPC PARA ACEITAR PARÂMETROS DA EDGE FUNCTION
-- ================================================================

-- PROBLEMA: Edge Function envia 12 parâmetros, mas RPC só aceita 10
-- SOLUÇÃO: Atualizar RPC para aceitar todos os parâmetros enviados

-- ================================================================
-- 1️⃣ CORRIGIR RPC PRINCIPAL (COM TODOS OS PARÂMETROS DA EDGE)
-- ================================================================

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
    p_file_name TEXT DEFAULT NULL,
    p_contact_name TEXT DEFAULT NULL,        -- ✅ NOVO PARÂMETRO
    p_media_url TEXT DEFAULT NULL,          -- ✅ NOVO PARÂMETRO  
    p_profile_pic_url TEXT DEFAULT NULL     -- ✅ NOVO PARÂMETRO
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
BEGIN
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
-- 2️⃣ TESTE DA RPC CORRIGIDA
-- ================================================================

-- Teste com todos os parâmetros
SELECT save_received_message_webhook(
    '712e7708-2299-4a00-9128-577c8f113ca4'::UUID,
    '+5511888888888',
    'TESTE RPC CORRIGIDA',
    false,
    'image',
    'rpc_corrigida_' || extract(epoch from now())::text,
    extract(epoch from now())::bigint,
    'base64_teste_rpc_corrigida',
    'image/jpeg',
    'teste_rpc_corrigida.jpg',
    'Nome do Contato',           -- p_contact_name
    'https://exemplo.com/media', -- p_media_url
    'https://exemplo.com/pic'    -- p_profile_pic_url
) as resultado_rpc_corrigida;

-- Verificar resultado
SELECT 
    '🎯 RPC CORRIGIDA - RESULTADO' as categoria,
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
WHERE text = 'TESTE RPC CORRIGIDA'
ORDER BY created_at DESC
LIMIT 1;