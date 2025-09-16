-- ================================================================
-- 🔍 OBTER CONFIGURAÇÃO ATUAL DA RPC APP EM PRODUÇÃO
-- ================================================================

-- 1️⃣ VER ASSINATURA DA FUNÇÃO
SELECT
    '📋 ASSINATURA ATUAL APP' as info,
    proname as function_name,
    pronargs as num_args,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'save_sent_message_from_app'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 2️⃣ VER CÓDIGO FONTE COMPLETO DA FUNÇÃO (14 parâmetros)
SELECT
    '💻 CÓDIGO FONTE APP' as info,
    prosrc as source_code
FROM pg_proc
WHERE proname = 'save_sent_message_from_app'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND pronargs = 14;  -- Versão com 14 parâmetros

-- 3️⃣ VER DETALHES DE IMPLEMENTAÇÃO
SELECT
    '🔧 DETALHES APP' as info,
    proname as function_name,
    prorettype::regtype as return_type,
    prolang::regclass as language,
    prosecdef as security_definer,
    provolatile as volatility,
    pg_get_functiondef(oid) as full_definition
FROM pg_proc
WHERE proname = 'save_sent_message_from_app'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND pronargs = 14;

-- 4️⃣ VERIFICAR TODAS AS VERSÕES DA FUNÇÃO
SELECT
    '⚠️ TODAS VERSÕES APP' as info,
    proname as function_name,
    pronargs as num_args,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'save_sent_message_from_app'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY pronargs DESC;