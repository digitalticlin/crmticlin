-- =====================================================
-- SCRIPT DE TESTE DE VISIBILIDADE DE LEADS
-- =====================================================

-- 1. Verificar funções criadas
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('get_user_role', 'get_user_organization_id');

-- 2. Verificar políticas RLS na tabela leads
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'leads'
ORDER BY policyname;

-- 3. Testar as funções com seu usuário atual
SELECT 
    auth.uid() as current_user_id,
    public.get_user_role() as user_role,
    public.get_user_organization_id() as organization_id;

-- 4. Verificar perfil do usuário atual
SELECT 
    id,
    linked_auth_user_id,
    role,
    created_by_user_id,
    email,
    full_name
FROM profiles
WHERE linked_auth_user_id = auth.uid();

-- 5. Contar leads visíveis para o usuário atual
SELECT 
    COUNT(*) as total_leads_visible,
    COUNT(DISTINCT created_by_user_id) as different_creators,
    COUNT(DISTINCT owner_id) as different_owners
FROM leads;

-- 6. Listar primeiros 10 leads visíveis com detalhes
SELECT 
    id,
    name,
    created_by_user_id,
    owner_id,
    funnel_id,
    kanban_stage_id,
    created_at
FROM leads
ORDER BY created_at DESC
LIMIT 10;

-- 7. Verificar se existem leads na base (sem RLS - apenas para debug)
-- ATENÇÃO: Este comando só funcionará com service_role ou desabilitando RLS temporariamente
-- SELECT COUNT(*) as total_leads_in_database FROM leads;

-- 8. Verificar estrutura de um lead específico para debug
SELECT 
    l.id,
    l.name,
    l.created_by_user_id,
    l.owner_id,
    pc.email as creator_email,
    pc.role as creator_role,
    po.email as owner_email,
    po.role as owner_role
FROM leads l
LEFT JOIN profiles pc ON pc.linked_auth_user_id = l.created_by_user_id
LEFT JOIN profiles po ON po.linked_auth_user_id = l.owner_id
LIMIT 5;

-- 9. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('leads', 'profiles')
AND schemaname = 'public';