-- ================================================================
-- 🔍 DIAGNÓSTICO: ONDE ESTÁ A FALHA DE CONFIGURAÇÃO?
-- ================================================================

-- 1️⃣ Verificar extensões disponíveis (net.http_post)
SELECT
    '🔌 EXTENSÕES DISPONÍVEIS' as check,
    extname,
    extversion
FROM pg_extension
WHERE extname IN ('storage', 'http', 'pg_net');

-- 2️⃣ Verificar configurações do Supabase
SELECT
    '⚙️ CONFIGURAÇÕES DISPONÍVEIS' as check,
    name,
    setting
FROM pg_settings
WHERE name LIKE '%supabase%'
OR name LIKE '%net%'
OR name LIKE '%http%';

-- 3️⃣ Verificar se current_setting funciona
DO $$
DECLARE
    v_service_key TEXT;
    v_anon_key TEXT;
BEGIN
    BEGIN
        v_service_key := current_setting('app.supabase_service_role_key', true);
        IF v_service_key IS NOT NULL AND LENGTH(v_service_key) > 20 THEN
            RAISE NOTICE '✅ Service role key: CONFIGURADA (% chars)', LENGTH(v_service_key);
        ELSE
            RAISE NOTICE '❌ Service role key: NÃO CONFIGURADA ou INVÁLIDA';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Erro ao acessar service_role_key: %', SQLERRM;
    END;

    BEGIN
        v_anon_key := current_setting('app.supabase_anon_key', true);
        IF v_anon_key IS NOT NULL AND LENGTH(v_anon_key) > 20 THEN
            RAISE NOTICE '✅ Anon key: CONFIGURADA (% chars)', LENGTH(v_anon_key);
        ELSE
            RAISE NOTICE '❌ Anon key: NÃO CONFIGURADA ou INVÁLIDA';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Erro ao acessar anon_key: %', SQLERRM;
    END;
END $$;

-- 4️⃣ Teste simples de net.http_post
DO $$
DECLARE
    v_result JSONB;
BEGIN
    BEGIN
        -- Teste para endpoint público simples
        SELECT net.http_post(
            'https://httpbin.org/post',
            jsonb_build_object('test', 'connection'),
            headers := jsonb_build_object('Content-Type', 'application/json')
        ) INTO v_result;

        IF v_result->>'status_code' = '200' THEN
            RAISE NOTICE '✅ net.http_post: FUNCIONANDO';
        ELSE
            RAISE NOTICE '⚠️ net.http_post: Status %, Body: %',
                v_result->>'status_code',
                LEFT(v_result->>'body', 100);
        END IF;

    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ net.http_post: ERRO - %', SQLERRM;
    END;
END $$;

-- 5️⃣ Verificar se pode acessar edge function diretamente
DO $$
DECLARE
    v_result JSONB;
    v_test_payload JSONB;
BEGIN
    BEGIN
        v_test_payload := jsonb_build_object(
            'file_path', 'test/connection_test.txt',
            'base64_data', 'SGVsbG8gV29ybGQ=',  -- "Hello World" em base64
            'content_type', 'text/plain',
            'message_id', 'test_connection'
        );

        SELECT net.http_post(
            'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_storage_upload',
            v_test_payload,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdnZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTkzNzU4MzYsImV4cCI6MjAzNDk1MTgzNn0.sKNGcO4Tv8S-hHeBpBG8nSoIvJagCx5QO4qNOj2wYSg'
            )
        ) INTO v_result;

        RAISE NOTICE '🔗 Edge Function Test: Status %, Response: %',
            v_result->>'status_code',
            LEFT(v_result->>'body', 200);

    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Edge Function Test: ERRO - %', SQLERRM;
    END;
END $$;

-- 6️⃣ Verificar worker atual
SELECT
    '👷 WORKER ATUAL' as check,
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%process%'
AND routine_name LIKE '%media%';