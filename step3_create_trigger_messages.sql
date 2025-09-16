-- ================================================================
-- 🔥 STEP 3: CRIAR TRIGGER NA TABELA MESSAGES
-- ================================================================

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_webhook_media_processor ON public.messages;

-- Criar trigger que dispara APENAS para mídia do webhook_whatsapp_web
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
-- 🔍 VERIFICAR SE FOI CRIADO
-- ================================================================

SELECT 
    '✅ TRIGGER CRIADO NA TABELA MESSAGES' as status,
    trigger_name,
    event_manipulation,
    action_timing,
    action_condition,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_webhook_media_processor'
AND event_object_table = 'messages';

-- ================================================================
-- 🎯 LISTENER PARA PROCESSAR NOTIFICAÇÕES
-- ================================================================

-- Função que escuta notificações e chama o worker
CREATE OR REPLACE FUNCTION public.webhook_media_listener()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    notification jsonb;
    message_id uuid;
    result jsonb;
BEGIN
    -- Escutar canal webhook_media_channel
    LISTEN webhook_media_channel;
    
    -- Processar notificação
    FOR notification IN 
        SELECT payload::jsonb 
        FROM pg_notify('webhook_media_channel', '{"test": true}')
    LOOP
        message_id := (notification->>'message_id')::uuid;
        
        -- Chamar worker isolado
        SELECT process_webhook_media_isolated(message_id) INTO result;
        
        RAISE NOTICE '[LISTENER] Processado: %', result;
    END LOOP;
END;
$$;

-- ================================================================
-- 📊 TESTE DE FUNCIONAMENTO
-- ================================================================

-- Função para testar o sistema completo
CREATE OR REPLACE FUNCTION public.test_webhook_trigger_system()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_test_message_id uuid;
    v_test_lead_id uuid;
    v_result jsonb;
BEGIN
    -- Criar lead de teste
    INSERT INTO public.leads (
        phone, name, created_by_user_id, import_source
    ) VALUES (
        '+5511999999999', 'Teste Trigger', 
        '712e7708-2299-4a00-9128-577c8f113ca4'::uuid, 'webhook'
    ) ON CONFLICT (phone, created_by_user_id) DO UPDATE SET
        updated_at = now()
    RETURNING id INTO v_test_lead_id;
    
    v_test_message_id := gen_random_uuid();
    
    -- Enfileirar mensagem de teste na fila
    PERFORM pgmq.send(
        'webhook_message_queue',
        jsonb_build_object(
            'message_id', v_test_message_id,
            'media_type', 'image',
            'base64_data', 'data:image/jpeg;base64,TEST_DATA',
            'mime_type', 'image/jpeg',
            'file_name', 'test_trigger.jpg'
        )
    );
    
    -- Inserir mensagem (deve disparar o trigger)
    INSERT INTO public.messages (
        id, text, from_me, media_type, created_by_user_id,
        import_source, external_message_id, lead_id,
        source_edge
    ) VALUES (
        v_test_message_id,
        '📷 Imagem',
        false,
        'image'::media_type,
        '712e7708-2299-4a00-9128-577c8f113ca4'::uuid,
        'webhook',
        'test_trigger_' || extract(epoch from now())::text,
        v_test_lead_id,
        'webhook_whatsapp_web'
    );
    
    -- Verificar se trigger disparou
    RETURN jsonb_build_object(
        'success', true,
        'test_message_id', v_test_message_id,
        'trigger_should_fire', true,
        'check_logs', 'Verificar logs para [TRIGGER] 🔥 Mídia detectada'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;