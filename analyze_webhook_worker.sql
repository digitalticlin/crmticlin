-- ================================================================
-- 🔍 ANÁLISE COMPLETA DO WORKER WEBHOOK EXISTENTE
-- ================================================================

-- 1️⃣ VERIFICAR SE EXISTE WORKER ISOLADO WEBHOOK
SELECT 
    '🔍 WORKERS WEBHOOK EXISTENTES' as info,
    proname as worker_name,
    pronargs as num_args,
    pg_get_function_identity_arguments(oid) as assinatura
FROM pg_proc
WHERE proname LIKE '%webhook%worker%'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 2️⃣ VERIFICAR FILA ISOLADA webhook_message_queue
SELECT 
    '📦 STATUS FILA webhook_message_queue' as info,
    queue_name,
    queue_length,
    oldest_msg_age_sec,
    newest_msg_age_sec,
    total_messages
FROM pgmq.metrics('webhook_message_queue');

-- 3️⃣ VER MENSAGENS NA FILA (se houver)
SELECT 
    '📋 MENSAGENS NA FILA' as info,
    msg_id,
    read_ct,
    enqueued_at,
    message as conteudo
FROM pgmq.read('webhook_message_queue', 1, 5); -- Ler até 5 mensagens sem remover

-- 4️⃣ VERIFICAR TRIGGERS QUE ATIVAM O WORKER
SELECT 
    '🔧 TRIGGERS WEBHOOK' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%webhook%'
OR action_statement LIKE '%webhook%worker%';

-- 5️⃣ VERIFICAR CRON JOBS PARA WORKER
SELECT 
    '⏰ CRON JOBS WEBHOOK' as info,
    jobname,
    schedule,
    command,
    active
FROM cron.job
WHERE command LIKE '%webhook%worker%';

-- 6️⃣ BUSCAR QUALQUER FUNÇÃO QUE PROCESSA A FILA
SELECT 
    '⚙️ FUNÇÕES QUE PROCESSAM FILA' as info,
    proname as function_name,
    CASE 
        WHEN prosrc LIKE '%webhook_message_queue%' THEN '✅ PROCESSA webhook_message_queue'
        ELSE '❌ NÃO PROCESSA'
    END as processa_fila
FROM pg_proc
WHERE prosrc LIKE '%webhook_message_queue%'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 7️⃣ RESUMO DIAGNÓSTICO
SELECT 
    '🎯 DIAGNÓSTICO COMPLETO' as resultado,
    jsonb_build_object(
        'workers_webhook', (
            SELECT COUNT(*) 
            FROM pg_proc 
            WHERE proname LIKE '%webhook%worker%'
            AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        ),
        'fila_webhook_length', (
            SELECT queue_length 
            FROM pgmq.metrics('webhook_message_queue')
        ),
        'triggers_webhook', (
            SELECT COUNT(*) 
            FROM information_schema.triggers 
            WHERE trigger_name LIKE '%webhook%'
        ),
        'cron_jobs_webhook', (
            SELECT COUNT(*) 
            FROM cron.job 
            WHERE command LIKE '%webhook%worker%'
        ),
        'funcoes_processam_fila', (
            SELECT COUNT(*) 
            FROM pg_proc 
            WHERE prosrc LIKE '%webhook_message_queue%'
            AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        )
    ) as estatisticas;