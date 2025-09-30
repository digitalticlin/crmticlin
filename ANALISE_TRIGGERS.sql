-- ============================================
-- ANÁLISE DETALHADA DOS TRIGGERS E FLUXO
-- Execute para responder às questões levantadas
-- ============================================

-- ============================================
-- QUESTÃO 1: Trigger único ou específico por plano?
-- ============================================

-- 1.1 Verificar TODOS os triggers em auth.users
SELECT
    t.tgname as trigger_name,
    pg_get_triggerdef(t.oid) as trigger_definition,
    p.proname as function_name,
    CASE t.tgenabled
        WHEN 'O' THEN 'ENABLED'
        WHEN 'D' THEN 'DISABLED'
        ELSE 'OTHER'
    END as status
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_proc p ON p.oid = t.tgfoid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'auth'
  AND c.relname = 'users'
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- 1.2 Analisar a função handle_new_user - como ela trata diferentes planos
SELECT
    routine_name,
    routine_type,
    -- Extrair trechos relevantes sobre planos
    CASE
        WHEN routine_definition LIKE '%free_200%' THEN 'TRATA_PLANO_GRATUITO'
        ELSE 'NAO_TRATA_PLANO_GRATUITO'
    END as trata_gratuito,
    CASE
        WHEN routine_definition LIKE '%pro_5k%' OR routine_definition LIKE '%ultra_15k%' THEN 'TRATA_PLANO_PAGO'
        ELSE 'NAO_TRATA_PLANO_PAGO'
    END as trata_pago,
    CASE
        WHEN routine_definition LIKE '%selected_plan%' THEN 'ACESSA_SELECTED_PLAN'
        ELSE 'NAO_ACESSA_SELECTED_PLAN'
    END as acessa_plano_selecionado
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';

-- ============================================
-- QUESTÃO 2: Como frontend comunica o plano?
-- ============================================

-- 2.1 Verificar estrutura da tabela auth.users para ver como dados são passados
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'auth'
  AND table_name = 'users'
  AND column_name IN ('raw_user_meta_data', 'user_metadata', 'app_metadata')
ORDER BY column_name;

-- 2.2 Verificar dados reais para entender estrutura do metadata
SELECT
    id,
    email,
    raw_user_meta_data,
    raw_user_meta_data->>'selected_plan' as selected_plan_value,
    raw_user_meta_data->>'full_name' as full_name_value,
    raw_user_meta_data->>'role' as role_value,
    created_at
FROM auth.users
WHERE email = 'inaciojrdossantos@gmail.com';

-- ============================================
-- QUESTÃO 3: Múltiplos triggers criando funis?
-- ============================================

-- 3.1 Listar TODOS os triggers na tabela profiles
SELECT
    t.tgname as trigger_name,
    pg_get_triggerdef(t.oid) as trigger_definition,
    p.proname as function_name,
    CASE t.tgenabled
        WHEN 'O' THEN 'ENABLED'
        WHEN 'D' THEN 'DISABLED'
        ELSE 'OTHER'
    END as status,
    -- Identificar se cria funil
    CASE
        WHEN pg_get_triggerdef(t.oid) LIKE '%funnel%' OR pg_get_triggerdef(t.oid) LIKE '%funil%' THEN 'CRIA_FUNIL'
        ELSE 'NAO_CRIA_FUNIL'
    END as cria_funil
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_proc p ON p.oid = t.tgfoid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'profiles'
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- 3.2 Analisar TODAS as funções que criam funis
SELECT
    routine_name as function_name,
    routine_type,
    -- Verificar se cria funil
    CASE
        WHEN routine_definition LIKE '%INSERT INTO funnels%' THEN 'CRIA_FUNIL_DIRETO'
        WHEN routine_definition LIKE '%funnel%' OR routine_definition LIKE '%funil%' THEN 'MENCIONA_FUNIL'
        ELSE 'NAO_RELACIONADO_FUNIL'
    END as relacao_funil,
    -- Verificar condições para criar
    CASE
        WHEN routine_definition LIKE '%created_by_user_id IS NULL%' THEN 'CONDICAO_ADMIN_PRINCIPAL'
        WHEN routine_definition LIKE '%role = %admin%' THEN 'CONDICAO_ROLE_ADMIN'
        ELSE 'SEM_CONDICAO_ESPECIFICA'
    END as condicao_criacao
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_definition LIKE '%funnel%' OR routine_definition LIKE '%funil%' OR routine_name LIKE '%funnel%')
ORDER BY routine_name;

