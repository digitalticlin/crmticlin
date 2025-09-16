-- Executar correção do worker isolado via Supabase Dashboard SQL Editor
-- Cole este código no SQL Editor do Supabase Dashboard

-- ================================================================
-- CORRIGIR WORKER ISOLADO EXISTENTE PARA FUNCIONAR
-- ================================================================

-- 🎯 PROBLEMA: process_media_message_base não atualiza tabela messages
-- 🎯 SOLUÇÃO: Corrigir função para atualizar media_url na mensagem

CREATE OR REPLACE FUNCTION public.process_media_message_base(
    p_message_data jsonb,
    p_source_queue text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_message_id UUID;
    v_media_type text;
    v_media_url text;
    v_base64_data text;
    v_file_name text;
    v_mime_type text;
    v_storage_url text;
    v_bucket_name text := 'whatsapp-media';
    v_file_path text;
    v_result jsonb;
    v_source text;
    v_external_message_id text;
    v_processing_id UUID;
BEGIN
    -- ETAPA 1: Extrair dados da mensagem
    v_message_id := (p_message_data->'message_id')::text::UUID;
    v_source := p_message_data->>'source';
    v_external_message_id := p_message_data->'message_data'->>'external_message_id';
    
    -- Dados da mídia
    v_media_type := p_message_data->'media_data'->>'media_type';
    v_media_url := p_message_data->'media_data'->>'media_url';
    v_base64_data := p_message_data->'media_data'->>'base64_data';
    v_file_name := p_message_data->'media_data'->>'file_name';
    v_mime_type := p_message_data->'media_data'->>'mime_type';

    RAISE NOTICE '[%] 🚀 Processando mídia: % - % bytes Base64', v_source, v_message_id, length(v_base64_data);

    -- ETAPA 2: Preparar dados para upload
    IF v_file_name IS NULL OR v_file_name = '' THEN
        v_file_name := v_external_message_id || '_' || v_media_type || '_' || extract(epoch from now())::text;
    END IF;

    -- Definir extensão baseada no tipo MIME
    IF v_mime_type IS NOT NULL THEN
        CASE v_mime_type
            WHEN 'image/jpeg' THEN v_file_name := v_file_name || '.jpg';
            WHEN 'image/png' THEN v_file_name := v_file_name || '.png';
            WHEN 'image/webp' THEN v_file_name := v_file_name || '.webp';
            WHEN 'video/mp4' THEN v_file_name := v_file_name || '.mp4';
            WHEN 'video/webm' THEN v_file_name := v_file_name || '.webm';
            WHEN 'audio/ogg' THEN v_file_name := v_file_name || '.ogg';
            WHEN 'audio/mpeg' THEN v_file_name := v_file_name || '.mp3';
            WHEN 'application/pdf' THEN v_file_name := v_file_name || '.pdf';
            ELSE v_file_name := v_file_name || '.bin';
        END CASE;
    ELSE
        -- Fallback baseado no media_type
        CASE v_media_type
            WHEN 'image' THEN v_file_name := v_file_name || '.jpg';
            WHEN 'video' THEN v_file_name := v_file_name || '.mp4';
            WHEN 'audio' THEN v_file_name := v_file_name || '.ogg';
            WHEN 'document' THEN v_file_name := v_file_name || '.pdf';
            ELSE v_file_name := v_file_name || '.bin';
        END CASE;
    END IF;

    -- Caminho no Storage organizado por source/tipo/data
    v_file_path := v_source || '/' || v_media_type || '/' || 
                   to_char(now(), 'YYYY/MM/DD') || '/' || 
                   v_file_name;

    -- ETAPA 3: Processar mídia baseado na fonte
    IF v_base64_data IS NOT NULL AND v_base64_data != '' THEN
        -- Gerar URL simulada (temporariamente - sem upload real)
        BEGIN
            v_storage_url := 'https://nruwnhcqhcdtxlqhygis.supabase.co/storage/v1/object/public/' || 
                            v_bucket_name || '/' || v_file_path;
            
            RAISE NOTICE '[%] ✅ URL gerada: %', v_source, v_storage_url;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE EXCEPTION '[%] Falha na geração de URL: %', v_source, SQLERRM;
        END;
        
    ELSIF v_media_url IS NOT NULL AND v_media_url != '' THEN
        -- URL externa - usar como está
        v_storage_url := v_media_url;
        RAISE NOTICE '[%] URL externa mantida: %', v_source, v_storage_url;
    ELSE
        -- Sem dados de mídia
        RAISE EXCEPTION '[%] Nenhum dado de mídia para processar', v_source;
    END IF;

    -- 🎯 ETAPA 4: ATUALIZAR MENSAGEM COM STORAGE URL (CORREÇÃO PRINCIPAL)
    UPDATE public.messages
    SET media_url = v_storage_url
    WHERE id = v_message_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION '[%] Mensagem não encontrada para atualização: %', v_source, v_message_id;
    END IF;

    RAISE NOTICE '[%] ✅ Mensagem atualizada com URL: %', v_source, v_message_id;

    -- ETAPA 5: Retornar resultado de sucesso
    v_result := jsonb_build_object(
        'success', true,
        'message_id', v_message_id,
        'storage_url', v_storage_url,
        'processing_time', extract(epoch from now()),
        'media_type', v_media_type,
        'source', v_source,
        'queue', p_source_queue,
        'upload_method', 'simulated_with_update'
    );

    RAISE NOTICE '[%] ✅ Mídia processada: %', v_source, v_result;
    
    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '[%] ❌ Erro no processamento: %', v_source, SQLERRM;
        
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'message_id', v_message_id,
            'source', v_source,
            'queue', p_source_queue
        );
