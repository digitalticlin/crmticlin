-- ============================================
-- INVESTIGAÇÃO: RPC ATIVA E VINCULAÇÃO INSTÂNCIA -> FUNIL
-- ============================================

-- 1. DESCOBRIR QUAL RPC/FUNÇÃO ESTÁ SENDO USADA (via logs)
SELECT DISTINCT
    function_name,
    COUNT(*) as total_calls,
    MAX(created_at) as last_call,
    MIN(created_at) as first_call
FROM sync_logs
WHERE created_at > NOW() - INTERVAL '7 days'
    AND function_name ILIKE '%whatsapp%'
GROUP BY function_name
ORDER BY last_call DESC;

-- 2. VERIFICAR ESTRUTURA DAS TABELAS PARA ENTENDER VINCULAÇÃO
-- Verificar se whatsapp_instances tem vinculação direta com funil
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'whatsapp_instances'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR SE EXISTE TABELA DE VINCULAÇÃO INSTÂNCIA -> FUNIL
SELECT
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
    AND (table_name ILIKE '%whatsapp%' OR table_name ILIKE '%funnel%')
ORDER BY table_name;

-- 4. VERIFICAR FUNIS ATIVOS DO ADMIN DOS LEADS PROBLEMÁTICOS
SELECT
    f.id,
    f.name,
    f.created_by_user_id,
    f.is_active,
    f.created_at,
    -- Contar etapas
    COUNT(DISTINCT ks.id) as total_stages,
    -- Primeira etapa (order_position = 1)
    MIN(CASE WHEN ks.order_position = 1 THEN ks.id END) as primeira_etapa_id,
    MIN(CASE WHEN ks.order_position = 1 THEN ks.title END) as primeira_etapa_nome
FROM funnels f
LEFT JOIN kanban_stages ks ON f.id = ks.funnel_id
WHERE f.created_by_user_id = 'e75375eb-37a8-4afa-8fa3-1f13e4855439'
    AND f.is_active = true
GROUP BY f.id, f.name, f.created_by_user_id, f.is_active, f.created_at
ORDER BY f.created_at ASC;

-- 5. VERIFICAR INSTÂNCIAS WHATSAPP DO MESMO ADMIN
SELECT
    wi.id,
    wi.instance_name,
    wi.phone,
    wi.created_by_user_id,
    wi.connection_status,
    wi.created_at,
    -- Ver se tem campo de vinculação com funil (se existir)
    wi.*
FROM whatsapp_instances wi
WHERE wi.created_by_user_id = 'e75375eb-37a8-4afa-8fa3-1f13e4855439'
ORDER BY wi.created_at DESC;

-- 6. VERIFICAR LOGS DETALHADOS DA RPC MAIS RECENTE
SELECT
    sl.id,
    sl.function_name,
    sl.status,
    sl.created_at,
    sl.result,
    sl.error_message
FROM sync_logs sl
WHERE sl.function_name ILIKE '%whatsapp%'
    AND sl.created_at > NOW() - INTERVAL '1 day'
ORDER BY sl.created_at DESC
LIMIT 10;

-- 7. VERIFICAR SE EXISTE FUNÇÕES RPC ESPECÍFICAS (via pg_proc)
SELECT
    proname as function_name,
    prosrc as function_body
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND proname ILIKE '%whatsapp%'
ORDER BY proname;