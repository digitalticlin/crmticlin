-- Teste mínimo do worker
DO $$
DECLARE
    v_result jsonb;
BEGIN
    RAISE NOTICE '🧪 Testando webhook_media_worker...';
    
    BEGIN
        SELECT webhook_media_worker(1, 30) INTO v_result;
        RAISE NOTICE '✅ SUCESSO: %', v_result;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ ERRO: %', SQLERRM;
    END;
END $$;