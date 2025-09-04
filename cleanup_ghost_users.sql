-- 🔍 ANÁLISE DE USUÁRIOS FANTASMAS - Auth vs Profiles
-- Execute estes comandos para identificar e limpar usuários órfãos

-- =====================================================
-- 1. VER TODOS OS USUÁRIOS NO AUTH
-- =====================================================
SELECT 
  id as auth_user_id,
  email,
  email_confirmed_at,
  created_at as auth_created_at,
  updated_at as auth_updated_at,
  user_metadata->>'full_name' as metadata_name,
  user_metadata->>'role' as metadata_role
FROM auth.users 
ORDER BY created_at DESC;

-- =====================================================
-- 2. VER TODOS OS PERFIS EM PROFILES
-- =====================================================
SELECT 
  id as profile_id,
  full_name,
  email,
  role,
  invite_status,
  linked_auth_user_id,
  created_at as profile_created_at,
  created_by_user_id
FROM profiles 
ORDER BY created_at DESC;

-- =====================================================
-- 3. IDENTIFICAR USUÁRIOS FANTASMAS (Auth SEM Profile correspondente)
-- =====================================================
SELECT 
  au.id as ghost_auth_id,
  au.email as ghost_email,
  au.created_at as ghost_created_at,
  au.user_metadata->>'full_name' as ghost_name,
  au.user_metadata->>'role' as ghost_role,
  'FANTASMA - Existe no Auth mas NÃO no Profiles' as status
FROM auth.users au
LEFT JOIN profiles p ON p.linked_auth_user_id = au.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;

-- =====================================================
-- 4. IDENTIFICAR PERFIS ÓRFÃOS (Profile SEM Auth correspondente)
-- =====================================================
SELECT 
  p.id as orphan_profile_id,
  p.full_name as orphan_name,
  p.email as orphan_email,
  p.role as orphan_role,
  p.invite_status,
  p.linked_auth_user_id as missing_auth_id,
  'ÓRFÃO - Existe no Profiles mas NÃO no Auth' as status
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.linked_auth_user_id
WHERE p.linked_auth_user_id IS NOT NULL 
  AND au.id IS NULL
ORDER BY p.created_at DESC;

-- =====================================================
-- 5. RELATÓRIO COMPLETO - SITUAÇÃO GERAL
-- =====================================================
WITH auth_count AS (
  SELECT COUNT(*) as total_auth FROM auth.users
),
profile_count AS (
  SELECT COUNT(*) as total_profiles FROM profiles
),
linked_count AS (
  SELECT COUNT(*) as total_linked 
  FROM profiles p
  INNER JOIN auth.users au ON au.id = p.linked_auth_user_id
),
ghost_count AS (
  SELECT COUNT(*) as total_ghosts
  FROM auth.users au
  LEFT JOIN profiles p ON p.linked_auth_user_id = au.id
  WHERE p.id IS NULL
),
orphan_count AS (
  SELECT COUNT(*) as total_orphans
  FROM profiles p
  LEFT JOIN auth.users au ON au.id = p.linked_auth_user_id
  WHERE p.linked_auth_user_id IS NOT NULL AND au.id IS NULL
)
SELECT 
  ac.total_auth as "Total Auth Users",
  pc.total_profiles as "Total Profiles", 
  lc.total_linked as "Linked Correctly",
  gc.total_ghosts as "🔴 Ghost Users (Auth sem Profile)",
  oc.total_orphans as "🟡 Orphan Profiles (Profile sem Auth)"
FROM auth_count ac, profile_count pc, linked_count lc, ghost_count gc, orphan_count oc;

-- =====================================================
-- 6. 🗑️ COMANDOS PARA LIMPEZA (Execute com CUIDADO!)
-- =====================================================

-- ATENÇÃO: EXECUTE APENAS APÓS CONFIRMAR OS FANTASMAS ACIMA!

-- 6A. Deletar usuários fantasmas do Auth (que não têm profile)
-- DESCOMENTE APENAS APÓS VERIFICAR A QUERY #3 ACIMA:
/*
DELETE FROM auth.users 
WHERE id IN (
  SELECT au.id
  FROM auth.users au
  LEFT JOIN profiles p ON p.linked_auth_user_id = au.id
  WHERE p.id IS NULL
);
*/

-- 6B. Limpar linked_auth_user_id órfãos em profiles
-- DESCOMENTE APENAS APÓS VERIFICAR A QUERY #4 ACIMA:
/*
UPDATE profiles 
SET linked_auth_user_id = NULL
WHERE linked_auth_user_id IS NOT NULL 
  AND linked_auth_user_id NOT IN (
    SELECT id FROM auth.users
  );
*/

-- =====================================================
-- 7. VERIFICAÇÃO PÓS-LIMPEZA
-- =====================================================
-- Execute novamente as queries 1-5 após a limpeza para confirmar

-- =====================================================
-- 📋 INSTRUÇÕES DE USO:
-- =====================================================
-- 1. Execute as queries 1-5 primeiro para ANÁLISE
-- 2. Revise os resultados cuidadosamente
-- 3. Se necessário, DESCOMENTE e execute as queries 6A/6B
-- 4. Execute a query 7 para verificar se a limpeza funcionou
-- =====================================================