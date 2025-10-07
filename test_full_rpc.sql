-- Teste completo do RPC com dados reais de áudio

DO $$
DECLARE
    v_result jsonb;
    v_mime_type text := 'audio/ogg; codecs=opus';
    v_media_type text := 'audio';
    v_extension text;
BEGIN
    -- Testar helper function diretamente
    v_extension := get_file_extension_from_mime(v_mime_type, v_media_type);
    RAISE NOTICE '🎯 Teste Helper: mime=%, type=%, ext=%', v_mime_type, v_media_type, v_extension;

    -- Testar file_path que seria gerado
    RAISE NOTICE '📂 File path: webhook/%/%', 'instance-id', 'message-id' || '.' || v_extension;

    -- Verificar se a função existe e está ativa
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'save_received_message_webhook'
        AND prosrc LIKE '%get_file_extension_from_mime%'
    ) THEN
        RAISE EXCEPTION '❌ RPC NÃO está usando get_file_extension_from_mime!';
    ELSE
        RAISE NOTICE '✅ RPC está usando get_file_extension_from_mime';
    END IF;
END $$;
