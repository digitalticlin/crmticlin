-- =====================================================
-- TESTE DE POLÍTICAS RLS - EXECUTAR COMO USUÁRIO ESPECÍFICO
-- Execute no Supabase Dashboard usando "Run as user"
-- =====================================================

-- 1. Verificar qual usuário está executando
SELECT 
    auth.uid() as meu_auth_uid,
    auth.email() as meu_email;

-- 2. Buscar meu perfil na tabela profiles
SELECT 
    id,
    linked_auth_user_id,
    email,
    role,
    created_by_user_id,
    full_name
FROM profiles
WHERE linked_auth_user_id = auth.uid();

-- 3. Se sou ADMIN - verificar quantos leads DEVERIA ver
-- (leads onde created_by_user_id = meu auth.uid())
SELECT 
    'Como ADMIN - leads que deveria ver' as info,
    COUNT(*) as total
FROM leads
WHERE created_by_user_id = auth.uid();

-- 4. Se sou OPERACIONAL - verificar quantos leads DEVERIA ver  
-- (leads onde owner_id = meu auth.uid())
SELECT 
    'Como OPERACIONAL - leads que deveria ver' as info,
    COUNT(*) as total
FROM leads
WHERE owner_id = auth.uid();

-- 5. TESTE REAL: Quantos leads EU CONSIGO VER com as políticas RLS atuais?
SELECT 
    'TESTE RLS - leads que consigo ver' as info,
    COUNT(*) as total
FROM leads;

-- 6. Se não vejo nenhum lead, verificar se as políticas existem
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'leads'
ORDER BY policyname;

-- 7. Verificar se RLS está habilitado na tabela leads
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'leads'
AND schemaname = 'public';