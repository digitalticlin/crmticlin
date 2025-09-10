-- 📊 ANÁLISE DA ESTRUTURA ATUAL DO BANCO DE DADOS PARA SISTEMA DE EQUIPES

-- ===============================
-- 1. ESTRUTURA ATUAL DE USUÁRIOS 
-- ===============================

-- Verificar tabela profiles (estrutura base)
SELECT 
    'PROFILES TABLE STRUCTURE' as analysis_type,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar dados atuais da tabela profiles
SELECT 
    'CURRENT PROFILES DATA' as analysis_type,
    id,
    full_name,
    role,
    email,
    invite_status,
    created_by_user_id,
    linked_auth_user_id,
    created_at
FROM public.profiles
ORDER BY created_at DESC;

-- ===============================
-- 2. ESTRUTURA DE LEADS E OWNERSHIP
-- ===============================

-- Verificar estrutura da tabela leads
SELECT 
    'LEADS TABLE STRUCTURE' as analysis_type,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se owner_id existe na tabela leads
SELECT 
    COUNT(*) as total_leads,
    COUNT(owner_id) as leads_with_owner_id,
    COUNT(created_by_user_id) as leads_with_created_by_user_id
FROM public.leads;

-- ===============================
-- 3. SISTEMA DE ATRIBUIÇÕES ATUAL
-- ===============================

-- Verificar tabela user_funnels
SELECT 
    'USER_FUNNELS STRUCTURE' as analysis_type,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_funnels' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar dados atuais de user_funnels
SELECT 
    'USER_FUNNELS DATA' as analysis_type,
    uf.*,
    p.full_name,
    p.role,
    f.name as funnel_name
FROM public.user_funnels uf
LEFT JOIN public.profiles p ON uf.profile_id = p.id
LEFT JOIN public.funnels f ON uf.funnel_id = f.id
ORDER BY uf.created_at DESC;

-- Verificar tabela user_whatsapp_numbers
SELECT 
    'USER_WHATSAPP_NUMBERS STRUCTURE' as analysis_type,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_whatsapp_numbers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar dados atuais de user_whatsapp_numbers
SELECT 
    'USER_WHATSAPP_NUMBERS DATA' as analysis_type,
    uwn.*,
    p.full_name,
    p.role,
    wi.instance_name
FROM public.user_whatsapp_numbers uwn
LEFT JOIN public.profiles p ON uwn.profile_id = p.id
LEFT JOIN public.whatsapp_instances wi ON uwn.whatsapp_number_id = wi.id
ORDER BY uwn.created_at DESC;

-- ===============================
-- 4. POLÍTICAS RLS ATUAIS
-- ===============================

-- Verificar políticas RLS existentes para leads
SELECT 
    'RLS POLICIES FOR LEADS' as analysis_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'leads';

-- Verificar políticas RLS para profiles
SELECT 
    'RLS POLICIES FOR PROFILES' as analysis_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Verificar se RLS está habilitado
SELECT 
    'RLS STATUS' as analysis_type,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('leads', 'profiles', 'user_funnels', 'user_whatsapp_numbers', 'funnels', 'whatsapp_instances')
AND schemaname = 'public';

-- ===============================
-- 5. FUNÇÕES EXISTENTES
-- ===============================

-- Verificar funções relacionadas ao sistema de equipes
SELECT 
    'TEAM FUNCTIONS' as analysis_type,
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%team%' 
OR routine_name LIKE '%owner%'
OR routine_name LIKE '%funnel%'
OR routine_name LIKE '%whatsapp%'
ORDER BY routine_name;

-- ===============================
-- 6. TRIGGERS EXISTENTES
-- ===============================

-- Verificar triggers relacionados ao owner_id
SELECT 
    'OWNER_ID TRIGGERS' as analysis_type,
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%owner%' 
OR trigger_name LIKE '%funnel%'
OR trigger_name LIKE '%whatsapp%'
OR action_statement LIKE '%owner_id%'
ORDER BY event_object_table, trigger_name;

-- ===============================
-- 7. RELACIONAMENTOS E CONSTRAINTS
-- ===============================

-- Verificar foreign keys relevantes
SELECT 
    'FOREIGN_KEYS' as analysis_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('leads', 'profiles', 'user_funnels', 'user_whatsapp_numbers')
ORDER BY tc.table_name;

-- ===============================
-- 8. ÍNDICES EXISTENTES
-- ===============================

-- Verificar índices nas tabelas principais
SELECT 
    'INDEXES' as analysis_type,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('leads', 'profiles', 'user_funnels', 'user_whatsapp_numbers')
AND schemaname = 'public'
ORDER BY tablename, indexname;