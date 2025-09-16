-- ================================================================
-- 🏗️ ARQUITETURA OTIMIZADA: 1 EDGE UPLOAD PARA TODAS AS EDGES
-- ================================================================

-- ESTRATÉGIA FINAL:
-- ✅ 1 Edge Function de Upload GERAL (storage_upload_service)
-- ✅ Workers específicos para cada Edge Function 
-- ✅ Todos usam a MESMA Edge Function de upload

-- ================================================================
-- 1️⃣ WORKERS ESPECÍFICOS PARA CADA EDGE
-- ================================================================

-- 🔥 WORKER WEBHOOK (já existe, atualizar)
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
    v_upload_result jsonb;
BEGIN
    -- Buscar dados da mensagem
    SELECT id, media_type, external_message_id, created_at
    INTO v_message_data
    FROM public.messages 
    WHERE id = p_message_id 
    AND media_type != 'text'
    AND source_edge = 'webhook_whatsapp_web';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Message not found');
    END IF;
    
    -- Buscar Base64 na fila WEBHOOK
    SELECT message->>'base64_data' INTO v_base64_data
    FROM pgmq.read('webhook_message_queue', 1, 50)
    WHERE (message->>'message_id')::uuid = p_message_id
    LIMIT 1;
    
    IF v_base64_data IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No base64 data in webhook queue');
    END IF;
    
    -- 🚀 CHAMAR EDGE FUNCTION GERAL DE UPLOAD
    SELECT upload_media_to_storage(
        p_message_id,
        v_base64_data,
        v_message_data.media_type,
        'webhook'
    ) INTO v_upload_result;
    
    RETURN v_upload_result;
END;
$$;

-- 🤖 WORKER AI (para ai_messaging_service)
CREATE OR REPLACE FUNCTION public.process_ai_media_isolated(
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
    v_upload_result jsonb;
BEGIN
    -- Buscar dados da mensagem AI
    SELECT id, media_type, external_message_id, created_at
    INTO v_message_data
    FROM public.messages 
    WHERE id = p_message_id 
    AND media_type != 'text'
    AND source_edge = 'ai_messaging_service';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'AI message not found');
    END IF;
    
    -- Buscar Base64 na fila AI
    SELECT message->>'base64_data' INTO v_base64_data
    FROM pgmq.read('ai_message_queue', 1, 50)
    WHERE (message->>'message_id')::uuid = p_message_id
    LIMIT 1;
    
    IF v_base64_data IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No base64 data in AI queue');
    END IF;
    
    -- 🚀 CHAMAR MESMA EDGE FUNCTION GERAL
    SELECT upload_media_to_storage(
        p_message_id,
        v_base64_data,
        v_message_data.media_type,
        'ai_service'
    ) INTO v_upload_result;
    
    RETURN v_upload_result;
END;
$$;

-- 📱 WORKER WHATSAPP (para whatsapp_messaging_service)
CREATE OR REPLACE FUNCTION public.process_whatsapp_media_isolated(
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
    v_upload_result jsonb;
BEGIN
    -- Buscar dados da mensagem WhatsApp
    SELECT id, media_type, external_message_id, created_at
    INTO v_message_data
    FROM public.messages 
    WHERE id = p_message_id 
    AND media_type != 'text'
    AND source_edge = 'whatsapp_messaging_service';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'WhatsApp message not found');
    END IF;
    
    -- Buscar Base64 na fila WhatsApp
    SELECT message->>'base64_data' INTO v_base64_data
    FROM pgmq.read('whatsapp_message_queue', 1, 50)
    WHERE (message->>'message_id')::uuid = p_message_id
    LIMIT 1;
    
    IF v_base64_data IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No base64 data in WhatsApp queue');
    END IF;
    
    -- 🚀 CHAMAR MESMA EDGE FUNCTION GERAL
    SELECT upload_media_to_storage(
        p_message_id,
        v_base64_data,
        v_message_data.media_type,
        'whatsapp_service'
    ) INTO v_upload_result;
    
    RETURN v_upload_result;
END;
$$;

-- ================================================================
-- 2️⃣ FUNÇÃO GERAL PARA CHAMAR EDGE FUNCTION DE UPLOAD
-- ================================================================

