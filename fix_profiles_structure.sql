-- 🔍 DIAGNÓSTICO: Verificar estrutura real da tabela profiles

-- ========================================
-- 1. VER ESTRUTURA ATUAL DA TABELA PROFILES
-- ========================================

SELECT '=== COLUNAS DA TABELA PROFILES ===' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ========================================
-- 2. VER DADOS DO ADMIN PARA ENTENDER LINKAGE
-- ========================================

SELECT '=== SAMPLE PROFILE DATA ===' as info;

SELECT 
  id,
  email,
  full_name,
  role,
  created_by_user_id,
  -- Tentar diferentes campos de linkage
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'profiles' AND column_name = 'auth_user_id') 
    THEN 'auth_user_id field exists'
    ELSE 'auth_user_id field MISSING'
  END as auth_user_id_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'profiles' AND column_name = 'linked_auth_user_id') 
    THEN 'linked_auth_user_id field exists'
    ELSE 'linked_auth_user_id field MISSING'
  END as linked_auth_user_id_status
  
FROM profiles 
WHERE email = 'adm.geuniformes@gmail.com'
LIMIT 1;

-- ========================================
-- 3. VERIFICAR AUTH.USERS STRUCTURE  
-- ========================================

SELECT '=== AUTH USERS SAMPLE ===' as info;

-- Verificar se temos acesso à tabela auth.users
SELECT 
  id,
  email,
  created_at
FROM auth.users 
WHERE email = 'adm.geuniformes@gmail.com'
LIMIT 1;