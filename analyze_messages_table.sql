-- ================================================================
-- 📊 ANALISAR ESTRUTURA COMPLETA DA TABELA MESSAGES
-- ================================================================

-- 1. Ver todas as colunas da tabela messages
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'messages'
ORDER BY ordinal_position;

-- 2. Ver todas as colunas da tabela leads também
SELECT 
    'TABELA LEADS' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'leads'
ORDER BY ordinal_position;