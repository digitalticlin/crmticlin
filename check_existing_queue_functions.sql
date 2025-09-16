-- ================================================================
-- 🔍 VERIFICAR FUNÇÕES EXISTENTES PARA FILA
-- ================================================================

-- 1️⃣ Buscar funções que trabalham com fila
SELECT
    '🔍 FUNÇÕES DE FILA EXISTENTES' as check,
    routine_name,
    routine_type,
    CASE
        WHEN routine_name LIKE '%queue%' THEN '📦 Queue function'
        WHEN routine_name LIKE '%read%' THEN '📖 Read function'
        WHEN routine_name LIKE '%delete%' THEN '🗑️ Delete function'
        WHEN routine_name LIKE '%pgmq%' THEN '📬 PGMQ function'
        ELSE '❓ Other'
    END as category
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (
    routine_name LIKE '%queue%'
    OR routine_name LIKE '%read%'
    OR routine_name LIKE '%delete%'
    OR routine_name LIKE '%pgmq%'
    OR routine_name LIKE '%webhook%'
)
ORDER BY routine_name;

-- 2️⃣ Verificar se PGMQ é acessível diretamente
SELECT
    '📬 PGMQ DIRETAMENTE ACESSÍVEL?' as check,
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgmq')
        THEN '✅ PGMQ extension ativa'
        ELSE '❌ PGMQ não encontrado'
    END as pgmq_status;

-- 3️⃣ Testar acesso direto ao PGMQ
DO $$
BEGIN
    BEGIN
        -- Testar se pgmq.read funciona
        PERFORM pgmq.read('webhook_message_queue', 1, 5);
        RAISE NOTICE '✅ pgmq.read: FUNCIONA diretamente';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ pgmq.read: ERRO - %', SQLERRM;
    END;

    BEGIN
        -- Testar se pgmq.metrics funciona
        PERFORM pgmq.metrics('webhook_message_queue');
        RAISE NOTICE '✅ pgmq.metrics: FUNCIONA diretamente';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ pgmq.metrics: ERRO - %', SQLERRM;
    END;
END $$;