-- ================================================================
-- ⚙️ STEP 2: WORKER ISOLADO PARA PROCESSAMENTO WEBHOOK
-- ================================================================

-- Worker que processa mídia da fila webhook_message_queue
CREATE OR REPLACE FUNCTION public.process_webhook_media_isolated(
    p_message_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_queue_msg jsonb;
    v_base64_data text;
    v_media_type text;
    v_mime_type text;
    v_file_name text;
    v_storage_url text;
    v_upload_result jsonb;
    v_message_exists boolean;
BEGIN
    -- 🔍 Debug log
    RAISE NOTICE '[WORKER] 🔄 Processando mídia: message_id=%', p_message_id;
    
    -- ✅ Verificar se mensagem existe
    SELECT EXISTS(
        SELECT 1 FROM public.messages 
        WHERE id = p_message_id 
        AND media_type != 'text'
        AND source_edge = 'webhook_whatsapp_web'
    ) INTO v_message_exists;
    
    IF NOT v_message_exists THEN
        RAISE NOTICE '[WORKER] ❌ Mensagem não encontrada ou não é mídia: %', p_message_id;
        RETURN jsonb_build_object('success', false, 'error', 'Message not found or not media');
    END IF;
    
    -- 📦 Buscar mensagem na fila webhook_message_queue
    SELECT message INTO v_queue_msg
    FROM pgmq.read('webhook_message_queue', 1, 1)
    WHERE (message->>'message_id')::uuid = p_message_id;
    
    IF v_queue_msg IS NULL THEN
        RAISE NOTICE '[WORKER] ⚠️ Mensagem não encontrada na fila: %', p_message_id;
        RETURN jsonb_build_object('success', false, 'error', 'Message not in queue');
    END IF;
    
    -- 📋 Extrair dados da mensagem
    v_base64_data := v_queue_msg->>'base64_data';
    v_media_type := v_queue_msg->>'media_type';
    v_mime_type := v_queue_msg->>'mime_type';
    v_file_name := v_queue_msg->>'file_name';
    
    -- 🔍 Log dos dados extraídos
    RAISE NOTICE '[WORKER] 📋 Dados extraídos: media_type=%, base64_length=%, mime_type=%', 
        v_media_type, length(v_base64_data), v_mime_type;
    
    -- 🎯 Gerar URL do Storage
    v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' ||
                    'webhook/' || v_media_type || '/' ||
                    to_char(now(), 'YYYY-MM-DD') || '/' ||
                    'msg_' || substring(p_message_id::text, 1, 8) || '_' || 
                    extract(epoch from now())::text ||
                    CASE v_media_type
                        WHEN 'image' THEN '.jpg'
                        WHEN 'video' THEN '.mp4'
                        WHEN 'audio' THEN '.ogg'
                        WHEN 'document' THEN '.pdf'
                        WHEN 'sticker' THEN '.webp'
                        ELSE '.bin'
                    END;
    
    -- 📤 Simular upload (por enquanto só atualizar URL)
    -- TODO: Implementar upload real para Storage
    UPDATE public.messages
    SET 
        media_url = v_storage_url,
        updated_at = now()
    WHERE id = p_message_id;
    
    -- 🗑️ Remover mensagem da fila (marcar como processada)
    PERFORM pgmq.delete('webhook_message_queue', (
        SELECT msg_id FROM pgmq.read('webhook_message_queue', 1, 1)
        WHERE (message->>'message_id')::uuid = p_message_id
    ));
    
    -- ✅ Log de sucesso
    RAISE NOTICE '[WORKER] ✅ Mídia processada com sucesso: % -> %', p_message_id, v_storage_url;
    
    RETURN jsonb_build_object(
        'success', true,
        'message_id', p_message_id,
        'storage_url', v_storage_url,
        'media_type', v_media_type,
        'processed_at', now()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '[WORKER] ❌ Erro ao processar mídia: % - %', p_message_id, SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'message_id', p_message_id,
            'error', SQLERRM
        );
END;
$$;

-- ================================================================
-- 🎯 GRANT PERMISSIONS
-- ================================================================

GRANT EXECUTE ON FUNCTION public.process_webhook_media_isolated(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_webhook_media_isolated(UUID) TO authenticated;

-- ================================================================
-- 🔍 VERIFICAR SE FOI CRIADA
-- ================================================================

SELECT 
    '✅ WORKER ISOLADO CRIADO' as status,
    proname as function_name,
    pronargs as num_args,
    pg_get_function_identity_arguments(oid) as signature
FROM pg_proc
WHERE proname = 'process_webhook_media_isolated'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');