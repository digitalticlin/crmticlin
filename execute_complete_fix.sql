-- ================================================================
-- EXECUÇÃO COMPLETA: CORREÇÃO + PROCESSAMENTO + VERIFICAÇÃO
-- ================================================================

-- 🎯 OBJETIVO: Aplicar correção e processar mensagens existentes

-- ================================================================
-- 1️⃣ APLICAR CORREÇÃO DA ESTRUTURA DE RETORNO
-- ================================================================

-- Corrigir save_received_message_webhook para retornar estrutura compatível
CREATE OR REPLACE FUNCTION public.save_received_message_webhook(
    p_vps_instance_id text,
    p_phone text,
    p_message_text text,
    p_from_me boolean DEFAULT false,
    p_media_type text DEFAULT 'text',
    p_media_url text DEFAULT NULL,
    p_external_message_id text DEFAULT NULL,
    p_contact_name text DEFAULT NULL,
    p_profile_pic_url text DEFAULT NULL,
    p_base64_data text DEFAULT NULL,
    p_mime_type text DEFAULT NULL,
    p_file_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_instance_id UUID;
    v_user_id UUID;
    v_lead_id UUID;
    v_message_id UUID;
    v_funnel_id UUID;
    v_stage_id UUID;
    v_phone_data jsonb;
    v_clean_phone text;
    v_display_name text;
    v_contact_name text;
    v_is_new_lead BOOLEAN := FALSE;
    v_current_profile_pic text;
    v_profile_pic_updated BOOLEAN := FALSE;
    v_has_media BOOLEAN := FALSE;
    v_media_emoji text;
    v_media_type_enum media_type;
BEGIN
    RAISE NOTICE '[save_received_message_webhook] 🚀 Processando com estrutura corrigida: %', p_vps_instance_id;

    -- ETAPA 1: Buscar instância
    SELECT id, created_by_user_id 
    INTO v_instance_id, v_user_id
    FROM public.whatsapp_instances 
    WHERE vps_instance_id = p_vps_instance_id;
    
    IF v_instance_id IS NULL THEN
        RAISE NOTICE '[save_received_message_webhook] ❌ Instância não encontrada: %', p_vps_instance_id;
        RETURN jsonb_build_object(
            'data', jsonb_build_object(
                'success', false,
                'error', 'Instance not found',
                'source', 'webhook'
            )
        );
    END IF;

    -- ETAPA 2: Formatação do telefone
    BEGIN
        v_phone_data := format_brazilian_phone(p_phone);
        v_clean_phone := v_phone_data->>'phone';
        v_display_name := v_phone_data->>'display';
    EXCEPTION WHEN OTHERS THEN
        v_clean_phone := split_part(p_phone, '@', 1);
        IF length(v_clean_phone) = 13 THEN
            v_display_name := '+55 (' || substring(v_clean_phone, 3, 2) || ') ' ||
                             substring(v_clean_phone, 5, 5) || '-' ||
                             substring(v_clean_phone, 10, 4);
        ELSE
            v_display_name := v_clean_phone;
        END IF;
    END;

    v_contact_name := v_display_name;

    -- ETAPA 3: Buscar funil e estágio  
    SELECT id INTO v_funnel_id
    FROM public.funnels 
    WHERE created_by_user_id = v_user_id 
    ORDER BY created_at ASC 
    LIMIT 1;

    SELECT id INTO v_stage_id
    FROM public.stages 
    WHERE funnel_id = v_funnel_id 
    ORDER BY order_position ASC 
    LIMIT 1;

    -- ETAPA 4: Buscar ou criar lead (sem stage_id se não existe)
    SELECT id INTO v_lead_id
    FROM public.leads 
    WHERE phone = v_clean_phone 
    AND funnel_id = v_funnel_id;
    
    IF v_lead_id IS NULL THEN
        INSERT INTO public.leads (
            name, phone, whatsapp_display_phone, profile_pic_url,
            funnel_id, created_by_user_id
        )
        VALUES (
            COALESCE(p_contact_name, v_contact_name),
            v_clean_phone,
            v_display_name,
            p_profile_pic_url,
            v_funnel_id,
            v_user_id
        )
        RETURNING id INTO v_lead_id;
        
        v_is_new_lead := TRUE;
    END IF;

    -- ETAPA 5: Determinar tipo de mídia e emoji
    BEGIN
        v_media_type_enum := p_media_type::media_type;
        v_has_media := (v_media_type_enum != 'text');
    EXCEPTION WHEN OTHERS THEN
        -- Se enum falhar, usar 'text' como fallback
        v_media_type_enum := 'text'::media_type;
        v_has_media := false;
    END;
    
    IF v_has_media THEN
        CASE v_media_type_enum
            WHEN 'image' THEN v_media_emoji := '📷 Imagem';
            WHEN 'video' THEN v_media_emoji := '🎥 Vídeo';
            WHEN 'audio' THEN v_media_emoji := '🎵 Áudio';
            WHEN 'document' THEN v_media_emoji := '📄 Documento';
            WHEN 'sticker' THEN v_media_emoji := '🎭 Sticker';
            ELSE v_media_emoji := '📎 Mídia';
        END CASE;
    END IF;

    -- ETAPA 6: Inserir mensagem
    INSERT INTO public.messages (
        text, from_me, timestamp, status, media_type, media_url,
        lead_id, whatsapp_number_id, created_by_user_id,
        external_message_id, import_source
    )
    VALUES (
        CASE 
            WHEN v_has_media THEN v_media_emoji
            ELSE p_message_text
        END,
        p_from_me,
        now(),
        'received',
        v_media_type_enum,
        NULL, -- Será preenchido pelo worker
        v_lead_id,
        v_instance_id,
        v_user_id,
        p_external_message_id,
        'webhook'
    )
    RETURNING id INTO v_message_id;

    -- ETAPA 7: Enfileirar mídia se necessário
    IF v_has_media AND p_base64_data IS NOT NULL THEN
        PERFORM pgmq.send('webhook_message_queue', jsonb_build_object(
            'action', 'process_media',
            'source', 'webhook',
            'priority', 'high',
            'message_id', v_message_id,
            'message_data', jsonb_build_object(
                'vps_instance_id', p_vps_instance_id,
                'phone', v_clean_phone,
                'message_text', p_message_text,
                'external_message_id', p_external_message_id
            ),
            'media_data', jsonb_build_object(
                'media_type', p_media_type,
                'media_url', p_media_url,
                'base64_data', p_base64_data,
                'mime_type', p_mime_type,
                'file_name', p_file_name
            ),
            'metadata', jsonb_build_object(
                'retry_count', 0,
                'created_at', now(),
                'is_new_lead', v_is_new_lead
            )
        ));
        
        RAISE NOTICE '[save_received_message_webhook] 📦 Mídia enfileirada: %', v_message_id;
    END IF;

    -- ETAPA 8: RETORNO ESTRUTURADO COMPATÍVEL COM EDGE FUNCTION
    RETURN jsonb_build_object(
        'data', jsonb_build_object(
            'success', true,
            'source', 'webhook',
            'message_id', v_message_id,
            'lead_id', v_lead_id,
            'is_new_lead', v_is_new_lead,
            'has_media', v_has_media,
            'media_queued', v_has_media,
            'instance_id', v_instance_id,
            'phone', v_clean_phone
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '[save_received_message_webhook] ❌ Erro: %', SQLERRM;
        
        RETURN jsonb_build_object(
            'data', jsonb_build_object(
                'success', false,
                'error', SQLERRM,
                'source', 'webhook'
            )
        );
END;
$$;

-- ================================================================
-- 2️⃣ TESTE IMEDIATO DA CORREÇÃO
-- ================================================================

DO $$
DECLARE
    v_test_result jsonb;
    v_message_id text;
BEGIN
    RAISE NOTICE '🧪 TESTANDO CORREÇÃO...';
    
    -- Teste com dados realistas
    SELECT save_received_message_webhook(
        '012c87cc-e10a-47e0-96c6-6f7d28beb7c6',
        '5511999999999@c.us',
        'Teste correção completa',
        false,
        'image',
        NULL,
        'COMPLETE_FIX_' || extract(epoch from now())::text,
        NULL,
        NULL,
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        'image/png',
        'complete_fix_test.png'
    ) INTO v_test_result;
    
    -- Extrair como Edge Function faria
    v_message_id := v_test_result->'data'->>'message_id';
    
    IF v_message_id IS NOT NULL THEN
        RAISE NOTICE '✅ CORREÇÃO FUNCIONOU: message_id = %', v_message_id;
    ELSE
        RAISE NOTICE '❌ CORREÇÃO FALHOU: %', v_test_result;
    END IF;
END $$;

-- ================================================================
-- 3️⃣ EXECUTAR WORKERS PARA PROCESSAR FILA
-- ================================================================

DO $$
DECLARE
    v_processed_total int := 0;
    v_worker_result jsonb;
    v_queue_length int;
BEGIN
    RAISE NOTICE '🚀 EXECUTANDO WORKERS PARA PROCESSAR FILA...';
    
    -- Executar worker até 20 vezes ou até fila vazia
    FOR i IN 1..20 LOOP
        -- Verificar se há mensagens
        SELECT (pgmq.metrics('webhook_message_queue')).queue_length INTO v_queue_length;
        
        IF v_queue_length = 0 THEN
            RAISE NOTICE '✅ Fila vazia após % execuções', i-1;
            EXIT;
        END IF;
        
        -- Executar worker
        BEGIN
            SELECT webhook_media_worker() INTO v_worker_result;
            
            IF (v_worker_result->>'success')::boolean = true THEN
                v_processed_total := v_processed_total + COALESCE((v_worker_result->>'processed_count')::int, 0);
                RAISE NOTICE '✅ Execução %: processadas %, falhas %', 
                    i, 
                    COALESCE((v_worker_result->>'processed_count')::int, 0),
                    COALESCE((v_worker_result->>'failed_count')::int, 0);
            ELSE
                RAISE NOTICE '❌ Execução % falhou: %', i, v_worker_result->>'error';
                EXIT;
            END IF;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '❌ Erro na execução %: %', i, SQLERRM;
                EXIT;
        END;
        
        -- Pequena pausa
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    RAISE NOTICE '🏁 WORKERS CONCLUÍDOS: % mensagens processadas', v_processed_total;
END $$;

-- ================================================================
-- 4️⃣ VERIFICAÇÃO COMPLETA DOS RESULTADOS
-- ================================================================

-- 4.1 Status atual da fila
SELECT 
    '📦 STATUS FILA APÓS CORREÇÃO' as status,
    (pgmq.metrics('webhook_message_queue')).queue_length as mensagens_restantes;

-- 4.2 Mensagens que agora têm Storage URL
SELECT 
    '✅ MENSAGENS COM STORAGE URL' as status,
    COUNT(*) as total_com_url,
    ROUND(
        COUNT(*)::numeric * 100.0 / NULLIF((
            SELECT COUNT(*) FROM messages 
            WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID
            AND media_type != 'text'
            AND created_at > now() - interval '2 hours'
        ), 0), 2
    ) as percentual_sucesso
FROM messages 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID
AND media_type != 'text'
AND media_url IS NOT NULL
AND media_url LIKE 'https://%'
AND created_at > now() - interval '2 hours';

-- 4.3 Últimas mensagens processadas com sucesso
SELECT 
    '🎯 ÚLTIMAS MENSAGENS PROCESSADAS' as status,
    id,
    text,
    media_type::text,
    CASE 
        WHEN media_url IS NOT NULL AND media_url LIKE 'https://%' THEN 'SUCESSO ✅'
        ELSE 'PENDENTE ⏳'
    END as status_url,
    external_message_id,
    created_at
FROM messages 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID
AND media_type != 'text'
AND created_at > now() - interval '2 hours'
ORDER BY created_at DESC
LIMIT 5;

-- ================================================================
-- 5️⃣ RESULTADO FINAL
-- ================================================================

SELECT 
    '🎯 RESULTADO FINAL DA CORREÇÃO' as status,
    'RPC agora retorna result.data.message_id' as correção_aplicada,
    'Workers processaram mensagens da fila' as processamento,
    'Storage URLs devem aparecer na coluna media_url' as expectativa;