-- =====================================================
-- TESTE FINAL DE ACESSO POR NÍVEIS
-- Execute como usuário específico no Supabase Dashboard
-- =====================================================

-- 1. Informações do usuário atual
SELECT 
    'Informações do usuário logado' as secao,
    auth.uid() as meu_id,
    auth.email() as meu_email;

-- 2. Meu perfil na tabela profiles
SELECT 
    'Meu perfil' as secao,
    id as profile_id,
    linked_auth_user_id,
    email,
    role,
    created_by_user_id,
    full_name
FROM profiles
WHERE linked_auth_user_id = auth.uid();

-- 3. TESTE ADMIN: Se sou admin, quantos leads vejo?
SELECT 
    'TESTE ADMIN - Leads que consigo ver' as secao,
    COUNT(*) as total_leads_visiveis
FROM leads;

-- 4. TESTE ESPECÍFICO: Leads onde sou created_by_user_id
SELECT 
    'Leads onde sou created_by_user_id' as secao,
    COUNT(*) as total
FROM leads
WHERE created_by_user_id = auth.uid();

-- 5. TESTE ESPECÍFICO: Leads onde sou owner_id
SELECT 
    'Leads onde sou owner_id' as secao,
    COUNT(*) as total
FROM leads
WHERE owner_id = auth.uid();

-- 6. COMPARAÇÃO: Total de leads na base (para referência)
-- Esta query só funciona com service_role ou sem RLS
-- Se retornar erro, significa que RLS está funcionando corretamente
SELECT 
    'VERIFICAÇÃO RLS - Se esta query falhar, RLS está funcionando' as secao,
    'Executando sem filtros...' as info;

-- 7. Verificar políticas ativas
SELECT 
    'Políticas RLS ativas' as secao,
    policyname,
    cmd as operacao
FROM pg_policies
WHERE tablename = 'leads'
ORDER BY policyname;

-- 8. Amostrar alguns leads visíveis (primeiros 3)
SELECT 
    'AMOSTRA - Primeiros 3 leads visíveis' as secao,
    id,
    name,
    created_by_user_id,
    owner_id,
    CASE 
        WHEN created_by_user_id = auth.uid() THEN 'EU CRIEI'
        WHEN owner_id = auth.uid() THEN 'SOU OWNER'
        ELSE 'OUTRO CRITÉRIO'
    END as porque_vejo
FROM leads
ORDER BY created_at DESC
LIMIT 3;