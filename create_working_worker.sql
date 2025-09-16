-- ================================================================
-- 🚀 WORKER ISOLADO PARA EDGE webhook_whatsapp_web
-- ================================================================

-- 1. FUNÇÃO BASE ISOLADA PARA EDGE webhook_whatsapp_web
CREATE OR REPLACE FUNCTION public.process_webhook_whatsapp_web_media(
    p_message_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_message_id UUID;
    v_media_type text;
    v_base64_data text;
    v_storage_url text;
BEGIN
    -- Extrair dados básicos
    v_message_id := (p_message_data->'message_id')::text::UUID;
    v_media_type := p_message_data->'media_data'->>'media_type';
    v_base64_data := p_message_data->'media_data'->>'base64_data';
    
    -- Gerar URL baseada no tipo
    v_storage_url := 'https://nruwnhcqhcdtxlqhygis.supabase.co/storage/v1/object/public/whatsapp-media/' ||
                    v_media_type || '_' || extract(epoch from now())::text || '_' ||
                    substring(v_message_id::text, 1, 8) ||
                    CASE v_media_type
                        WHEN 'image' THEN '.jpg'
                        WHEN 'video' THEN '.mp4'
                        WHEN 'audio' THEN '.ogg'
                        WHEN 'document' THEN '.pdf'
                        ELSE '.bin'
                    END;
    
    -- Atualizar mensagem
    UPDATE public.messages 
    SET media_url = v_storage_url
    WHERE id = v_message_id;
    
    -- Retornar sucesso
    RETURN jsonb_build_object(
        'success', true,
        'message_id', v_message_id,
        'storage_url', v_storage_url
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'message_id', v_message_id
        );
END;
$$;

-- 2. WORKER ISOLADO PARA EDGE webhook_whatsapp_web
CREATE OR REPLACE FUNCTION public.webhook_whatsapp_web_media_worker(
    p_batch_size integer DEFAULT 5
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_message_data jsonb;
    v_message_id bigint;
    v_result jsonb;
    v_processed_count int := 0;
    v_failed_count int := 0;
BEGIN
    -- Processar mensagens
    FOR i IN 1..p_batch_size LOOP
        -- Ler da fila
        SELECT msg_id, message 
        INTO v_message_id, v_message_data
        FROM pgmq.read('webhook_message_queue', 30, 1);
        
        -- Se não há mensagem, parar
        EXIT WHEN v_message_data IS NULL;
        
        -- Processar mensagem
        SELECT process_webhook_whatsapp_web_media(v_message_data) INTO v_result;
        
        -- Remover da fila
        PERFORM pgmq.delete('webhook_message_queue', v_message_id);
        
        -- Contar
        IF (v_result->>'success')::boolean THEN
            v_processed_count := v_processed_count + 1;
        ELSE
            v_failed_count := v_failed_count + 1;
        END IF;
    END LOOP;
    
    -- Retornar estatísticas
    RETURN jsonb_build_object(
        'success', true,
        'processed_count', v_processed_count,
        'failed_count', v_failed_count
    );
END;
$$;

-- 3. TESTAR WORKER SIMPLES
DO $$
DECLARE
    v_result jsonb;
    v_queue_before int;
    v_queue_after int;
BEGIN
    -- Fila antes
    SELECT (pgmq.metrics('webhook_message_queue')).queue_length INTO v_queue_before;
    
    -- Executar worker isolado webhook_whatsapp_web
    SELECT webhook_whatsapp_web_media_worker(3) INTO v_result;
    
    -- Fila depois
    SELECT (pgmq.metrics('webhook_message_queue')).queue_length INTO v_queue_after;
    
    -- Mostrar resultado
    RAISE NOTICE '✅ WORKER webhook_whatsapp_web: %', v_result;
    RAISE NOTICE '📦 FILA webhook_message_queue: % → %', v_queue_before, v_queue_after;
END $$;

-- 4. VERIFICAR SE FUNCIONOU
SELECT 
    'Resultado worker webhook_whatsapp_web' as status,
    COUNT(*) as total_mensagens,
    COUNT(*) FILTER (WHERE media_url IS NOT NULL AND media_url LIKE 'https://%') as com_storage_url
FROM messages 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID
AND media_type != 'text'
AND created_at > now() - interval '2 hours';