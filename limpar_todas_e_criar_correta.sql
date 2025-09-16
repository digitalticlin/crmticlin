-- ================================================================
-- 🧹 LIMPAR TODAS AS VERSÕES E CRIAR APENAS A CORRETA
-- ================================================================

-- PASSO 1: LISTAR TODAS AS FUNÇÕES EXISTENTES (PARA CONFERÊNCIA)
SELECT 
    '🔍 FUNÇÕES EXISTENTES ANTES DA LIMPEZA' as info,
    proname as function_name,
    pronargs as num_args,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'save_received_message_webhook'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ================================================================
-- PASSO 2: REMOVER TODAS AS VERSÕES EXISTENTES
-- ================================================================

-- Remover QUALQUER versão que exista
DROP FUNCTION IF EXISTS public.save_received_message_webhook CASCADE;

-- Tentar remover com diferentes assinaturas (caso existam)
DO $$
BEGIN
    -- Versão com ordem alfabética dos parâmetros
    DROP FUNCTION IF EXISTS public.save_received_message_webhook(
        text, text, text, text, boolean, text, text, text, text, text, text, bigint, text
    );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    -- Versão com ordem alfabética e UUID
    DROP FUNCTION IF EXISTS public.save_received_message_webhook(
        text, text, text, text, boolean, text, text, text, text, text, text, bigint, uuid
    );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    -- Versão com ordem original
    DROP FUNCTION IF EXISTS public.save_received_message_webhook(
        uuid, text, text, boolean, text, text, bigint, text, text, text, text, text, text
    );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ================================================================
-- PASSO 3: CRIAR A VERSÃO CORRETA E ÚNICA
-- ================================================================

CREATE OR REPLACE FUNCTION public.save_received_message_webhook(
    p_vps_instance_id UUID,           -- ✅ UUID (Edge já busca e envia correto)
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
    v_lead_id UUID;
    v_formatted_phone TEXT;
BEGIN
    -- Formatar telefone
    v_formatted_phone := regexp_replace(p_phone, '[^0-9+]', '', 'g');
    
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

    -- 📱 CRIAR/ATUALIZAR LEAD
    INSERT INTO public.leads (
        phone,
        name,
        created_by_user_id,
        import_source,
        profile_pic_url
    )
    VALUES (
        v_formatted_phone,
        COALESCE(p_contact_name, v_formatted_phone),
        p_vps_instance_id,
        'webhook',
        p_profile_pic_url
    )
    ON CONFLICT (phone, created_by_user_id) 
    DO UPDATE SET
        name = COALESCE(EXCLUDED.name, leads.name),
        profile_pic_url = COALESCE(EXCLUDED.profile_pic_url, leads.profile_pic_url),
        updated_at = now()
    RETURNING id INTO v_lead_id;

    -- 📝 INSERIR MENSAGEM
    INSERT INTO public.messages (
        id,
        text, 
        from_me, 
        media_type, 
        created_by_user_id,
        import_source,
        external_message_id,
        media_url,
        lead_id
    )
    VALUES (
        v_message_id,
        v_message_text,
        p_from_me,
        v_media_type_enum,
        p_vps_instance_id,
        'webhook',
        p_external_message_id,
        v_storage_url,
        v_lead_id
    );

    -- 🔄 SE TEM BASE64, ENFILEIRAR PARA PROCESSAMENTO
    IF p_base64_data IS NOT NULL AND p_media_type != 'text' THEN
        PERFORM pgmq.send(
            'webhook_message_queue',
            jsonb_build_object(
                'message_id', v_message_id,
                'media_type', p_media_type,
                'base64_data', p_base64_data,
                'mime_type', p_mime_type,
                'file_name', p_file_name,
                'external_message_id', p_external_message_id
            )
        );
    END IF;

    RETURN jsonb_build_object(
        'data', jsonb_build_object(
            'success', true,
            'message_id', v_message_id,
            'lead_id', v_lead_id,
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
-- PASSO 4: VERIFICAR QUE FICOU APENAS UMA FUNÇÃO
-- ================================================================

SELECT 
    '✅ FUNÇÕES APÓS LIMPEZA (DEVE TER APENAS 1)' as info,
    proname as function_name,
    pronargs as num_args,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'save_received_message_webhook'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ================================================================
-- PASSO 5: TESTE FINAL
-- ================================================================

SELECT save_received_message_webhook(
    '712e7708-2299-4a00-9128-577c8f113ca4'::UUID,  -- p_vps_instance_id
    '+5511888888888',                               -- p_phone
    'TESTE APÓS LIMPEZA TOTAL',                     -- p_message_text
    false,                                          -- p_from_me
    'image',                                        -- p_media_type
    'limpeza_total_' || extract(epoch from now())::text, -- p_external_message_id
    extract(epoch from now())::bigint,             -- p_timestamp
    'base64_teste_limpeza_total',                  -- p_base64_data
    'image/jpeg',                                   -- p_mime_type
    'teste_limpeza.jpg',                            -- p_file_name
    'Contato Teste',                               -- p_contact_name
    NULL,                                           -- p_media_url
    'https://exemplo.com/profile.jpg'              -- p_profile_pic_url
) as resultado_limpeza_total;

-- Verificar resultado
SELECT 
    '🎯 RESULTADO APÓS LIMPEZA' as categoria,
    id,
    text,
    media_type,
    created_by_user_id,
    lead_id,
    CASE 
        WHEN media_url LIKE '%rhjgagzstjzynvrakdyj.supabase.co%' THEN 'URL CORRETA ✅'
        ELSE 'URL PROBLEMA'
    END as status_url,
    media_url,
    created_at
FROM public.messages 
WHERE text = 'TESTE APÓS LIMPEZA TOTAL'
ORDER BY created_at DESC
LIMIT 1;