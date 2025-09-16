-- ================================================================
-- 🔧 CORRIGIR URL DO PROJETO SUPABASE - ID CORRETO
-- ================================================================

-- PROBLEMA: URLs usando nruwnhcqhcdtxlqhygis.supabase.co
-- CORREÇÃO: Usar rhjgagzstjzynvrakdyj.supabase.co (projeto correto)

-- ================================================================
-- 1️⃣ CORRIGIR FUNÇÃO DE PROCESSAMENTO BATCH
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
            -- 🎯 URL CORRIGIDA COM ID CORRETO
            v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' ||
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
            
            -- Atualizar mensagem com URL CORRETA
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
        'method', 'batch_processing_url_corrigida'
    );
END;
$$;

-- ================================================================
-- 2️⃣ CORRIGIR RPC PRINCIPAL
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
-- 3️⃣ CORRIGIR WORKER SÍNCRONO
-- ================================================================

CREATE OR REPLACE FUNCTION public.webhook_process_media_sync(
    p_message_id UUID
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_message_data jsonb;
    v_message_id_queue bigint;
    v_media_type TEXT;
    v_base64_data TEXT;
    v_mime_type TEXT;
    v_file_name TEXT;
    v_file_path TEXT;
    v_public_url TEXT;
    v_processed boolean := false;
BEGIN
    -- Buscar mensagem específica na fila
    FOR v_message_id_queue, v_message_data IN
        SELECT msg_id, message 
        FROM pgmq.read('webhook_message_queue', 5, 10)
        WHERE message->>'message_id' = p_message_id::text
    LOOP
        -- Extrair dados
        v_media_type := v_message_data->>'media_type';
        v_base64_data := v_message_data->>'base64_data';
        v_mime_type := COALESCE(v_message_data->>'mime_type', 'application/octet-stream');
        v_file_name := v_message_data->>'file_name';
        
        -- Gerar nome do arquivo se não fornecido
        IF v_file_name IS NULL OR v_file_name = '' THEN
            v_file_name := 'msg_' || substring(p_message_id::text, 1, 8) || '_' || extract(epoch from now())::text ||
                          CASE v_media_type
                              WHEN 'image' THEN '.jpg'
                              WHEN 'video' THEN '.mp4'
                              WHEN 'audio' THEN '.ogg'
                              WHEN 'document' THEN '.pdf'
                              WHEN 'sticker' THEN '.webp'
                              ELSE '.bin'
                          END;
        END IF;
        
        -- Caminho isolado por webhook
        v_file_path := 'webhook/' || v_media_type || '/' || to_char(now(), 'YYYY-MM-DD') || '/' || v_file_name;
        
        -- 🎯 URL PÚBLICA COM ID CORRETO
        v_public_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' || v_file_path;
        
        -- Atualizar mensagem com URL CORRETA
        UPDATE public.messages 
        SET media_url = v_public_url
        WHERE id = p_message_id;
        
        -- Remover da fila
        PERFORM pgmq.delete('webhook_message_queue', v_message_id_queue);
        
        v_processed := true;
        EXIT;
    END LOOP;
    
    RETURN v_processed;
END;
$$;

-- ================================================================
-- 4️⃣ CORRIGIR URLs EXISTENTES (OPCIONAL)
-- ================================================================

-- Corrigir URLs das mensagens já processadas
UPDATE public.messages 
SET media_url = REPLACE(media_url, 'nruwnhcqhcdtxlqhygis.supabase.co', 'rhjgagzstjzynvrakdyj.supabase.co')
WHERE media_url LIKE '%nruwnhcqhcdtxlqhygis.supabase.co%'
AND import_source = 'webhook';

-- ================================================================
-- 5️⃣ TESTE FINAL COM URL CORRETA
-- ================================================================

-- Teste da RPC corrigida
SELECT save_received_message_webhook(
    '712e7708-2299-4a00-9128-577c8f113ca4'::UUID,
    '+5511888888888',
    'TESTE URL CORRIGIDA',
    false,
    'image',
    'url_corrigida_' || extract(epoch from now())::text,
    extract(epoch from now())::bigint,
    'base64_teste_url_corrigida',
    'image/jpeg',
    'teste_url_corrigida.jpg'
) as resultado_url_corrigida;

-- Verificar resultado com URL correta
SELECT 
    '🎯 URL CORRIGIDA - RESULTADO' as categoria,
    id,
    text,
    media_type,
    CASE 
        WHEN media_url LIKE '%rhjgagzstjzynvrakdyj.supabase.co%' THEN 'URL CORRETA ✅'
        WHEN media_url LIKE '%nruwnhcqhcdtxlqhygis.supabase.co%' THEN 'URL ANTIGA (ERRADA) ❌'
        ELSE 'SEM URL'
    END as status_url,
    media_url,
    created_at
FROM public.messages 
WHERE text = 'TESTE URL CORRIGIDA'
ORDER BY created_at DESC
LIMIT 1;

-- Status geral das URLs
SELECT 
    '📊 STATUS GERAL DAS URLs' as resumo,
    COUNT(*) as total_mensagens_midia,
    COUNT(*) FILTER (WHERE media_url LIKE '%rhjgagzstjzynvrakdyj.supabase.co%') as urls_corretas,
    COUNT(*) FILTER (WHERE media_url LIKE '%nruwnhcqhcdtxlqhygis.supabase.co%') as urls_antigas,
    COUNT(*) FILTER (WHERE media_url IS NULL) as sem_url
FROM public.messages 
WHERE import_source = 'webhook' 
AND media_type::text != 'text';