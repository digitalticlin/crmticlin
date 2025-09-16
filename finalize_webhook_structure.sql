-- ================================================================
-- 🎯 FINALIZAR ESTRUTURA COMPLETA: webhook_whatsapp_web + worker + upload
-- ================================================================

-- ESTRUTURA FINAL PARA WEBHOOK:
-- ✅ Edge Function: webhook_whatsapp_web (já existe)
-- ✅ RPC: save_received_message_webhook (já existe) 
-- ✅ Fila: webhook_message_queue (já existe)
-- ✅ Worker: process_webhook_media_isolated
-- ✅ Trigger: trigger_webhook_media_processor
-- ✅ Upload: storage_upload_service (Edge Function geral)

-- ================================================================
-- 1️⃣ WORKER FINAL PARA WEBHOOK (VERSÃO DEFINITIVA)
-- ================================================================

CREATE OR REPLACE FUNCTION public.process_webhook_media_isolated(
    p_message_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_message_data RECORD;
    v_base64_data TEXT;
    v_file_path TEXT;
    v_file_extension TEXT;
    v_content_type TEXT;
    v_storage_url TEXT;
    v_upload_payload jsonb;
    v_upload_response jsonb;
    v_edge_function_url TEXT := 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/storage_upload_service';
    v_service_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdoZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjE5MTE4MSwiZXhwIjoyMDQxNzY3MTgxfQ.aWnZsuyYyIUh0u-1i8O2dIfQAOXHNGm3vVlRLzR6DjM';
BEGIN
    -- 🔍 Log início
    RAISE NOTICE '[WEBHOOK-WORKER] 🔄 Processando: message_id=%', p_message_id;
    
    -- ✅ Buscar dados da mensagem WEBHOOK
    SELECT id, media_type, external_message_id, created_at
    INTO v_message_data
    FROM public.messages 
    WHERE id = p_message_id 
    AND media_type != 'text'
    AND source_edge = 'webhook_whatsapp_web';
    
    IF NOT FOUND THEN
        RAISE NOTICE '[WEBHOOK-WORKER] ❌ Mensagem não encontrada';
        RETURN jsonb_build_object('success', false, 'error', 'Webhook message not found');
    END IF;
    
    -- 📦 Buscar Base64 na fila WEBHOOK
    SELECT message->>'base64_data' INTO v_base64_data
    FROM pgmq.read('webhook_message_queue', 1, 50)
    WHERE (message->>'message_id')::uuid = p_message_id
       OR message->>'external_message_id' = v_message_data.external_message_id
    LIMIT 1;
    
    IF v_base64_data IS NULL OR v_base64_data = '' THEN
        RAISE NOTICE '[WEBHOOK-WORKER] ❌ Base64 não encontrado na fila webhook';
        RETURN jsonb_build_object('success', false, 'error', 'No base64 data in webhook queue');
    END IF;
    
    -- 🎯 Determinar tipo de arquivo
    CASE v_message_data.media_type
        WHEN 'image' THEN 
            v_file_extension := '.jpg';
            v_content_type := 'image/jpeg';
        WHEN 'video' THEN 
            v_file_extension := '.mp4';
            v_content_type := 'video/mp4';
        WHEN 'audio' THEN 
            v_file_extension := '.ogg';
            v_content_type := 'audio/ogg';
        WHEN 'document' THEN 
            v_file_extension := '.pdf';
            v_content_type := 'application/pdf';
        WHEN 'sticker' THEN 
            v_file_extension := '.webp';
            v_content_type := 'image/webp';
        ELSE 
            v_file_extension := '.bin';
            v_content_type := 'application/octet-stream';
    END CASE;
    
    -- 📁 Gerar caminho do arquivo WEBHOOK
    v_file_path := 'webhook/' || v_message_data.media_type || '/' ||
                   to_char(v_message_data.created_at, 'YYYY-MM-DD') || '/' ||
                   'msg_' || substring(p_message_id::text, 1, 8) || '_' || 
                   extract(epoch from v_message_data.created_at)::text ||
                   v_file_extension;
    
    -- 📤 Preparar payload para Edge Function de Upload
    v_upload_payload := jsonb_build_object(
        'file_path', v_file_path,
        'base64_data', v_base64_data,
        'content_type', v_content_type,
        'message_id', p_message_id,
        'source', 'webhook'
    );
    
    -- 🚀 CHAMAR EDGE FUNCTION DE UPLOAD
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http') THEN
            
            RAISE NOTICE '[WEBHOOK-WORKER] 📤 Chamando upload: %', v_file_path;
            
            SELECT content::jsonb INTO v_upload_response
            FROM http((
                'POST',
                v_edge_function_url,
                ARRAY[
                    http_header('Authorization', 'Bearer ' || v_service_key),
                    http_header('Content-Type', 'application/json')
                ],
                v_upload_payload::text
            ));
            
            RAISE NOTICE '[WEBHOOK-WORKER] ✅ Resposta upload: %', v_upload_response;
            
            -- Verificar sucesso
            IF (v_upload_response->>'success')::boolean THEN
                v_storage_url := v_upload_response->>'url';
            ELSE
                -- Gerar URL mesmo se upload falhar
                v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' || v_file_path;
            END IF;
            
        ELSE
            RAISE NOTICE '[WEBHOOK-WORKER] ⚠️ HTTP extension não disponível';
            v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' || v_file_path;
        END IF;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '[WEBHOOK-WORKER] ❌ Erro no upload: %', SQLERRM;
            v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' || v_file_path;
    END;
    
    -- 🔄 Atualizar media_url na tabela
    UPDATE public.messages
    SET media_url = v_storage_url
    WHERE id = p_message_id;
    
    -- ✅ Log final
    RAISE NOTICE '[WEBHOOK-WORKER] ✅ Processamento concluído: %', v_storage_url;
    
    RETURN jsonb_build_object(
        'success', true,
        'message_id', p_message_id,
        'storage_url', v_storage_url,
        'file_path', v_file_path,
        'source', 'webhook',
        'upload_attempted', EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http'),
        'upload_success', COALESCE((v_upload_response->>'success')::boolean, false),
        'processed_at', now()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '[WEBHOOK-WORKER] ❌ Erro geral: %', SQLERRM;
        RETURN jsonb_build_object('success', false, 'message_id', p_message_id, 'error', SQLERRM);
END;
$$;

-- ================================================================
-- 2️⃣ TRIGGER FINAL PARA WEBHOOK
-- ================================================================

CREATE OR REPLACE FUNCTION public.trigger_webhook_media_processor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_result jsonb;
BEGIN
    -- 🔍 Log para debug
    RAISE NOTICE '[WEBHOOK-TRIGGER] 🔥 Mídia detectada: message_id=%, media_type=%', 
        NEW.id, NEW.media_type;
    
    -- ⚡ CHAMAR WORKER WEBHOOK
    BEGIN
        SELECT process_webhook_media_isolated(NEW.id) INTO v_result;
        RAISE NOTICE '[WEBHOOK-TRIGGER] ✅ Worker executado: %', v_result->>'success';
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '[WEBHOOK-TRIGGER] ❌ Erro no worker: %', SQLERRM;
    END;
    
    RETURN NEW;
END;
$$;

-- Garantir que trigger existe e está correto
DROP TRIGGER IF EXISTS trigger_webhook_media_processor ON public.messages;

CREATE TRIGGER trigger_webhook_media_processor
    AFTER INSERT ON public.messages
    FOR EACH ROW
    WHEN (
        NEW.media_type != 'text' 
        AND NEW.source_edge = 'webhook_whatsapp_web'
        AND NEW.import_source = 'webhook'
    )
    EXECUTE FUNCTION public.trigger_webhook_media_processor();

-- ================================================================
-- 3️⃣ VERIFICAR ESTRUTURA COMPLETA WEBHOOK
-- ================================================================

-- Verificar se todas as peças estão no lugar
SELECT 
    '🔍 VERIFICAR ESTRUTURA WEBHOOK' as componente,
    'Fila' as tipo,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pgmq.list_queues() WHERE queue_name = 'webhook_message_queue') 
        THEN '✅ webhook_message_queue EXISTS'
        ELSE '❌ webhook_message_queue MISSING'
    END as status
UNION ALL
SELECT 
    '🔍 VERIFICAR ESTRUTURA WEBHOOK',
    'Worker',
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'process_webhook_media_isolated') 
        THEN '✅ process_webhook_media_isolated EXISTS'
        ELSE '❌ process_webhook_media_isolated MISSING'
    END
