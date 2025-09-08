-- PASSO 1: DIAGNÓSTICO COMPLETO DAS POLÍTICAS RLS DA TABELA PROFILES
-- Execute este SQL manualmente e cole o resultado

-- ========================================
-- 1. VERIFICAR POLÍTICAS RLS ATIVAS
-- ========================================
SELECT 
    '=== POLÍTICAS RLS ATIVAS ===' as info,
    schemaname,
    tablename,
    policyname,
    cmd as comando,
    permissive,
    roles,
    qual as condicao_where,
    with_check as condicao_insert_update
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ========================================
-- 2. VERIFICAR SE RLS ESTÁ HABILITADO
-- ========================================
SELECT 
    '=== STATUS RLS ===' as info,
    schemaname,
    tablename,
    rowsecurity as rls_habilitado,
    forcerowsecurity as rls_forcado
FROM pg_tables 
JOIN pg_class ON pg_class.relname = pg_tables.tablename
JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
WHERE tablename = 'profiles' AND schemaname = 'public';

-- ========================================
-- 3. VERIFICAR ESTRUTURA DA TABELA
-- ========================================
SELECT 
    '=== COLUNAS IMPORTANTES ===' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
  AND column_name IN ('id', 'linked_auth_user_id', 'created_by_user_id', 'role', 'invite_status')
ORDER BY ordinal_position;

-- ========================================
-- 4. TESTAR ACESSO COM USUÁRIO ATUAL
-- ========================================
SELECT 
    '=== TESTE DE ACESSO ATUAL ===' as info,
    auth.uid() as meu_user_id,
    count(*) as profiles_visiveis
FROM profiles;

-- ========================================
-- 5. VERIFICAR PROFILE DO USUÁRIO ATUAL
-- ========================================
SELECT 
    '=== MEU PROFILE ===' as info,
    id,
    full_name,
    email,
    role,
    linked_auth_user_id,
    created_by_user_id,
    invite_status
FROM profiles 
WHERE linked_auth_user_id = auth.uid() OR id = auth.uid()::text;

-- ========================================
-- 6. VERIFICAR TODOS OS PROFILES (SÓ ADMIN DEVE VER)
-- ========================================
SELECT 
    '=== TODOS OS PROFILES (SÓ ADMIN) ===' as info,
    id,
    full_name,
    email,
    role,
    invite_status,
    linked_auth_user_id,
    created_by_user_id
FROM profiles
ORDER BY created_at DESC;