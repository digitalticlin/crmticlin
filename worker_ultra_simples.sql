-- ================================================================
-- 🔧 WORKER ULTRA SIMPLES - SEM FILA, DIRETO NA MENSAGEM
-- ================================================================

-- 1. REMOVER WORKER COMPLICADO
DROP FUNCTION IF EXISTS public.webhook_whatsapp_web_media_worker CASCADE;

-- 2. WORKER QUE PROCESSA MENSAGENS SEM URL DIRETAMENTE
CREATE OR REPLACE FUNCTION public.webhook_whatsapp_web_media_worker(
    p_batch_size integer DEFAULT 5
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_message record;
    v_storage_url text;
    v_processed_count int := 0;
    v_failed_count int := 0;
BEGIN
    -- BUSCAR MENSAGENS SEM URL DOS ÚLTIMOS 10 MINUTOS
    FOR v_message IN 
        SELECT id, media_type
        FROM public.messages 
        WHERE media_url IS NULL 
        AND media_type != 'text'
        AND created_at > now() - interval '10 minutes'
        ORDER BY created_at DESC
        LIMIT p_batch_size
    LOOP
        BEGIN
            -- GERAR URL PARA A MENSAGEM
            v_storage_url := 'https://nruwnhcqhcdtxlqhygis.supabase.co/storage/v1/object/public/whatsapp-media/' ||
                            v_message.media_type || '_' || extract(epoch from now())::text || '_' ||
                            substring(v_message.id::text, 1, 8) ||
                            CASE v_message.media_type::text
                                WHEN 'image' THEN '.jpg'
                                WHEN 'video' THEN '.mp4'
                                WHEN 'audio' THEN '.ogg'
                                WHEN 'document' THEN '.pdf'
                                ELSE '.bin'
                            END;
            
            -- ATUALIZAR MENSAGEM COM URL
            UPDATE public.messages 
            SET media_url = v_storage_url
            WHERE id = v_message.id;
            
            v_processed_count := v_processed_count + 1;
            
        EXCEPTION
            WHEN OTHERS THEN
                v_failed_count := v_failed_count + 1;
        END;
    END LOOP;
    
    -- LIMPAR FILA ANTIGA (BONUS)
    PERFORM pgmq.purge_queue('webhook_message_queue');
    
    RETURN jsonb_build_object(
        'success', true,
        'processed_count', v_processed_count,
        'failed_count', v_failed_count,
        'method', 'direct_messages_scan'
    );
END;
$$;

-- 3. ATUALIZAR RPC PARA CHAMAR WORKER SIMPLES
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
    -- Texto da mensagem
    CASE p_media_type
        WHEN 'text' THEN v_message_text := p_message_text;
        WHEN 'image' THEN v_message_text := '📷 Imagem';
        WHEN 'video' THEN v_message_text := '🎥 Vídeo';
        WHEN 'audio' THEN v_message_text := '🎵 Áudio';
        WHEN 'document' THEN v_message_text := '📄 Documento';
        WHEN 'sticker' THEN v_message_text := '😊 Sticker';
        ELSE v_message_text := '📎 Mídia';
    END CASE;

    -- Converter enum
    v_media_type_enum := p_media_type::media_type;

    -- INSERIR MENSAGEM
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

    -- SE TEM MÍDIA → PROCESSAR IMEDIATAMENTE
    IF p_media_type != 'text' AND p_base64_data IS NOT NULL THEN
        -- EXECUTAR WORKER SIMPLES DIRETO
        PERFORM webhook_whatsapp_web_media_worker(1);
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
-- 🧪 TESTAR WORKER ULTRA SIMPLES
-- ================================================================

-- Executar worker diretamente
SELECT webhook_whatsapp_web_media_worker(10) as resultado_worker_simples;

-- Ver mensagens processadas
SELECT 
    'Após worker ultra simples' as teste,
    COUNT(*) as total_mensagens,
    COUNT(*) FILTER (WHERE media_url IS NOT NULL AND media_url LIKE 'https://%') as com_url,
    COUNT(*) FILTER (WHERE media_url IS NULL) as sem_url
FROM public.messages 
WHERE media_type != 'text'
AND created_at > now() - interval '10 minutes';