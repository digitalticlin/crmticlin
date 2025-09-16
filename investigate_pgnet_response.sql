-- ================================================================
-- 🔍 INVESTIGAR POR QUE RESPOSTAS NÃO CHEGAM
-- ================================================================

-- 1️⃣ VER TODAS AS REQUISIÇÕES FEITAS
SELECT
    '📡 REQUISIÇÕES RECENTES' as info,
    id,
    method,
    url,
    headers,
    body,
    timeout_milliseconds
FROM net.http_request_queue
ORDER BY id DESC
LIMIT 10;

-- 2️⃣ VER SE HÁ RESPOSTAS NA TABELA
SELECT
    '📊 RESPOSTAS EXISTENTES' as info,
    id,
    status_code,
    headers,
    LEFT(content::text, 100) as content_sample,
    timed_out,
    error_msg,
    created
FROM net._http_response
WHERE id IN (2189, 2188, 2187, 2186, 2185, 2184, 2183, 2182, 2181, 2180)
ORDER BY id DESC;

-- 3️⃣ VERIFICAR SE PG_NET ESTÁ PROCESSANDO
SELECT
    '⚙️ STATUS PG_NET' as info,
    COUNT(*) as pending_requests
FROM net.http_request_queue;

-- 4️⃣ VERIFICAR CONFIGURAÇÃO DO PG_NET
-- SHOW ALL; -- Comentado pois retorna muitos dados

-- 5️⃣ TESTAR COM TIMEOUT MAIOR
DO $$
DECLARE
    v_request_id BIGINT;
    v_response RECORD;
    v_counter INT := 0;
BEGIN
    -- Fazer requisição simples para teste
    SELECT net.http_post(
        'https://httpbin.org/delay/1',  -- Endpoint que demora 1 segundo
        '{"test": "timeout"}'::jsonb,
        '{"Content-Type": "application/json"}'::jsonb
    ) INTO v_request_id;

    RAISE NOTICE '📤 Request ID com timeout maior: %', v_request_id;

    -- Aguardar resposta (até 15 segundos)
    WHILE v_counter < 150 LOOP
        SELECT * INTO v_response
        FROM net._http_response
        WHERE id = v_request_id;

        IF FOUND THEN
            RAISE NOTICE '✅ RESPOSTA ENCONTRADA após % iterações!', v_counter;
            RAISE NOTICE 'Status: %', v_response.status_code;
            RAISE NOTICE 'Timed out?: %', v_response.timed_out;
            RAISE NOTICE 'Error: %', v_response.error_msg;
            EXIT;
        END IF;

        PERFORM pg_sleep(0.1);
        v_counter := v_counter + 1;
    END LOOP;

    IF NOT FOUND THEN
        RAISE NOTICE '⚠️ Nenhuma resposta após 15 segundos';

        -- Verificar se está na fila
        SELECT COUNT(*) INTO v_counter
        FROM net.http_request_queue
        WHERE id = v_request_id;

        RAISE NOTICE '📦 Request ainda na fila?: %', v_counter;
    END IF;
END $$;

-- 6️⃣ ALTERNATIVA: VERIFICAR SE PODEMOS USAR pg_cron PARA PROCESSAR
SELECT
    '🕐 PG_CRON DISPONÍVEL?' as info,
    extname,
    extversion
FROM pg_extension
WHERE extname = 'pg_cron';

-- 7️⃣ VERIFICAR SE HÁ ALGUM WORKER DO PG_NET RODANDO
SELECT
    '👷 WORKERS PG_NET' as info,
    pid,
    usename,
    application_name,
    state,
    query
FROM pg_stat_activity
WHERE application_name LIKE '%pg_net%'
   OR query LIKE '%net.%'
   OR query LIKE '%http%';

-- 8️⃣ FORÇAR PROCESSAMENTO MANUAL (TENTATIVA)
-- SELECT net.worker_loop(); -- Comentado, função pode não existir

-- 9️⃣ RESUMO DO PROBLEMA
SELECT
    '🔴 DIAGNÓSTICO' as status,
    jsonb_build_object(
        'problema', 'pg_net não está processando requisições',
        'causa_provavel', 'Worker do pg_net não está rodando ou está bloqueado',
        'solucoes_possiveis', ARRAY[
            'Usar edge function sem pg_net',
            'Configurar pg_cron para chamar net.worker_loop()',
            'Usar solução alternativa sem HTTP',
            'Desativar JWT da edge e chamar diretamente'
        ],
        'request_ids_testados', ARRAY[2180, 2181, 2182, 2189]
    ) as analise;