-- ================================================================
-- 🔍 VERIFICAR ACESSO AO STORAGE SUPABASE
-- ================================================================

-- 1️⃣ Verificar se bucket existe e está acessível
SELECT
    '🗂️ BUCKET STATUS' as check,
    id,
    name,
    public,
    created_at
FROM storage.buckets
WHERE name = 'whatsapp-media';

-- 2️⃣ Verificar objetos existentes no storage
SELECT
    '📁 OBJETOS NO STORAGE' as check,
    COUNT(*) as total_objects,
    COUNT(CASE WHEN name LIKE 'webhook/%' THEN 1 END) as webhook_objects
FROM storage.objects
WHERE bucket_id = 'whatsapp-media';

-- 3️⃣ Verificar últimos objetos criados
SELECT
    '📄 ÚLTIMOS OBJETOS' as check,
    name,
    metadata,
    created_at
FROM storage.objects
WHERE bucket_id = 'whatsapp-media'
ORDER BY created_at DESC
LIMIT 5;

-- 4️⃣ Verificar políticas de acesso (RLS)
SELECT
    '🔐 POLÍTICAS RLS' as check,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage';

-- 5️⃣ Teste de criação de objeto simples
DO $$
DECLARE
    v_test_result JSONB;
    v_test_path TEXT := 'test/simple_test_' || extract(epoch from now())::text || '.txt';
    v_test_data BYTEA := 'Hello World Test'::BYTEA;
BEGIN
    BEGIN
        -- Tentar criar objeto de teste
        SELECT storage.objects.create(
            'whatsapp-media',
            v_test_path,
            v_test_data,
            'text/plain'
        ) INTO v_test_result;

        RAISE NOTICE '✅ Teste de upload: SUCESSO - %', v_test_result;

        -- Limpar teste
        PERFORM storage.objects.delete('whatsapp-media', v_test_path);

    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Teste de upload: FALHOU - %', SQLERRM;
    END;
END $$;