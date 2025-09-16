-- ================================================================
-- DIAGNÓSTICO COMPLETO DOS WORKERS E RPCS
-- ================================================================

-- 1. Verificar se workers existem
SELECT 
    '🔧 WORKERS EXISTENTES' as categoria,
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%_media_worker%'
ORDER BY routine_name;

-- 2. Verificar se RPCs existem  
SELECT 
    '📞 RPCS EXISTENTES' as categoria,
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE 'save_%message%'
ORDER BY routine_name;

-- 3. Verificar filas PGMQ
SELECT 
    '📦 FILAS PGMQ' as categoria,
    tablename as queue_table
FROM pg_tables 
WHERE schemaname = 'pgmq' 
AND tablename LIKE 'q_%'
ORDER BY tablename;

-- 4. Tentar executar um worker simples
DO $$
DECLARE
    v_result RECORD;
BEGIN
    RAISE NOTICE '🧪 TESTANDO webhook_media_worker()...';
    
    BEGIN
        SELECT * FROM webhook_media_worker() INTO v_result;
        RAISE NOTICE '✅ webhook_media_worker retornou: %', v_result;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ ERRO no webhook_media_worker: %', SQLERRM;
    END;
END $$;

-- 5. Verificar estrutura da tabela messages
SELECT 
    '📋 COLUNAS DA TABELA MESSAGES' as categoria,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'messages'
AND column_name IN ('media_url', 'media_type', 'text')
ORDER BY column_name;

-- 6. Verificar se Supabase Storage está acessível
SELECT 
    '💾 TESTE STORAGE ACCESS' as categoria,
    current_setting('app.settings.supabase_url') as supabase_url,
    current_setting('app.settings.supabase_anon_key') as anon_key;