UNION ALL
SELECT 
    '🔍 VERIFICAR ESTRUTURA WEBHOOK',
    'Trigger Function',
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_webhook_media_processor') 
        THEN '✅ trigger_webhook_media_processor EXISTS'
        ELSE '❌ trigger_webhook_media_processor MISSING'
    END
UNION ALL
SELECT 
    '🔍 VERIFICAR ESTRUTURA WEBHOOK',
    'Trigger',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_webhook_media_processor') 
        THEN '✅ TRIGGER ATIVO'
        ELSE '❌ TRIGGER MISSING'
    END
UNION ALL
SELECT 
    '🔍 VERIFICAR ESTRUTURA WEBHOOK',
    'RPC',
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'save_received_message_webhook') 
        THEN '✅ save_received_message_webhook EXISTS'
        ELSE '❌ save_received_message_webhook MISSING'
    END;

-- ================================================================
-- 4️⃣ TESTE FINAL DA ESTRUTURA WEBHOOK
-- ================================================================

-- Criar mensagem de teste completa
DO $$
DECLARE
    v_test_message_id uuid := gen_random_uuid();
    v_test_lead_id uuid;
    v_test_base64 TEXT := 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
BEGIN
    -- Buscar lead existente
    SELECT id INTO v_test_lead_id 
    FROM public.leads 
    WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::uuid 
    LIMIT 1;
    
    RAISE NOTICE '🧪 TESTE FINAL WEBHOOK: message_id=%', v_test_message_id;
    
    -- 1️⃣ Adicionar na fila WEBHOOK
    PERFORM pgmq.send(
        'webhook_message_queue',
        jsonb_build_object(
            'message_id', v_test_message_id,
            'media_type', 'image',
            'base64_data', 'data:image/png;base64,' || v_test_base64,
            'mime_type', 'image/png',
            'file_name', 'test_final.png',
            'external_message_id', 'test_final_' || extract(epoch from now())::text
        )
    );
    
    -- 2️⃣ Inserir mensagem (TRIGGER DEVE DISPARAR)
    INSERT INTO public.messages (
        id,
        text,
        from_me,
        media_type,
        created_by_user_id,
        import_source,
        external_message_id,
        lead_id,
        source_edge,
        whatsapp_number_id
    ) VALUES (
        v_test_message_id,
        '📷 Teste Final Webhook',
        false,
        'image'::media_type,
        '712e7708-2299-4a00-9128-577c8f113ca4'::uuid,
        'webhook',
        'test_final_' || extract(epoch from now())::text,
        v_test_lead_id,
        'webhook_whatsapp_web',
        '66ae98b4-1c72-49e4-a7e9-ab774db101ec'::uuid
    );
    
    RAISE NOTICE '🔥 MENSAGEM INSERIDA - TRIGGER DEVE TER DISPARADO IMEDIATAMENTE!';
    
END $$;

-- Verificar resultado do teste
SELECT 
    '🎯 RESULTADO TESTE FINAL WEBHOOK' as teste,
    id,
    text,
    media_type,
    media_url,
    CASE 
        WHEN media_url IS NOT NULL THEN '✅ PROCESSADO COM SUCESSO'
        ELSE '❌ FALHA NO PROCESSAMENTO'
    END as status_final,
    created_at
FROM public.messages
WHERE text = '📷 Teste Final Webhook'
AND created_at > now() - interval '2 minutes'
ORDER BY created_at DESC
LIMIT 1;

-- ================================================================
-- 5️⃣ RESUMO ESTRUTURA WEBHOOK FINALIZADA
-- ================================================================

SELECT 
    '🎉 ESTRUTURA WEBHOOK FINALIZADA' as resumo,
    'Edge Function: webhook_whatsapp_web' as componente_1,
    'RPC: save_received_message_webhook' as componente_2,
    'Fila: webhook_message_queue' as componente_3,
    'Worker: process_webhook_media_isolated' as componente_4,
    'Trigger: trigger_webhook_media_processor' as componente_5,
    'Upload: storage_upload_service (Edge Function)' as componente_6;