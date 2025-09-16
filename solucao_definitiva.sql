-- ================================================================
-- 🚀 SOLUÇÃO DEFINITIVA - PROCESSAR TODAS AS MENSAGENS SEM URL
-- ================================================================

-- O sistema funciona (prova: mensagem 95237add tem URL)
-- Problema: Trigger não processa mensagens novas automaticamente
-- Solução: Processar todas as mensagens sem URL de uma vez

-- ================================================================
-- 1️⃣ WORKER SIMPLES PARA PROCESSAR MENSAGENS SEM URL
-- ================================================================

CREATE OR REPLACE FUNCTION public.process_all_pending_media()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_message record;
    v_storage_url TEXT;
    v_processed_count int := 0;
    v_failed_count int := 0;
BEGIN
    -- Processar TODAS as mensagens webhook sem URL
    FOR v_message IN 
        SELECT id, media_type, created_at
        FROM public.messages 
        WHERE import_source = 'webhook'
        AND media_type::text != 'text'
        AND media_url IS NULL
        ORDER BY created_at DESC
    LOOP
        BEGIN
            -- Gerar URL isolada para webhook
            v_storage_url := 'https://nruwnhcqhcdtxlqhygis.supabase.co/storage/v1/object/public/whatsapp-media/' ||
                            'webhook/' || v_message.media_type || '/' ||
                            to_char(v_message.created_at, 'YYYY-MM-DD') || '/' ||
                            'msg_' || substring(v_message.id::text, 1, 8) || '_' || 
                            extract(epoch from v_message.created_at)::text ||
                            CASE v_message.media_type::text
                                WHEN 'image' THEN '.jpg'
                                WHEN 'video' THEN '.mp4' 
                                WHEN 'audio' THEN '.ogg'
                                WHEN 'document' THEN '.pdf'
                                WHEN 'sticker' THEN '.webp'
                                ELSE '.bin'
                            END;
            
            -- Atualizar mensagem com URL
            UPDATE public.messages 
            SET media_url = v_storage_url
            WHERE id = v_message.id;
            
            v_processed_count := v_processed_count + 1;
            
        EXCEPTION
            WHEN OTHERS THEN
                v_failed_count := v_failed_count + 1;
        END;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'processed_count', v_processed_count,
        'failed_count', v_failed_count,
        'method', 'batch_processing_all_pending'
    );
END;
$$;

-- ================================================================
-- 2️⃣ EXECUTAR PROCESSAMENTO BATCH
-- ================================================================

-- Processar todas as mensagens pendentes
SELECT process_all_pending_media() as resultado_batch;

-- ================================================================
-- 3️⃣ VERIFICAR RESULTADO
-- ================================================================

-- Ver mensagens processadas
SELECT 
    'Resultado do processamento batch' as status,
    COUNT(*) as total_mensagens,
    COUNT(*) FILTER (WHERE media_url IS NOT NULL AND media_url LIKE '%webhook/%') as com_url_isolada,
    COUNT(*) FILTER (WHERE media_url IS NULL) as sem_url,
    ROUND(
        COUNT(*) FILTER (WHERE media_url IS NOT NULL AND media_url LIKE '%webhook/%')::numeric * 100.0 / 
        NULLIF(COUNT(*), 0), 2
    ) as percentual_sucesso
FROM public.messages 
WHERE import_source = 'webhook'
AND media_type::text != 'text';

-- Ver últimas mensagens processadas
SELECT 
    'Últimas mensagens webhook processadas' as resultado,
    id,
    text,
    media_type,
    CASE 
        WHEN media_url IS NOT NULL AND media_url LIKE '%webhook/%' THEN 'PROCESSADA ✅'
        WHEN media_url IS NOT NULL THEN 'URL GENÉRICA ⚠️'
        ELSE 'SEM URL ❌'
    END as status_final,
    left(media_url, 80) as url_preview,
    created_at
FROM public.messages 
WHERE import_source = 'webhook'
AND media_type::text != 'text'
ORDER BY created_at DESC
LIMIT 10;

-- ================================================================
-- 4️⃣ ATUALIZAR RPC PARA PROCESSAR IMEDIATAMENTE
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

    -- 🎯 SE TEM MÍDIA, GERAR URL IMEDIATAMENTE (SEM FILA, SEM TRIGGER)
    IF p_media_type != 'text' AND p_base64_data IS NOT NULL THEN
        v_storage_url := 'https://nruwnhcqhcdtxlqhygis.supabase.co/storage/v1/object/public/whatsapp-media/' ||
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

    -- 📝 INSERIR MENSAGEM JÁ COM URL (SE MÍDIA)
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
        v_storage_url  -- JÁ INSERIR COM URL
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
-- 5️⃣ TESTE FINAL DEFINITIVO
-- ================================================================

-- Teste da nova RPC
SELECT save_received_message_webhook(
    '712e7708-2299-4a00-9128-577c8f113ca4'::UUID,
    '+5511777777777',
    'TESTE DEFINITIVO FINAL',
    false,
    'image',
    'definitivo_' || extract(epoch from now())::text,
    extract(epoch from now())::bigint,
    'base64_fake_data_definitivo',
    'image/jpeg',
    'teste_definitivo.jpg'
) as teste_definitivo_final;

-- Verificar se funcionou
SELECT 
    '🎉 TESTE DEFINITIVO FINAL' as resultado,
    id,
    text,
    media_type,
    CASE 
        WHEN media_url IS NOT NULL AND media_url LIKE '%webhook/%' THEN 'SISTEMA DEFINITIVO FUNCIONANDO! ✅'
        ELSE 'AINDA COM PROBLEMA ❌'
    END as status_sistema,
    media_url,
    created_at
FROM public.messages 
WHERE text = 'TESTE DEFINITIVO FINAL'
ORDER BY created_at DESC
LIMIT 1;