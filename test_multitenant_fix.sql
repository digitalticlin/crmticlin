-- 🧪 TESTE: Verificar se a correção multitenant funcionou
-- Execute este arquivo APÓS aplicar a migração 20250908200001_fix_multitenant_rls_critical.sql

-- ========================================
-- 1. TESTAR CONTEXTO AUTH
-- ========================================

SELECT '=== TESTE DE CONTEXTO AUTH ===' as info;

-- Verificar se auth.uid() funciona
SELECT 
    auth.uid() as current_auth_uid,
    CASE 
        WHEN auth.uid() IS NULL THEN '❌ AINDA NULL - RLS NÃO VAI FUNCIONAR!'
        ELSE '✅ Auth funcionando'
    END as status_auth;

-- ========================================
-- 2. TESTAR RLS POLICIES LEADS
-- ========================================

SELECT '=== TESTE RLS LEADS ===' as info;

-- Contar leads que o usuário atual pode ver
SELECT 
    'Leads visíveis com RLS' as tipo,
    COUNT(*) as total_leads_visiveis,
    CASE 
        WHEN COUNT(*) = 455 THEN '✅ CORRETO - Admin vê apenas seus leads'
        WHEN COUNT(*) > 1000 THEN '❌ ERRO - Vendo todos os leads do sistema'
        ELSE '⚠️ VERIFICAR - Número inesperado'
    END as status_multitenant
FROM leads;

-- Ver distribuição por usuário (se RLS estiver funcionando, só mostrará do usuário atual)
SELECT 
    'Distribuição por created_by_user_id' as info,
    created_by_user_id,
    COUNT(*) as total
FROM leads 
GROUP BY created_by_user_id
ORDER BY total DESC;

-- ========================================
-- 3. TESTAR RLS PROFILES
-- ========================================

SELECT '=== TESTE RLS PROFILES ===' as info;

-- Ver quantos profiles o usuário pode ver
SELECT 
    'Profiles visíveis' as tipo,
    COUNT(*) as total_profiles,
    array_agg(email) as emails_visiveis
FROM profiles;

-- ========================================
-- 4. TESTAR FUNCTION AUXILIAR
-- ========================================

SELECT '=== TESTE FUNCTION AUXILIAR ===' as info;

-- Usar a function criada na migração
SELECT * FROM test_auth_context();

-- ========================================
-- 5. VERIFICAR POLICIES ATIVAS
-- ========================================

SELECT '=== POLICIES ATIVAS ===' as info;

-- Listar policies das tabelas críticas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('leads', 'profiles')
ORDER BY tablename, policyname;

-- ========================================
-- RESULTADO ESPERADO
-- ========================================

-- Se tudo estiver funcionando:
-- ✅ auth.uid() retorna UUID válido (não null)
-- ✅ Leads visíveis = 455 (apenas do admin)
-- ✅ Profiles visíveis = perfil do admin + equipe criada por ele
-- ✅ Não aparece dados de outros usuários/empresas