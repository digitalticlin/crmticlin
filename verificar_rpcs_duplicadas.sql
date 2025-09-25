-- ============================================
-- VERIFICAR RPCS DUPLICADAS
-- ============================================

-- Verificar quantas versões da função save_received_message_webhook existem
SELECT
    'Análise de RPCs save_received_message_webhook:' as info,
    p.proname as function_name,
    array_length(p.proargtypes, 1) as parameter_count,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'save_received_message_webhook'
ORDER BY parameter_count;

-- PROBLEMA: PostgreSQL permite múltiplas versões da mesma função com diferentes parâmetros
-- Isso é chamado de "function overloading"

-- SOLUÇÃO: Remover a versão antiga (14 parâmetros) e manter apenas a nova (15 parâmetros)

-- Identificar exatamente a assinatura da função antiga para removê-la
SELECT
    'Identificando função para remoção:' as acao,
    'DROP FUNCTION IF EXISTS public.save_received_message_webhook(' ||
    pg_get_function_arguments(p.oid) || ');' as comando_drop
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'save_received_message_webhook'
  AND array_length(p.proargtypes, 1) = 14;  -- Versão antiga com 14 parâmetros