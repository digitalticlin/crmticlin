-- ================================================================
-- 🧹 REMOVER DUPLICADAS E CRIAR VERSÃO CORRETA
-- ================================================================

-- ANÁLISE DO ERRO: Existem 2 funções com ordem alfabética dos parâmetros
-- Uma com p_vps_instance_id TEXT e outra com UUID
-- AMBAS ESTÃO ERRADAS!

-- ================================================================
-- 1️⃣ LISTAR O QUE EXISTE AGORA
-- ================================================================

SELECT 
    '❌ FUNÇÕES DUPLICADAS ENCONTRADAS' as problema,
    oid,
    pg_get_function_identity_arguments(oid) as assinatura
FROM pg_proc
WHERE proname = 'save_received_message_webhook'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ================================================================
-- 2️⃣ REMOVER TODAS AS VERSÕES EXISTENTES (COM ASSINATURAS ESPECÍFICAS)
-- ================================================================

-- Remover as duas versões conhecidas do erro (ordem alfabética dos parâmetros)

-- Versão 1: com p_vps_instance_id TEXT
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

-- Versão 2: com p_vps_instance_id UUID
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

-- Tentar remover outras possíveis versões
DROP FUNCTION IF EXISTS public.save_received_message_webhook(
    p_vps_instance_id uuid,
    p_phone text,
    p_message_text text,
    p_from_me boolean,
    p_media_type text,
    p_external_message_id text,
    p_timestamp bigint,
    p_base64_data text,
    p_mime_type text,
    p_file_name text,
    p_contact_name text,
    p_media_url text,
    p_profile_pic_url text
);

DROP FUNCTION IF EXISTS public.save_received_message_webhook(
    p_vps_instance_id text,
    p_phone text,
    p_message_text text,
    p_from_me boolean,
    p_media_type text,
    p_external_message_id text,
    p_timestamp bigint,
    p_base64_data text,
    p_mime_type text,
    p_file_name text,
    p_contact_name text,
    p_media_url text,
    p_profile_pic_url text
);

-- ================================================================
-- 3️⃣ VERIFICAR QUE FORAM REMOVIDAS
-- ================================================================

SELECT 
    '✅ APÓS REMOÇÃO (DEVE ESTAR VAZIO)' as status,
    COUNT(*) as funcoes_restantes
FROM pg_proc
WHERE proname = 'save_received_message_webhook'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ================================================================
-- 4️⃣ CRIAR A VERSÃO CORRETA (ORDEM LÓGICA, NÃO ALFABÉTICA)
-- ================================================================

CREATE OR REPLACE FUNCTION public.save_received_message_webhook(
    p_vps_instance_id UUID,      -- 1º parâmetro: UUID da instância
    p_phone TEXT,                -- 2º parâmetro: telefone
    p_message_text TEXT,         -- 3º parâmetro: texto
    p_from_me BOOLEAN,           -- 4º parâmetro: direção
    p_media_type TEXT,           -- 5º parâmetro: tipo de mídia
    p_external_message_id TEXT,  -- 6º parâmetro: ID externo
    p_timestamp BIGINT,          -- 7º parâmetro: timestamp
    p_base64_data TEXT DEFAULT NULL,     -- Opcional: dados base64
    p_mime_type TEXT DEFAULT NULL,       -- Opcional: mime type
    p_file_name TEXT DEFAULT NULL,       -- Opcional: nome arquivo
    p_contact_name TEXT DEFAULT NULL,    -- Opcional: nome contato
    p_media_url TEXT DEFAULT NULL,       -- Opcional: URL mídia
    p_profile_pic_url TEXT DEFAULT NULL  -- Opcional: foto perfil
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

    -- 🎯 GERAR URL COM ID CORRETO DO PROJETO
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

    -- 🔄 ENFILEIRAR PARA PROCESSAMENTO DE MÍDIA
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
-- 5️⃣ VERIFICAR QUE FOI CRIADA CORRETAMENTE
-- ================================================================

SELECT 
    '✅ FUNÇÃO ÚNICA CRIADA' as status,
    proname,
    pronargs as num_params,
    pg_get_function_identity_arguments(oid) as assinatura_correta
FROM pg_proc
WHERE proname = 'save_received_message_webhook'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ================================================================
-- 6️⃣ TESTE COM UUID REAL
-- ================================================================

SELECT save_received_message_webhook(
    '712e7708-2299-4a00-9128-577c8f113ca4'::UUID,  -- UUID real
    '+5511888888888',
    'TESTE APÓS REMOVER DUPLICADAS',
    false,
    'image',
    'teste_sem_duplicadas_' || extract(epoch from now())::text,
    extract(epoch from now())::bigint,
    'base64_teste',
    'image/jpeg',
    'teste.jpg',
    'Contato Teste',
    NULL,
    'https://exemplo.com/profile.jpg'
) as resultado_final;