-- INVESTIGAR CONTEXTO DE AUTENTICAÇÃO
-- Execute este SQL manualmente quando logado como usuário operacional

-- ========================================
-- 1. VERIFICAR CONTEXTO DE AUTH
-- ========================================
SELECT 
    '=== CONTEXTO AUTH ===' as info,
    auth.uid() as user_id_from_auth,
    auth.jwt() as jwt_payload,
    current_user as postgres_user,
    session_user as session_user;

-- ========================================  
-- 2. VERIFICAR HEADERS DA REQUISIÇÃO
-- ========================================
SELECT 
    '=== HEADERS ===' as info,
    current_setting('request.jwt.claims', true) as jwt_claims,
    current_setting('request.headers', true) as request_headers;

-- ========================================
-- 3. BUSCAR PROFILE POR UUID DIRETO (BYPASS RLS)
-- ========================================
-- Substitua 'a5aedd43-c4bd-481e-a061-d96d17127b26' pelo ID do usuário operacional
SELECT 
    '=== PROFILE DIRETO (BYPASS RLS) ===' as info,
    id,
    full_name,
    email,
    role,
    linked_auth_user_id,
    created_by_user_id,
    invite_status
FROM profiles 
WHERE id = 'a5aedd43-c4bd-481e-a061-d96d17127b26'::uuid;