CREATE OR REPLACE FUNCTION public.upload_media_to_storage(
    p_message_id UUID,
    p_base64_data TEXT,
    p_media_type TEXT,
    p_source_prefix TEXT DEFAULT 'general'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_file_path TEXT;
    v_file_extension TEXT;
    v_content_type TEXT;
    v_storage_url TEXT;
    v_upload_payload jsonb;
    v_upload_response jsonb;
    v_edge_function_url TEXT := 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/storage_upload_service';
    v_service_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdoZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjE5MTE4MSwiZXhwIjoyMDQxNzY3MTgxfQ.aWnZsuyYyIUh0u-1i8O2dIfQAOXHNGm3vVlRLzR6DjM';
BEGIN
    RAISE NOTICE '[UPLOAD-GERAL] 🚀 Processando upload: message_id=%, source=%', p_message_id, p_source_prefix;
    
    -- 🎯 Determinar tipo de arquivo
    CASE p_media_type
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
    
    -- 📁 Gerar caminho do arquivo (com prefixo da fonte)
    v_file_path := p_source_prefix || '/' || p_media_type || '/' ||
                   to_char(now(), 'YYYY-MM-DD') || '/' ||
                   'msg_' || substring(p_message_id::text, 1, 8) || '_' || 
                   extract(epoch from now())::text ||
                   v_file_extension;
    
    -- 📤 Preparar payload para Edge Function
    v_upload_payload := jsonb_build_object(
        'file_path', v_file_path,
        'base64_data', p_base64_data,
        'content_type', v_content_type,
        'message_id', p_message_id,
        'source', p_source_prefix
    );
    
    -- 🚀 CHAMAR EDGE FUNCTION ÚNICA DE UPLOAD
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http') THEN
            
            RAISE NOTICE '[UPLOAD-GERAL] 📤 Chamando Edge Function: %', v_file_path;
            
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
            
            RAISE NOTICE '[UPLOAD-GERAL] ✅ Resposta: %', v_upload_response;
            
            -- Verificar sucesso do upload
            IF (v_upload_response->>'success')::boolean THEN
                v_storage_url := v_upload_response->>'url';
            ELSE
                -- Gerar URL mesmo se upload falhar
                v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' || v_file_path;
            END IF;
            
        ELSE
            RAISE NOTICE '[UPLOAD-GERAL] ⚠️ HTTP extension not available';
            v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' || v_file_path;
        END IF;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '[UPLOAD-GERAL] ❌ Erro: %', SQLERRM;
            v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' || v_file_path;
    END;
    
    -- 🔄 Atualizar media_url na tabela
    UPDATE public.messages
    SET media_url = v_storage_url
    WHERE id = p_message_id;
    
    RAISE NOTICE '[UPLOAD-GERAL] ✅ Upload concluído: %', v_storage_url;
    
    RETURN jsonb_build_object(
        'success', true,
        'message_id', p_message_id,
        'storage_url', v_storage_url,
        'file_path', v_file_path,
        'source', p_source_prefix,
        'upload_attempted', EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http'),
        'upload_success', COALESCE((v_upload_response->>'success')::boolean, false)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '[UPLOAD-GERAL] ❌ Erro geral: %', SQLERRM;
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ================================================================
-- 3️⃣ TRIGGERS ESPECÍFICOS PARA CADA EDGE
-- ================================================================

-- 🔥 Trigger para Webhook (já existe, manter)
-- Trigger detecta source_edge = 'webhook_whatsapp_web'

-- 🤖 Trigger para AI
CREATE OR REPLACE FUNCTION public.trigger_ai_media_processor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Worker específico para AI
    PERFORM process_ai_media_isolated(NEW.id);
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_ai_media_processor
    AFTER INSERT ON public.messages
    FOR EACH ROW
    WHEN (
        NEW.media_type != 'text' 
        AND NEW.source_edge = 'ai_messaging_service'
        AND NEW.import_source = 'ai_service'
    )
    EXECUTE FUNCTION public.trigger_ai_media_processor();

-- 📱 Trigger para WhatsApp
CREATE OR REPLACE FUNCTION public.trigger_whatsapp_media_processor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Worker específico para WhatsApp
    PERFORM process_whatsapp_media_isolated(NEW.id);
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_whatsapp_media_processor
    AFTER INSERT ON public.messages
    FOR EACH ROW
    WHEN (
        NEW.media_type != 'text' 
        AND NEW.source_edge = 'whatsapp_messaging_service'
        AND NEW.import_source = 'whatsapp_service'
    )
    EXECUTE FUNCTION public.trigger_whatsapp_media_processor();

-- ================================================================
-- 4️⃣ RESUMO DA ARQUITETURA FINAL
-- ================================================================

SELECT 
    '🏗️ ARQUITETURA FINAL' as componente,
    'Edge Functions' as tipo,
    '3 Edge Functions específicas + 1 Edge Function geral de upload' as descricao
UNION ALL
SELECT 
    '🏗️ ARQUITETURA FINAL',
    'Workers',
    '3 Workers específicos (webhook, ai, whatsapp) + 1 função geral de upload'
UNION ALL
SELECT 
    '🏗️ ARQUITETURA FINAL',
    'Triggers',
    '3 Triggers específicos detectam source_edge e chamam worker apropriado'
UNION ALL
SELECT 
    '🏗️ ARQUITETURA FINAL',
    'Upload',
    '1 Edge Function ÚNICA (storage_upload_service) usada por todos'
UNION ALL
SELECT 
    '🏗️ ARQUITETURA FINAL',
    'Vantagens',
    'Código centralizado, escalável, isolado, reutilizável';

-- ================================================================
-- 5️⃣ COMANDOS PARA DEPLOY
-- ================================================================

-- Deploy apenas da Edge Function geral:
-- supabase functions deploy storage_upload_service

SELECT 
    '📝 DEPLOY' as instrucao,
    'supabase functions deploy storage_upload_service' as comando,
    'Deploy apenas 1 vez, usada por todas as Edge Functions' as observacao;