-- ================================================================
-- 🎯 RPC QUE CORRESPONDE EXATAMENTE À EDGE FUNCTION ATUAL
-- ================================================================

-- A Edge Function webhook_whatsapp_web já está funcionando e enviando
-- os parâmetros nesta ordem específica. Vamos criar a RPC que corresponde.

-- ================================================================
-- 1️⃣ REMOVER TODAS AS VERSÕES ANTIGAS
-- ================================================================

-- Listar o que existe
SELECT 
    '📊 FUNÇÕES EXISTENTES' as status,
    oid,
    pg_get_function_identity_arguments(oid) as assinatura
FROM pg_proc
WHERE proname = 'save_received_message_webhook'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Remover versões conhecidas (com ordem alfabética)
DROP FUNCTION IF EXISTS public.save_received_message_webhook(
    p_base64_data text,
    p_contact_name text,
    p_external_message_id text,
    p_file_name text,
    p_from_me boolean,
    p_media_type text,
    p_media_url text,
    p_message_text text,
    p_mime_type text,
    p_phone text,
    p_profile_pic_url text,
    p_timestamp bigint,
    p_vps_instance_id text
);

DROP FUNCTION IF EXISTS public.save_received_message_webhook(
    p_base64_data text,
    p_contact_name text,
    p_external_message_id text,
    p_file_name text,
    p_from_me boolean,
    p_media_type text,
    p_media_url text,
    p_message_text text,
    p_mime_type text,
    p_phone text,
    p_profile_pic_url text,
    p_timestamp bigint,
    p_vps_instance_id uuid
);

-- ================================================================
-- 2️⃣ CRIAR RPC QUE CORRESPONDE À EDGE FUNCTION
-- ================================================================

-- Esta é a ordem EXATA que a Edge Function está enviando
CREATE OR REPLACE FUNCTION public.save_received_message_webhook(
    p_vps_instance_id UUID,
    p_phone TEXT,
    p_message_text TEXT,
    p_from_me BOOLEAN,
    p_media_type TEXT,
    p_media_url TEXT DEFAULT NULL,
    p_external_message_id TEXT DEFAULT NULL,
    p_contact_name TEXT DEFAULT NULL,
    p_profile_pic_url TEXT DEFAULT NULL,
    p_base64_data TEXT DEFAULT NULL,
    p_mime_type TEXT DEFAULT NULL,
    p_file_name TEXT DEFAULT NULL,
    p_whatsapp_number_id UUID DEFAULT NULL
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
    
    -- Preparar texto da mensagem com emojis
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
    v_message_id := gen_random_uuid();

    -- 🎯 GERAR URL ISOLADA PARA WEBHOOK COM ID CORRETO DO PROJETO
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
        lead_id,
        whatsapp_number_id
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
        v_lead_id,
        p_whatsapp_number_id
    );

    -- 🔄 ENFILEIRAR NA FILA ISOLADA WEBHOOK_MESSAGE_QUEUE
    IF p_base64_data IS NOT NULL AND p_media_type != 'text' THEN
        PERFORM pgmq.send(
            'webhook_message_queue',  -- Fila isolada para webhook
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
-- 3️⃣ VERIFICAR QUE FICOU APENAS UMA FUNÇÃO
-- ================================================================

SELECT 
    '✅ FUNÇÃO ÚNICA CRIADA' as status,
    proname as nome,
    pronargs as num_params,
    pg_get_function_identity_arguments(oid) as assinatura
FROM pg_proc
WHERE proname = 'save_received_message_webhook'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ================================================================
-- 4️⃣ VERIFICAR WORKER ISOLADO
-- ================================================================

SELECT 
    '⚙️ WORKER ISOLADO WEBHOOK' as componente,
    proname as nome_funcao
FROM pg_proc
WHERE proname LIKE '%webhook%worker%'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ================================================================
-- 5️⃣ VERIFICAR FILA ISOLADA
-- ================================================================

SELECT 
    '📦 FILA ISOLADA WEBHOOK' as componente,
    queue_name,
    queue_length,
    total_messages
FROM pgmq.metrics('webhook_message_queue');

-- ================================================================
-- 6️⃣ TESTE FINAL
-- ================================================================

SELECT save_received_message_webhook(
    '712e7708-2299-4a00-9128-577c8f113ca4'::UUID,  -- p_vps_instance_id
    '+5511888888888',                               -- p_phone
    'TESTE RPC MATCH EDGE',                         -- p_message_text
    false,                                          -- p_from_me
    'image',                                        -- p_media_type
    NULL,                                           -- p_media_url
    'edge_match_' || extract(epoch from now())::text, -- p_external_message_id
    'Contato Teste',                               -- p_contact_name
    'https://exemplo.com/profile.jpg',             -- p_profile_pic_url
    'base64_teste_edge_match',                     -- p_base64_data
    'image/jpeg',                                   -- p_mime_type
    'teste_edge.jpg',                              -- p_file_name
    '712e7708-2299-4a00-9128-577c8f113ca4'::UUID   -- p_whatsapp_number_id
) as resultado_teste;

-- Verificar resultado
SELECT 
    '🎯 RESULTADO FINAL' as status,
    id,
    text,
    media_type,
    lead_id,
    CASE 
        WHEN media_url LIKE '%rhjgagzstjzynvrakdyj.supabase.co%' THEN 'URL CORRETA ✅'
        WHEN media_url LIKE '%webhook/%' THEN 'URL ISOLADA ✅'
        ELSE 'VERIFICAR URL'
    END as url_status,
    media_url,
    created_at
FROM public.messages 
WHERE text = 'TESTE RPC MATCH EDGE'
ORDER BY created_at DESC
LIMIT 1;