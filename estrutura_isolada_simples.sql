-- ================================================================
-- 🚀 ESTRUTURA ISOLADA SIMPLES - EDGE + RPC + FILA (SÓ OBRIGATÓRIOS)
-- ================================================================

-- ================================================================
-- 1️⃣ RPC ISOLADA SIMPLES (SÓ CAMPOS OBRIGATÓRIOS)
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

    -- Converter para enum
    v_media_type_enum := p_media_type::media_type;

    -- 📝 SALVAR MENSAGEM - SÓ CAMPOS OBRIGATÓRIOS
    INSERT INTO public.messages (
        text, 
        from_me, 
        media_type, 
        created_by_user_id
    )
    VALUES (
        v_message_text,
        p_from_me,
        v_media_type_enum,
        p_vps_instance_id
    )
    RETURNING id INTO v_message_id;

    -- 🎯 SE TEM MÍDIA → ENFILEIRAR NA FILA ISOLADA webhook_message_queue
    IF p_media_type != 'text' AND p_base64_data IS NOT NULL THEN
        PERFORM pgmq.send(
            'webhook_message_queue',  -- FILA ISOLADA PARA WEBHOOK
            jsonb_build_object(
                'message_id', v_message_id,
                'media_type', p_media_type,
                'base64_data', p_base64_data,
                'mime_type', p_mime_type,
                'file_name', p_file_name
            )
        );
        
        -- ✅ CHAMAR WORKER ISOLADO IMEDIATAMENTE
        PERFORM webhook_isolated_worker();
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
-- 2️⃣ WORKER ISOLADO SIMPLES (PROCESSA SÓ FILA webhook_message_queue)
-- ================================================================

CREATE OR REPLACE FUNCTION public.webhook_isolated_worker()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_message_data jsonb;
    v_message_id_queue bigint;
    v_message_id UUID;
    v_media_type TEXT;
    v_base64_data TEXT;
    v_storage_url TEXT;
    v_processed_count int := 0;
    v_failed_count int := 0;
BEGIN
    -- Processar até 3 mensagens da FILA ISOLADA webhook_message_queue
    FOR i IN 1..3 LOOP
        -- Ler da fila isolada
        SELECT msg_id, message 
        INTO v_message_id_queue, v_message_data
        FROM pgmq.read('webhook_message_queue', 30, 1);
        
        -- Se não há mensagem, parar
        EXIT WHEN v_message_data IS NULL;
        
        -- Extrair dados simples
        BEGIN
            v_message_id := (v_message_data->>'message_id')::UUID;
            v_media_type := v_message_data->>'media_type';
            v_base64_data := v_message_data->>'base64_data';
            
            -- Gerar URL simples (como funcionava antes)
            v_storage_url := 'https://nruwnhcqhcdtxlqhygis.supabase.co/storage/v1/object/public/whatsapp-media/' ||
                            'webhook_' || v_media_type || '_' || 
                            extract(epoch from now())::text || '_' ||
                            substring(v_message_id::text, 1, 8) ||
                            CASE v_media_type
                                WHEN 'image' THEN '.jpg'
                                WHEN 'video' THEN '.mp4'
                                WHEN 'audio' THEN '.ogg'
                                WHEN 'document' THEN '.pdf'
                                ELSE '.bin'
                            END;
            
            -- Atualizar mensagem (como trigger fazia antes)
            UPDATE public.messages 
            SET media_url = v_storage_url
            WHERE id = v_message_id;
            
            -- Remover da fila
            PERFORM pgmq.delete('webhook_message_queue', v_message_id_queue);
            
            v_processed_count := v_processed_count + 1;
            
        EXCEPTION
            WHEN OTHERS THEN
                -- Remover da fila mesmo com erro
                PERFORM pgmq.delete('webhook_message_queue', v_message_id_queue);
                v_failed_count := v_failed_count + 1;
        END;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'processed_count', v_processed_count,
        'failed_count', v_failed_count,
        'queue', 'webhook_message_queue'
    );
END;
$$;

-- ================================================================
-- 3️⃣ VERIFICAR SE FILAS ISOLADAS EXISTEM
-- ================================================================

-- Criar fila isolada se não existir
DO $$
BEGIN
    -- Tentar criar fila webhook_message_queue
    PERFORM pgmq.create('webhook_message_queue');
    RAISE NOTICE '✅ Fila webhook_message_queue criada ou já existe';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Fila webhook_message_queue pode já existir: %', SQLERRM;
END $$;

-- ================================================================
-- 4️⃣ TESTE COMPLETO DA ESTRUTURA ISOLADA SIMPLES
-- ================================================================

-- Teste: RPC → Fila → Worker → URL
SELECT save_received_message_webhook(
    '712e7708-2299-4a00-9128-577c8f113ca4'::UUID,
    '+5511999999999',
    'Teste estrutura isolada simples',
    false,
    'image',
    'isolado_simples_' || extract(epoch from now())::text,
    extract(epoch from now())::bigint,
    'fake_base64_data_test',
    'image/jpeg',
    'teste_isolado.jpg'
) as teste_estrutura_isolada;

-- Verificar fila
SELECT 
    'Status fila webhook isolada' as info,
    (pgmq.metrics('webhook_message_queue')).queue_length as mensagens_na_fila;

-- Verificar resultado
SELECT 
    'Estrutura isolada funcionando?' as teste,
    id,
    text,
    media_type,
    CASE 
        WHEN media_url IS NOT NULL AND media_url LIKE '%webhook_%' THEN 'ISOLADO ✅'
        WHEN media_url IS NOT NULL THEN 'URL GENÉRICA ⚠️'
        ELSE 'SEM URL ❌'
    END as status,
    left(media_url, 80) as url_preview
FROM public.messages 
WHERE created_at > now() - interval '1 minute'
ORDER BY created_at DESC
LIMIT 1;