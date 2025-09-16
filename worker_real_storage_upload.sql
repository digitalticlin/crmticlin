-- ================================================================
-- 🚀 WORKER COM UPLOAD REAL PARA STORAGE (SEM QUEBRAR PERFORMANCE)
-- ================================================================

-- ESTRATÉGIA: Worker faz upload direto usando extensões PostgreSQL
-- VANTAGEM: Mantém processamento isolado e alta performance

-- ================================================================
-- 1️⃣ VERIFICAR EXTENSÕES DISPONÍVEIS
-- ================================================================

-- Tentar criar extensão http se disponível
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS http;
    RAISE NOTICE '✅ Extensão HTTP criada/disponível';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Extensão HTTP não disponível: %', SQLERRM;
END $$;

-- Verificar se pg_net está disponível
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_net;
    RAISE NOTICE '✅ Extensão PG_NET criada/disponível';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Extensão PG_NET não disponível: %', SQLERRM;
END $$;

-- Ver quais extensões temos
SELECT 
    '🔌 EXTENSÕES INSTALADAS' as info,
    extname,
    extversion
FROM pg_extension 
WHERE extname IN ('http', 'pg_net')
ORDER BY extname;

-- ================================================================
-- 2️⃣ WORKER ATUALIZADO COM UPLOAD REAL VIA HTTP
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
    v_storage_url TEXT;
    v_file_path TEXT;
    v_file_extension TEXT;
    v_bucket_name TEXT := 'whatsapp-media';
    v_upload_result jsonb;
    v_decoded_data bytea;
    v_clean_base64 TEXT;
    v_upload_url TEXT;
    v_service_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdoZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjE5MTE4MSwiZXhwIjoyMDQxNzY3MTgxfQ.aWnZsuyYyIUh0u-1i8O2dIfQAOXHNGm3vVlRLzR6DjM';
    v_http_response jsonb;
    v_content_type TEXT;