-- 3.3 Verificar se há triggers duplicados que podem causar conflito
SELECT
    trigger_name,
    function_name,
    COUNT(*) as quantidade,
    CASE
        WHEN COUNT(*) > 1 THEN 'DUPLICADO - POSSIVEL_CONFLITO'
        ELSE 'UNICO'
    END as status_duplicacao
FROM (
    SELECT
        t.tgname as trigger_name,
        p.proname as function_name
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_proc p ON p.oid = t.tgfoid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'profiles'
      AND NOT t.tgisinternal
      AND t.tgenabled = 'O'
) as triggers_ativos
GROUP BY trigger_name, function_name
ORDER BY quantidade DESC, trigger_name;

-- ============================================
-- ANÁLISE ESPECÍFICA DO FLUXO DE CRIAÇÃO
-- ============================================

-- 4.1 Verificar ordem de execução dos triggers (por nome alfabético)
SELECT
    t.tgname as trigger_name,
    p.proname as function_name,
    -- Triggers executam em ordem alfabética
    ROW_NUMBER() OVER (ORDER BY t.tgname) as ordem_execucao,
    CASE
        WHEN t.tgname LIKE '%activate_plan%' THEN 'ATIVA_PLANO'
        WHEN t.tgname LIKE '%create_funnel%' OR t.tgname LIKE '%funnel%' THEN 'CRIA_FUNIL'
        WHEN t.tgname LIKE '%paid_plan%' OR t.tgname LIKE '%checkout%' THEN 'PROCESSA_PAGAMENTO'
        ELSE 'OUTRO'
    END as funcao_principal
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_proc p ON p.oid = t.tgfoid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'profiles'
  AND NOT t.tgisinternal
  AND t.tgenabled = 'O'
ORDER BY t.tgname;

-- 4.2 Analisar dependências entre triggers
SELECT
    'SEQUENCIA_TRIGGER_PROFILES' as analise,
    'Os triggers em profiles executam APÓS o usuário já estar criado em profiles' as observacao,
    'Se o trigger auth->profiles falhar, NENHUM trigger em profiles executa' as implicacao;

-- ============================================
-- VERIFICAÇÃO FINAL: DADOS DO USUÁRIO TESTE
-- ============================================

-- 5.1 Status completo do usuário de teste
SELECT
    'DIAGNOSTICO_USUARIO_TESTE' as secao,
    au.id as auth_user_id,
    au.email,
    au.raw_user_meta_data->>'selected_plan' as plano_frontend,
    CASE
        WHEN p.id IS NOT NULL THEN 'PROFILE_EXISTE'
        ELSE 'PROFILE_NAO_EXISTE - TRIGGER_FALHOU'
    END as status_profile,
    CASE
        WHEN ps.user_id IS NOT NULL THEN 'PLAN_SUBSCRIPTION_EXISTE'
        ELSE 'PLAN_SUBSCRIPTION_NAO_EXISTE'
    END as status_subscription
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
LEFT JOIN plan_subscriptions ps ON ps.user_id = au.id
WHERE au.email = 'inaciojrdossantos@gmail.com';

-- ============================================
-- INSTRUÇÕES:
-- Execute todas as queries e me envie os resultados
-- Isso vai responder às 3 questões fundamentais
-- ============================================