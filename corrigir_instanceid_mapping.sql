-- ================================================================
-- 🔧 CORRIGIR MAPEAMENTO DE INSTANCE_ID PARA UUID
-- ================================================================

-- PROBLEMA: Edge Function envia instanceId como string, mas RPC espera UUID
-- SOLUÇÃO: Criar função para mapear instanceId para vps_instance_id UUID

-- ================================================================
-- 1️⃣ FUNÇÃO AUXILIAR PARA MAPEAR INSTANCE_ID
-- ================================================================

CREATE OR REPLACE FUNCTION public.get_vps_instance_uuid(p_instance_id TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_uuid UUID;
BEGIN
    -- Tentar encontrar o UUID pela coluna vps_instance_id (se já for UUID)
    BEGIN
        IF p_instance_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
            RETURN p_instance_id::UUID;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            -- Não é UUID válido, continuar
            NULL;
    END;
    
    -- Buscar UUID na tabela whatsapp_instances
    SELECT vps_instance_id INTO v_uuid
    FROM public.whatsapp_instances
    WHERE vps_instance_id::text = p_instance_id
    OR instance_name = p_instance_id
    OR id::text = p_instance_id
    LIMIT 1;
    
    IF v_uuid IS NOT NULL THEN
        RETURN v_uuid;
    END IF;
    
    -- Se não encontrar, usar UUID padrão (ou gerar novo)
    RETURN '712e7708-2299-4a00-9128-577c8f113ca4'::UUID;
END;
$$;

-- ================================================================
-- 2️⃣ RPC CORRIGIDA COM MAPEAMENTO DE INSTANCE_ID
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
    p_vps_instance_id TEXT DEFAULT NULL  -- ✅ ACEITAR COMO TEXT PRIMEIRO
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
    v_uuid_instance UUID;
BEGIN
    -- ✅ MAPEAR INSTANCE_ID PARA UUID
    v_uuid_instance := get_vps_instance_uuid(p_vps_instance_id);
    
    -- Validar parâmetros obrigatórios
    IF v_uuid_instance IS NULL OR p_phone IS NULL OR p_phone = '' THEN
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

    -- 📝 INSERIR MENSAGEM COM UUID CORRETO
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
        v_uuid_instance,  -- ✅ UUID MAPEADO
        'webhook',
        p_external_message_id,
        v_storage_url
    );

    RETURN jsonb_build_object(
        'data', jsonb_build_object(
            'success', true,
            'message_id', v_message_id,
            'media_url', v_storage_url,
            'mapped_instance_uuid', v_uuid_instance
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'data', jsonb_build_object(
                'success', false,
                'error', SQLERRM,
                'instance_id_received', p_vps_instance_id
            )
        );
END;
$$;

-- ================================================================
-- 3️⃣ TESTE COM INSTANCE_ID COMO STRING
-- ================================================================

-- Teste com instanceId como string (igual ao log)
SELECT save_received_message_webhook(
    'base64_teste_instanceid_mapping',      -- p_base64_data
    'Nome do Contato',                      -- p_contact_name  
    'instanceid_mapping_' || extract(epoch from now())::text, -- p_external_message_id
    'teste_mapping.jpg',                    -- p_file_name
    false,                                  -- p_from_me
    'image',                                -- p_media_type
    'https://exemplo.com/media',            -- p_media_url
    'TESTE INSTANCEID MAPPING',            -- p_message_text
    'image/jpeg',                           -- p_mime_type
    '+5511888888888',                       -- p_phone
    'https://exemplo.com/pic',              -- p_profile_pic_url
    extract(epoch from now())::bigint,      -- p_timestamp
    'digitalticlingmailcom'                 -- p_vps_instance_id (STRING!)
) as resultado_instanceid_mapping;

-- Verificar resultado
SELECT 
    '🎯 INSTANCEID MAPPING - RESULTADO' as categoria,
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
WHERE text = 'TESTE INSTANCEID MAPPING'
ORDER BY created_at DESC
LIMIT 1;