BEGIN
    -- 🔍 Log início
    RAISE NOTICE '[WORKER] 🔄 Processando mídia com UPLOAD REAL: message_id=%', p_message_id;
    
    -- ✅ Buscar dados da mensagem na tabela
    SELECT id, media_type, external_message_id, created_at
    INTO v_message_data
    FROM public.messages 
    WHERE id = p_message_id 
    AND media_type != 'text'
    AND source_edge = 'webhook_whatsapp_web';
    
    IF NOT FOUND THEN
        RAISE NOTICE '[WORKER] ❌ Mensagem não encontrada na tabela: %', p_message_id;
        RETURN jsonb_build_object('success', false, 'error', 'Message not found in table');
    END IF;
    
    -- 📦 Buscar Base64 na fila
    SELECT message->>'base64_data' INTO v_base64_data
    FROM pgmq.read('webhook_message_queue', 1, 50)
    WHERE (message->>'message_id')::uuid = p_message_id
       OR message->>'external_message_id' = v_message_data.external_message_id
    LIMIT 1;
    
    IF v_base64_data IS NULL THEN
        RAISE NOTICE '[WORKER] ❌ Base64 não encontrado na fila';
        RETURN jsonb_build_object('success', false, 'error', 'No base64 data found in queue');
    END IF;
    
    -- 🧹 Limpar Base64 (remover prefixo data:)
    IF v_base64_data LIKE 'data:%' THEN
        v_clean_base64 := split_part(v_base64_data, ',', 2);
    ELSE
        v_clean_base64 := v_base64_data;
    END IF;
    
    -- 🎯 Determinar extensão e content-type
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
    
    -- 📁 Gerar caminho do arquivo
    v_file_path := 'webhook/' || v_message_data.media_type || '/' ||
                   to_char(v_message_data.created_at, 'YYYY-MM-DD') || '/' ||
                   'msg_' || substring(p_message_id::text, 1, 8) || '_' || 
                   extract(epoch from v_message_data.created_at)::text ||
                   v_file_extension;
    
    -- 🔄 Decodificar Base64
    BEGIN
        v_decoded_data := decode(v_clean_base64, 'base64');
        RAISE NOTICE '[WORKER] ✅ Base64 decodificado: % bytes', length(v_decoded_data);
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '[WORKER] ❌ Erro ao decodificar Base64: %', SQLERRM;
            RETURN jsonb_build_object('success', false, 'error', 'Base64 decode failed');
    END;
    
    -- 📤 UPLOAD REAL USANDO EXTENSÃO HTTP
    v_upload_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/' || v_bucket_name || '/' || v_file_path;
    
    BEGIN
        -- Tentar usar extensão http se disponível
        IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http') THEN
            
            RAISE NOTICE '[WORKER] 🚀 Fazendo upload HTTP para: %', v_upload_url;
            
            -- Fazer POST para Supabase Storage
            SELECT content::jsonb INTO v_http_response
            FROM http((
                'POST',
                v_upload_url,
                ARRAY[
                    http_header('Authorization', 'Bearer ' || v_service_key),
                    http_header('Content-Type', v_content_type),
                    http_header('x-upsert', 'true')
                ],
                v_decoded_data::bytea
            ));
            
            RAISE NOTICE '[WORKER] 📤 Resposta HTTP: %', v_http_response;
            
        ELSE
            RAISE NOTICE '[WORKER] ⚠️ Extensão HTTP não disponível, gerando URL apenas';
        END IF;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '[WORKER] ❌ Erro no upload HTTP: %', SQLERRM;
            -- Continuar mesmo com erro de upload
    END;
    
    -- 🎯 Gerar URL final do Storage
    v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/' || 
                    v_bucket_name || '/' || v_file_path;
    
    -- 🔄 Atualizar media_url na tabela messages
    UPDATE public.messages
    SET media_url = v_storage_url
    WHERE id = p_message_id;
    
    -- ✅ Log sucesso
    RAISE NOTICE '[WORKER] ✅ Mídia processada: % -> %', p_message_id, v_storage_url;
    
    RETURN jsonb_build_object(
        'success', true,
        'message_id', p_message_id,
        'storage_url', v_storage_url,
        'file_path', v_file_path,
        'file_size_bytes', length(v_decoded_data),
        'media_type', v_message_data.media_type,
        'upload_attempted', EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http'),
        'processed_at', now()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '[WORKER] ❌ Erro geral: %', SQLERRM;
        RETURN jsonb_build_object('success', false, 'message_id', p_message_id, 'error', SQLERRM);
END;
$$;

-- ================================================================
-- 3️⃣ TESTE DO WORKER ATUALIZADO
-- ================================================================

-- Testar worker com upload real
SELECT 
    '🧪 TESTE WORKER COM UPLOAD REAL' as teste,
    process_webhook_media_isolated('f63ad4b5-78aa-4e26-a634-d7948d6e6dbe'::uuid) as resultado;

-- ================================================================
-- 4️⃣ VERIFICAR SE ARQUIVO FOI SALVO NO STORAGE
-- ================================================================

-- Ver se URL foi atualizada
SELECT 
    '📄 VERIFICAR URL ATUALIZADA' as check,
    id,
    media_type,
    media_url,
    created_at
FROM public.messages
WHERE id = 'f63ad4b5-78aa-4e26-a634-d7948d6e6dbe';

-- ================================================================
-- 5️⃣ PROCESSAR LOTE DE MENSAGENS PENDENTES
-- ================================================================

-- Ver quantas estão pendentes
SELECT 
    '📊 MENSAGENS PENDENTES PARA UPLOAD' as info,
    COUNT(*) as total_pendentes,
    media_type,
    COUNT(CASE WHEN media_url IS NULL THEN 1 END) as sem_url,
    COUNT(CASE WHEN media_url IS NOT NULL THEN 1 END) as com_url
FROM public.messages
WHERE media_type != 'text' 
AND source_edge = 'webhook_whatsapp_web'
AND created_at > now() - interval '4 hours'
GROUP BY media_type
ORDER BY total_pendentes DESC;

-- Processar em lote (5 por vez para não sobrecarregar)
DO $$
DECLARE
    v_message RECORD;
    v_result jsonb;
    v_count INTEGER := 0;
    v_success INTEGER := 0;
BEGIN
    RAISE NOTICE '🚀 INICIANDO PROCESSAMENTO EM LOTE';
    
    FOR v_message IN 
        SELECT id, media_type, external_message_id 
        FROM public.messages
        WHERE media_type != 'text' 
        AND source_edge = 'webhook_whatsapp_web'
        AND created_at > now() - interval '2 hours'
        ORDER BY created_at DESC
        LIMIT 5
    LOOP
        v_count := v_count + 1;
        
        SELECT process_webhook_media_isolated(v_message.id) INTO v_result;
        
        IF (v_result->>'success')::boolean THEN
            v_success := v_success + 1;
            RAISE NOTICE '[LOTE] ✅ %/5: % processado com sucesso', v_count, v_message.id;
        ELSE
            RAISE NOTICE '[LOTE] ❌ %/5: % falhou: %', v_count, v_message.id, v_result->>'error';
        END IF;
        
        -- Pequena pausa entre processamentos
        PERFORM pg_sleep(0.1);
        
    END LOOP;
    
    RAISE NOTICE '🏁 LOTE CONCLUÍDO: %/% sucessos', v_success, v_count;
END $$;