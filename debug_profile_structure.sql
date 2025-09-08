-- 🔍 DIAGNÓSTICO: Verificar estrutura real da tabela profiles
-- Para entender por que linked_auth_user_id não encontra o admin

-- ========================================
-- 1. VERIFICAR ESTRUTURA DA TABELA
-- ========================================

SELECT '=== ESTRUTURA DA TABELA PROFILES ===' as info;

-- Ver todas as colunas da tabela profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- ========================================
-- 2. BUSCAR O ADMIN ESPECÍFICO
-- ========================================

SELECT '=== BUSCAR ADMIN POR DIFERENTES CAMPOS ===' as info;

-- Tentar encontrar o admin por email
SELECT 
    id,
    email,
    linked_auth_user_id,
    role,
    created_by_user_id,
    'Encontrado por email' as metodo
FROM profiles 
WHERE email = 'adm.geuniformes@gmail.com';

-- Tentar encontrar por ID direto (que aparece nos logs)
SELECT 
    id,
    email,
    linked_auth_user_id,
    role,
    created_by_user_id,
    'Encontrado por ID direto' as metodo
FROM profiles 
WHERE id = '7c197601-01cc-4f71-a4d8-7c1357cac113';

-- Ver todos os profiles para entender a estrutura
SELECT 
    id,
    email,
    linked_auth_user_id,
    role,
    created_by_user_id,
    'Todos os profiles' as metodo
FROM profiles 
LIMIT 5;

-- ========================================
-- 3. VERIFICAR AUTH.USERS
-- ========================================

SELECT '=== VERIFICAR AUTH.USERS ===' as info;

-- Ver se o usuário existe em auth.users
SELECT 
    id,
    email,
    email_confirmed_at,
    'Usuario em auth.users' as metodo
FROM auth.users 
WHERE id = '7c197601-01cc-4f71-a4d8-7c1357cac113'
   OR email = 'adm.geuniformes@gmail.com';

-- ========================================
-- 4. DESCOBRIR A LIGAÇÃO CORRETA
-- ========================================

SELECT '=== DESCOBRIR LIGAÇÃO CORRETA ===' as info;

-- Se linked_auth_user_id está NULL, talvez a ligação seja por outro campo
SELECT 
    p.id as profile_id,
    p.email as profile_email,
    p.linked_auth_user_id,
    p.role,
    au.id as auth_user_id,
    au.email as auth_email,
    CASE 
        WHEN p.linked_auth_user_id = au.id THEN 'Linked por linked_auth_user_id'
        WHEN p.id = au.id THEN 'Linked por ID direto'
        WHEN p.email = au.email THEN 'Linked por email'
        ELSE 'SEM LIGAÇÃO'
    END as tipo_ligacao
FROM profiles p
FULL OUTER JOIN auth.users au ON (
    p.linked_auth_user_id = au.id 
    OR p.id = au.id 
    OR p.email = au.email
)
WHERE au.email = 'adm.geuniformes@gmail.com'
   OR p.email = 'adm.geuniformes@gmail.com'
   OR au.id = '7c197601-01cc-4f71-a4d8-7c1357cac113'
   OR p.id = '7c197601-01cc-4f71-a4d8-7c1357cac113';

-- ========================================
-- RESULTADO ESPERADO
-- ========================================

-- Este script deve revelar:
-- 1. Se linked_auth_user_id existe e está populated
-- 2. Qual é o valor real do linked_auth_user_id para o admin
-- 3. Se a ligação é feita por outro campo (id direto, email)
-- 4. Por que a consulta .eq('linked_auth_user_id', user.id) não funciona