-- ================================================================
-- 🔍 DIAGNÓSTICO DOS ERROS DE STORAGE
-- ================================================================

-- 1️⃣ Verificar se extensões necessárias estão instaladas
SELECT
    '🔌 EXTENSÕES DISPONÍVEIS' as check,
    extname,
    extversion
FROM pg_extension
WHERE extname IN ('storage', 'http', 'pg_net');

-- 2️⃣ Verificar se schemas de storage existem
SELECT
    '📂 SCHEMAS STORAGE' as check,
    schema_name
FROM information_schema.schemata
WHERE schema_name IN ('storage', 'auth');

-- 3️⃣ Verificar funções disponíveis no schema storage
SELECT
    '⚙️ FUNÇÕES STORAGE' as check,
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'storage'
AND routine_name LIKE '%create%'
OR routine_name LIKE '%upload%';

-- 4️⃣ Verificar se podemos acessar tabela storage.objects
SELECT
    '📋 ACESSO STORAGE.OBJECTS' as check,
    COUNT(*) as total_objects
FROM storage.objects
LIMIT 1;

-- 5️⃣ Teste de inserção direta (método alternativo)
DO $$
BEGIN
    BEGIN
        -- Tentar inserção direta
        INSERT INTO storage.objects (
            bucket_id,
            name,
            owner,
            metadata
        ) VALUES (
            'whatsapp-media',
            'test/direct_insert_' || extract(epoch from now())::text || '.txt',
            NULL,
            jsonb_build_object('size', 100, 'mimetype', 'text/plain')
        );

        RAISE NOTICE '✅ Inserção direta: SUCESSO';

    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Inserção direta: FALHOU - %', SQLERRM;
    END;
END $$;