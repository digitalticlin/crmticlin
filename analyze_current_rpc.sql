-- =====================================================
-- 🔍 ANÁLISE DA FUNÇÃO RCP ATUAL NO SUPABASE
-- =====================================================
-- Execute este SQL no Supabase SQL Editor para obter a função atual

-- 1. OBTER DEFINIÇÃO COMPLETA DA FUNÇÃO ATUAL
SELECT routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'save_whatsapp_message_service_role';

-- 2. VERIFICAR SE EXISTEM OUTRAS VERSÕES DA FUNÇÃO
SELECT 
    routine_name,
    routine_type,
    data_type as return_type,
    CASE WHEN routine_definition IS NOT NULL THEN 'HAS_DEFINITION' ELSE 'NO_DEFINITION' END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%save_whatsapp_message%'
ORDER BY routine_name;

-- 3. VERIFICAR PARÂMETROS DA FUNÇÃO
SELECT 
    p.parameter_name,
    p.data_type,
    p.parameter_default,
    p.parameter_mode,
    p.ordinal_position
FROM information_schema.parameters p
WHERE p.specific_schema = 'public'
AND p.specific_name IN (
    SELECT r.specific_name
    FROM information_schema.routines r
    WHERE r.routine_schema = 'public'
    AND r.routine_name = 'save_whatsapp_message_service_role'
)
ORDER BY p.ordinal_position;

-- 4. VERIFICAR ÚLTIMOS LEADS CRIADOS E SEUS NOMES
SELECT 
    l.id,
    l.name,
    l.phone,
    l.created_at,
    l.import_source,
    -- Verificar se o nome segue padrão "+55 (XX)"
    CASE 
        WHEN l.name LIKE '+55 (%' THEN 'FORMATO_PADRÃO'
        WHEN l.name ~ '^[A-Za-z]' THEN 'PROFILE_NAME'
        WHEN l.name = '' OR l.name IS NULL THEN 'VAZIO'
        ELSE 'OUTRO'
    END as tipo_nome
FROM leads l
WHERE l.created_at > (CURRENT_TIMESTAMP - INTERVAL '24 hours')  -- Últimas 24h
ORDER BY l.created_at DESC
LIMIT 15;

-- 5. CONTAR TIPOS DE NOME NOS LEADS
SELECT 
    CASE 
        WHEN name LIKE '+55 (%' THEN 'FORMATO_PADRÃO'
        WHEN name ~ '^[A-Za-z]' THEN 'PROFILE_NAME'
        WHEN name = '' OR name IS NULL THEN 'VAZIO'
        ELSE 'OUTRO'
    END as tipo_nome,
    COUNT(*) as quantidade
FROM leads
WHERE created_at > (CURRENT_TIMESTAMP - INTERVAL '7 days')  -- Últimos 7 dias
GROUP BY 1
ORDER BY quantidade DESC;