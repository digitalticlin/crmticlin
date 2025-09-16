-- ================================================================
-- 🔍 ANALISAR TODAS AS FUNÇÕES EXISTENTES
-- ================================================================

-- OBJETIVO: Identificar qual versão está correta e funcionando

-- ================================================================
-- 1️⃣ LISTAR TODAS AS VERSÕES DA FUNÇÃO
-- ================================================================

SELECT 
    '📊 TODAS AS FUNÇÕES save_received_message_webhook' as analise,
    oid,
    proname as function_name,
    pronargs as num_argumentos,
    pg_get_function_identity_arguments(oid) as assinatura_completa,
    prosrc as codigo_fonte_preview
FROM pg_proc
WHERE proname = 'save_received_message_webhook'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ================================================================
-- 2️⃣ VER DETALHES DE CADA FUNÇÃO
-- ================================================================

SELECT 
    '🔍 DETALHES DAS FUNÇÕES' as info,
    pg_get_functiondef(oid) as definicao_completa
FROM pg_proc
WHERE proname = 'save_received_message_webhook'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ================================================================
-- 3️⃣ VERIFICAR QUAL ESTÁ SENDO USADA RECENTEMENTE
-- ================================================================

-- Ver últimas mensagens salvas com sucesso
SELECT 
    '✅ ÚLTIMAS MENSAGENS SALVAS COM SUCESSO' as status,
    id,
    text,
    media_type,
    media_url,
    import_source,
    created_by_user_id,
    lead_id,
    created_at
FROM public.messages
WHERE import_source = 'webhook'
AND created_at > now() - interval '1 hour'
ORDER BY created_at DESC
LIMIT 10;

-- ================================================================
-- 4️⃣ VERIFICAR ESTRUTURA DE FILAS
-- ================================================================

-- Ver status da fila webhook isolada
SELECT 
    '📦 STATUS DA FILA WEBHOOK' as info,
    queue_name,
    queue_length,
    oldest_msg_age_sec,
    newest_msg_age_sec,
    total_messages
FROM pgmq.metrics('webhook_message_queue');

-- ================================================================
-- 5️⃣ VERIFICAR WORKER ISOLADO
-- ================================================================

-- Ver se existe o worker isolado
SELECT 
    '⚙️ WORKERS WEBHOOK EXISTENTES' as info,
    proname as worker_name,
    pronargs as num_args
FROM pg_proc
WHERE proname LIKE '%webhook%worker%'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ================================================================
-- 6️⃣ VERIFICAR TRIGGER
-- ================================================================

-- Ver triggers na tabela messages
SELECT 
    '🔧 TRIGGERS NA TABELA MESSAGES' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'messages'
AND trigger_name LIKE '%webhook%';

-- ================================================================
-- 7️⃣ TESTE SIMPLES COM UUID
-- ================================================================

-- Testar se funciona com UUID
DO $$
DECLARE
    v_result jsonb;
BEGIN
    -- Tentar chamar com UUID
    SELECT save_received_message_webhook(
        '712e7708-2299-4a00-9128-577c8f113ca4'::UUID,  -- UUID
        '+5511999999999',
        'TESTE ANÁLISE UUID',
        false,
        'text',
        'analise_uuid_' || extract(epoch from now())::text,
        extract(epoch from now())::bigint,
        NULL, NULL, NULL, NULL, NULL, NULL
    ) INTO v_result;
    
    RAISE NOTICE '✅ TESTE UUID: %', v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERRO UUID: %', SQLERRM;
END $$;

-- ================================================================
-- 8️⃣ TESTE SIMPLES COM STRING
-- ================================================================

-- Testar se funciona com string
DO $$
DECLARE
    v_result jsonb;
BEGIN
    -- Tentar chamar com string
    SELECT save_received_message_webhook(
        NULL, -- base64_data
        NULL, -- contact_name
        'analise_string_' || extract(epoch from now())::text, -- external_message_id
        NULL, -- file_name
        false, -- from_me
        'text', -- media_type
        NULL, -- media_url
        'TESTE ANÁLISE STRING', -- message_text
        NULL, -- mime_type
        '+5511999999999', -- phone
        NULL, -- profile_pic_url
        extract(epoch from now())::bigint, -- timestamp
        'digitalticlingmailcom' -- vps_instance_id como STRING
    ) INTO v_result;
    
    RAISE NOTICE '✅ TESTE STRING: %', v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERRO STRING: %', SQLERRM;
END $$;

-- ================================================================
-- 9️⃣ ANÁLISE FINAL
-- ================================================================

SELECT 
    '🎯 RESUMO DA ANÁLISE' as resultado,
    jsonb_build_object(
        'funcoes_encontradas', (
            SELECT COUNT(*) 
            FROM pg_proc 
            WHERE proname = 'save_received_message_webhook'
            AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        ),
        'mensagens_recentes', (
            SELECT COUNT(*) 
            FROM public.messages 
            WHERE import_source = 'webhook'
            AND created_at > now() - interval '1 hour'
        ),
        'fila_webhook', (
            SELECT queue_length 
            FROM pgmq.metrics('webhook_message_queue')
        ),
        'workers_webhook', (
            SELECT COUNT(*) 
            FROM pg_proc 
            WHERE proname LIKE '%webhook%worker%'
            AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        ),
        'triggers_webhook', (
            SELECT COUNT(*) 
            FROM information_schema.triggers 
            WHERE event_object_table = 'messages'
            AND trigger_name LIKE '%webhook%'
        )
    ) as estatisticas;