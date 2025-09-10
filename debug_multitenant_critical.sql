-- 🚨 DIAGNÓSTICO CRÍTICO MULTITENANT
-- Verificar por que RLS está mostrando todos os leads

-- ========================================
-- 1. VERIFICAR CONTEXTO DE AUTENTICAÇÃO
-- ========================================

SELECT '=== CONTEXTO AUTH ATUAL ===' as info;

-- Ver qual é o auth.uid() atual
SELECT 
    auth.uid() as current_auth_uid,
    CASE 
        WHEN auth.uid() IS NULL THEN 'NÃO AUTENTICADO - PERIGOSO!'
        ELSE 'Autenticado'
    END as auth_status;

-- ========================================
-- 2. VERIFICAR PROFILE DO ADMIN
-- ========================================

SELECT '=== PROFILE DO ADMIN ===' as info;

-- Ver dados do admin específico
SELECT 
    id as profile_id,
    email,
    role,
    linked_auth_user_id,
    created_by_user_id,
    CASE 
        WHEN linked_auth_user_id IS NULL THEN 'SEM LINK AUTH - PROBLEMA!'
        ELSE 'Link OK'
    END as link_status
FROM profiles 
WHERE email = 'adm.geuniformes@gmail.com';

-- ========================================
-- 3. VERIFICAR QUANTOS LEADS SÃO REALMENTE DO ADMIN
-- ========================================

SELECT '=== LEADS DO ADMIN ESPECÍFICO ===' as info;

-- Contar leads que REALMENTE pertencem a este admin
SELECT 
    'Leads do admin 7c197601' as tipo,
    COUNT(*) as total_leads_admin_especifico
FROM leads 
WHERE created_by_user_id = '7c197601-01cc-4f71-a4d8-7c1357cac113';

-- ========================================
-- 4. VERIFICAR DISTRIBUIÇÃO DE LEADS
-- ========================================

SELECT '=== DISTRIBUIÇÃO DE LEADS POR USUÁRIO ===' as info;

-- Ver quantos leads cada usuário tem
SELECT 
    created_by_user_id,
    COUNT(*) as total_leads,
    'Verificar se está vazando dados entre usuários' as alerta
FROM leads 
GROUP BY created_by_user_id
ORDER BY total_leads DESC
LIMIT 10;

-- ========================================
-- 5. TESTAR FUNCTION COM CONTEXTO MANUAL
-- ========================================

SELECT '=== TESTE MANUAL DA FUNCTION ===' as info;

-- Testar se a function encontra o profile quando passamos o ID direto
SELECT 
    p.id,
    p.email,
    p.linked_auth_user_id,
    'Este deveria ser retornado por current_profile_id()' as esperado
FROM profiles p
WHERE p.linked_auth_user_id = auth.uid();

-- ========================================
-- 6. VERIFICAR SE HÁ MÚLTIPLOS PROFILES
-- ========================================

SELECT '=== VERIFICAR DUPLICATAS ===' as info;

-- Ver se há múltiplos profiles com mesmo email
SELECT 
    email,
    COUNT(*) as total_profiles,
    array_agg(id) as profile_ids,
    array_agg(linked_auth_user_id) as auth_ids
FROM profiles 
WHERE email = 'adm.geuniformes@gmail.com'
GROUP BY email;