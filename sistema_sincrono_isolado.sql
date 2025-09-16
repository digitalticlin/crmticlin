-- ================================================================
-- 🚀 SISTEMA SÍNCRONO ISOLADO: RPC + WORKER + TRIGGER
-- ================================================================

-- ESTRATÉGIA: RPC salva → Trigger executa Worker → URL gerada instantaneamente

-- ================================================================
-- 1️⃣ VERIFICAR TRIGGERS EXISTENTES
-- ================================================================

-- Ver todos os triggers na tabela messages
SELECT 
    'Triggers na tabela messages' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'messages'
ORDER BY trigger_name;

-- ================================================================
-- 2️⃣ WORKER SÍNCRONO ISOLADO (CORRIGIDO)
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
    v_storage_url TEXT;
    v_processed boolean := false;
BEGIN
    -- Buscar UMA mensagem específica na fila webhook_message_queue
    FOR v_message_id_queue, v_message_data IN
        SELECT msg_id, message 
        FROM pgmq.read('webhook_message_queue', 5, 10)
        WHERE message->>'message_id' = p_message_id::text
    LOOP
        -- Extrair dados
        v_media_type := v_message_data->>'media_type';
        v_base64_data := v_message_data->>'base64_data';
        
        -- Gerar URL isolada webhook
        v_storage_url := 'https://nruwnhcqhcdtxlqhygis.supabase.co/storage/v1/object/public/whatsapp-media/' ||
                        'webhook/' || v_media_type || '/' ||
                        to_char(now(), 'YYYY-MM-DD') || '/' ||
                        'msg_' || substring(p_message_id::text, 1, 8) || '_' || extract(epoch from now())::text ||
                        CASE v_media_type
                            WHEN 'image' THEN '.jpg'
                            WHEN 'video' THEN '.mp4'
                            WHEN 'audio' THEN '.ogg'
                            WHEN 'document' THEN '.pdf'
                            WHEN 'sticker' THEN '.webp'
                            ELSE '.bin'
                        END;
        
        -- Atualizar mensagem IMEDIATAMENTE
        UPDATE public.messages 
        SET media_url = v_storage_url
        WHERE id = p_message_id;
        
        -- Remover da fila
        PERFORM pgmq.delete('webhook_message_queue', v_message_id_queue);
        
        v_processed := true;
        EXIT; -- Processar apenas esta mensagem
    END LOOP;
    
    RETURN v_processed;
END;
$$;

-- ================================================================
-- 3️⃣ TRIGGER FUNCTION ISOLADA PARA WEBHOOK
-- ================================================================

CREATE OR REPLACE FUNCTION public.trigger_webhook_media_processing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Só processa se:
    -- 1. É mídia (não texto)
    -- 2. Ainda não tem URL
    -- 3. É do webhook (identificado por algum campo)
    IF NEW.media_type::text != 'text' 
       AND NEW.media_url IS NULL 
       AND NEW.import_source = 'webhook' THEN
        
        -- Executar processamento síncrono
        PERFORM webhook_process_media_sync(NEW.id);
        
        -- Recarregar dados da mensagem após processamento
        SELECT media_url INTO NEW.media_url
        FROM public.messages 
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- ================================================================
-- 4️⃣ APLICAR TRIGGER ISOLADO PARA WEBHOOK
-- ================================================================

-- Remover trigger existente se houver conflito
DROP TRIGGER IF EXISTS trigger_webhook_media_sync ON public.messages;

-- Criar trigger APÓS INSERT (não ANTES para evitar loops)
CREATE TRIGGER trigger_webhook_media_sync
    AFTER INSERT ON public.messages
    FOR EACH ROW
    WHEN (NEW.import_source = 'webhook' AND NEW.media_type::text != 'text' AND NEW.media_url IS NULL)
    EXECUTE FUNCTION trigger_webhook_media_processing();

-- ================================================================
-- 5️⃣ RPC ISOLADA FINAL (COM IDENTIFICAÇÃO WEBHOOK)
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

    -- Converter para enum
    v_media_type_enum := p_media_type::media_type;
    v_message_id := gen_random_uuid();

    -- 🎯 ENFILEIRAR DADOS ANTES DE INSERIR (PARA TRIGGER ENCONTRAR)
    IF p_media_type != 'text' AND p_base64_data IS NOT NULL THEN
        PERFORM pgmq.send(
            'webhook_message_queue',
            jsonb_build_object(
                'message_id', v_message_id,
                'media_type', p_media_type,
                'base64_data', p_base64_data,
                'mime_type', p_mime_type,
                'file_name', p_file_name
            )
        );
    END IF;

    -- 📝 INSERIR MENSAGEM (TRIGGER VAI PROCESSAR AUTOMATICAMENTE)
    INSERT INTO public.messages (
        id,
        text, 
        from_me, 
        media_type, 
        created_by_user_id,
        import_source,
        external_message_id
    )
    VALUES (
        v_message_id,
        v_message_text,
        p_from_me,
        v_media_type_enum,
        p_vps_instance_id,
        'webhook',  -- 🔑 IDENTIFICADOR PARA TRIGGER ISOLADO
        p_external_message_id
    );

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
-- 6️⃣ TESTE DO SISTEMA SÍNCRONO ISOLADO
-- ================================================================

-- Teste completo
SELECT save_received_message_webhook(
    '712e7708-2299-4a00-9128-577c8f113ca4'::UUID,
    '+5511999999999',
    'Teste sistema síncrono',
    false,
    'image',
    'sync_test_' || extract(epoch from now())::text,
    extract(epoch from now())::bigint,
    'base64_data_fake_test_sync_12345',
    'image/jpeg',
    'sync_test.jpg'
) as teste_sistema_sincrono;

-- Aguardar trigger (é instantâneo mas vamos dar 1 segundo)
SELECT pg_sleep(1);

-- Verificar se funcionou
SELECT 
    '🎯 SISTEMA SÍNCRONO ISOLADO' as resultado,
    id,
    text,
    media_type,
    import_source,
    CASE 
        WHEN media_url IS NOT NULL AND media_url LIKE '%webhook/%' THEN 'SÍNCRONO E ISOLADO ✅'
        WHEN media_url IS NOT NULL THEN 'PROCESSOU MAS NÃO ISOLADO ⚠️'
        ELSE 'NÃO PROCESSOU ❌'
    END as status_final,
    media_url
FROM public.messages 
WHERE import_source = 'webhook'
AND created_at > now() - interval '30 seconds'
ORDER BY created_at DESC
LIMIT 1;

-- Ver fila (deve estar vazia)
SELECT 
    'Status fila webhook após processamento' as info,
    (pgmq.metrics('webhook_message_queue')).queue_length as mensagens_restantes;