-- ================================================================
-- 🔧 RPC COM UUID CORRETO (REVERTER PARA VERSÃO QUE FUNCIONA)
-- ================================================================

-- PROBLEMA RESOLVIDO: Edge Function agora busca o UUID real antes de chamar RPC
-- RPC deve aceitar UUID normalmente (não TEXT)

-- ================================================================
-- 1️⃣ RPC CORRIGIDA - ACEITA UUID DIRETO
-- ================================================================

CREATE OR REPLACE FUNCTION public.save_received_message_webhook(
    p_vps_instance_id UUID,           -- ✅ UUID DIRETO (Edge já envia correto)
    p_phone TEXT,
    p_message_text TEXT,
    p_from_me BOOLEAN,
    p_media_type TEXT,
    p_external_message_id TEXT,
    p_timestamp BIGINT,
    p_base64_data TEXT DEFAULT NULL,
    p_mime_type TEXT DEFAULT NULL,
    p_file_name TEXT DEFAULT NULL,
    p_contact_name TEXT DEFAULT NULL,
    p_media_url TEXT DEFAULT NULL,
    p_profile_pic_url TEXT DEFAULT NULL
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

    -- 🎯 SE TEM MÍDIA, GERAR URL COM ID CORRETO DO PROJETO
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
        p_vps_instance_id,  -- ✅ UUID DIRETO
        'webhook',
        p_external_message_id,
        v_storage_url
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
-- 2️⃣ TESTE DA RPC COM UUID CORRETO
-- ================================================================

-- Teste com UUID real (como a Edge Function agora envia)
SELECT save_received_message_webhook(
    '712e7708-2299-4a00-9128-577c8f113ca4'::UUID,  -- p_vps_instance_id (UUID!)
    '+5511888888888',                               -- p_phone
    'TESTE UUID CORRETO',                           -- p_message_text
    false,                                          -- p_from_me
    'image',                                        -- p_media_type
    'uuid_correto_' || extract(epoch from now())::text, -- p_external_message_id
    extract(epoch from now())::bigint,             -- p_timestamp
    'base64_teste_uuid_correto',                   -- p_base64_data
    'image/jpeg',                                   -- p_mime_type
    'teste_uuid.jpg',                               -- p_file_name
    NULL,                                           -- p_contact_name
    NULL,                                           -- p_media_url
    NULL                                            -- p_profile_pic_url
) as resultado_uuid_correto;

-- Verificar resultado
SELECT 
    '🎯 UUID CORRETO - RESULTADO' as categoria,
    id,
    text,
    media_type,
    created_by_user_id,
    CASE 
        WHEN media_url LIKE '%rhjgagzstjzynvrakdyj.supabase.co%' THEN 'URL CORRETA ✅'
        ELSE 'URL PROBLEMA'
    END as status_url,
    media_url,
    created_at
FROM public.messages 
WHERE text = 'TESTE UUID CORRETO'
ORDER BY created_at DESC
LIMIT 1;

-- ================================================================
-- 3️⃣ VERIFICAR INSTÂNCIAS EXISTENTES
-- ================================================================

-- Ver quais instâncias existem para mapear corretamente
SELECT 
    '📊 INSTÂNCIAS DISPONÍVEIS' as info,
    id,
    vps_instance_id,
    instance_name,
    connection_status
FROM public.whatsapp_instances
ORDER BY created_at DESC
LIMIT 10;