-- ================================================================
-- ADICIONAR "STICKER" AO ENUM MEDIA_TYPE COM COMMIT SEGURO
-- ================================================================

-- 🎨 ADICIONAR STICKER COMO TIPO VÁLIDO DE MÍDIA
-- 🔧 CORREÇÃO: Usar transação com commit explícito

-- 1. Verificar enum atual
SELECT 
    '📋 ENUM ATUAL' as categoria,
    unnest(enum_range(NULL::media_type)) as valores_atuais;

-- 2. Adicionar "sticker" ao enum com transação
BEGIN;
    ALTER TYPE media_type ADD VALUE IF NOT EXISTS 'sticker';
COMMIT;

-- 3. Verificar enum após alteração
SELECT 
    '📋 ENUM APÓS ADIÇÃO' as categoria,
    unnest(enum_range(NULL::media_type)) as valores_finais;

-- 4. Testar uso do novo valor
DO $$
BEGIN
    -- Teste simples para garantir que o enum funciona
    RAISE NOTICE '🧪 TESTANDO NOVO ENUM: %', 'sticker'::media_type;
    RAISE NOTICE '✅ ENUM STICKER FUNCIONANDO CORRETAMENTE';
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERRO NO ENUM STICKER: %', SQLERRM;
END $$;

-- 5. Confirmar mudança
SELECT 
    '✅ STICKER ADICIONADO' as resultado,
    'sticker agora é um valor válido para media_type' as detalhes,
    '😊 Sticker será processado como emoji + Storage URL' as formato;