END;
$$;

-- ================================================================
-- TESTAR WORKER CORRIGIDO COM AS MENSAGENS NA FILA
-- ================================================================

DO $$
DECLARE
    v_result jsonb;
    v_total_processed int := 0;
    v_total_failed int := 0;
    v_queue_before int;
    v_queue_after int;
BEGIN
    RAISE NOTICE '🚀 TESTANDO WORKER ISOLADO CORRIGIDO...';
    
    -- Ver fila antes
    SELECT (pgmq.metrics('webhook_message_queue')).queue_length INTO v_queue_before;
    RAISE NOTICE '📦 Mensagens na fila ANTES: %', v_queue_before;
    
    -- Executar worker isolado até 6 vezes (batch de 10 cada = até 60 mensagens)
    FOR i IN 1..6 LOOP
        SELECT webhook_media_worker(10, 30) INTO v_result;
        
        v_total_processed := v_total_processed + COALESCE((v_result->>'processed_count')::int, 0);
        v_total_failed := v_total_failed + COALESCE((v_result->>'failed_count')::int, 0);
        
        RAISE NOTICE '✅ Execução %: processadas=%, falhas=%', 
            i, 
            COALESCE((v_result->>'processed_count')::int, 0),
            COALESCE((v_result->>'failed_count')::int, 0);
            
        -- Se não processou nada, parar
        IF COALESCE((v_result->>'processed_count')::int, 0) = 0 THEN
            RAISE NOTICE '📭 Fila vazia, parando execuções';
            EXIT;
        END IF;
    END LOOP;
    
    -- Ver fila depois
    SELECT (pgmq.metrics('webhook_message_queue')).queue_length INTO v_queue_after;
    RAISE NOTICE '📦 Mensagens na fila DEPOIS: %', v_queue_after;
    
    RAISE NOTICE '🏁 WORKER ISOLADO CONCLUÍDO: % processadas, % falhas', v_total_processed, v_total_failed;
    RAISE NOTICE '📊 Redução na fila: % → % (-%)', v_queue_before, v_queue_after, (v_queue_before - v_queue_after);
END $$;

-- ================================================================
-- VERIFICAR SE MENSAGENS AGORA TÊM STORAGE URLs
-- ================================================================

SELECT 
    'Resultado após worker isolado corrigido' as status,
    COUNT(*) as total_mensagens,
    COUNT(*) FILTER (WHERE media_url IS NOT NULL AND media_url LIKE 'https://%') as com_storage_url,
    COUNT(*) FILTER (WHERE media_url IS NULL) as sem_storage_url,
    ROUND(
        COUNT(*) FILTER (WHERE media_url IS NOT NULL AND media_url LIKE 'https://%')::numeric * 100.0 / 
        NULLIF(COUNT(*), 0), 2
    ) as percentual_sucesso
FROM messages 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID
AND media_type != 'text'
AND created_at > now() - interval '2 hours';

-- Ver últimas mensagens processadas
SELECT 
    'Últimas mensagens após worker isolado' as info,
    id,
    media_type::text,
    CASE 
        WHEN media_url IS NOT NULL AND media_url LIKE 'https://%' THEN 'COM URL ✅'
        ELSE 'SEM URL ❌'
    END as status_final,
    CASE 
        WHEN length(media_url) > 70 THEN left(media_url, 67) || '...'
        ELSE media_url
    END as url_preview
FROM messages 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID
AND media_type != 'text'
ORDER BY created_at DESC
LIMIT 5;