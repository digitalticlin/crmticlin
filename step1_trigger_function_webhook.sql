-- ================================================================
-- 🔥 STEP 1: TRIGGER FUNCTION PARA WORKER WEBHOOK
-- ================================================================

-- Função que será chamada pelo trigger quando mídia é inserida
CREATE OR REPLACE FUNCTION public.trigger_webhook_media_processor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- 🔍 Log para debug
    RAISE NOTICE '[TRIGGER] 🔥 Mídia detectada: message_id=%, media_type=%, source_edge=%', 
        NEW.id, NEW.media_type, NEW.source_edge;
    
    -- ⚡ PROCESSAR MÍDIA EM BACKGROUND (não bloqueia)
    -- Chama o worker isolado passando o message_id
    PERFORM pg_notify('webhook_media_channel', json_build_object(
        'message_id', NEW.id,
        'media_type', NEW.media_type,
        'source_edge', NEW.source_edge,
        'timestamp', extract(epoch from now())
    )::text);
    
    -- 📝 Log de sucesso
    RAISE NOTICE '[TRIGGER] ✅ Notificação enviada para worker: %', NEW.id;
    
    -- Retornar NEW para não afetar o INSERT
    RETURN NEW;
END;
$$;

-- ================================================================
-- 🎯 GRANT PERMISSIONS
-- ================================================================

-- Dar permissões necessárias para o trigger
GRANT EXECUTE ON FUNCTION public.trigger_webhook_media_processor() TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_webhook_media_processor() TO authenticated;

-- ================================================================
-- 🔍 VERIFICAR SE FOI CRIADA
-- ================================================================

SELECT 
    '✅ TRIGGER FUNCTION CRIADA' as status,
    proname as function_name,
    pronargs as num_args
FROM pg_proc
WHERE proname = 'trigger_webhook_media_processor'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');