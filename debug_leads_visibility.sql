-- DEBUG: ANALISAR VISIBILIDADE DE LEADS PARA ADMIN
-- Verificar a estrutura atual dos leads e permissões

-- 1. Verificar estrutura da tabela leads
SELECT 
    '=== ESTRUTURA TABELA LEADS ===' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND table_schema = 'public'
AND column_name IN ('id', 'created_by_user_id', 'owner_id', 'funnel_id', 'whatsapp_instance_id')
ORDER BY ordinal_position;

-- 2. Verificar dados do admin e operacional
SELECT 
    '=== USUÁRIOS ADMIN/OPERACIONAL ===' as info,
    id as profile_id,
    full_name,
    role,
    linked_auth_user_id,
    created_by_user_id,
    email
FROM profiles 
WHERE role IN ('admin', 'operational')
ORDER BY role, full_name;

-- 3. Verificar leads existentes com detalhes
SELECT 
    '=== LEADS ATUAIS ===' as info,
    l.id,
    l.name,
    l.created_by_user_id,
    l.owner_id,
    l.funnel_id,
    l.whatsapp_instance_id,
    -- Dados do criador
    p1.full_name as criador_nome,
    p1.role as criador_role,
    -- Dados do owner
    p2.full_name as owner_nome,
    p2.role as owner_role
FROM leads l
LEFT JOIN profiles p1 ON p1.linked_auth_user_id = l.created_by_user_id
LEFT JOIN profiles p2 ON p2.linked_auth_user_id = l.owner_id
ORDER BY l.created_at DESC
LIMIT 10;

-- 4. Verificar vinculação de usuários operacionais com instâncias
SELECT 
    '=== VINCULAÇÃO WHATSAPP ===' as info,
    uwn.profile_id,
    p.full_name as operacional_nome,
    uwn.whatsapp_number_id,
    wi.name as instancia_nome,
    uwn.created_by_user_id as admin_id
FROM user_whatsapp_numbers uwn
JOIN profiles p ON p.id = uwn.profile_id
LEFT JOIN whatsapp_instances wi ON wi.id = uwn.whatsapp_number_id
ORDER BY uwn.created_at DESC;

-- 5. Verificar vinculação de usuários operacionais com funis
SELECT 
    '=== VINCULAÇÃO FUNIS ===' as info,
    uf.profile_id,
    p.full_name as operacional_nome,
    uf.funnel_id,
    f.name as funil_nome,
    uf.created_by_user_id as admin_id
FROM user_funnels uf
JOIN profiles p ON p.id = uf.profile_id
LEFT JOIN funnels f ON f.id = uf.funnel_id
ORDER BY uf.created_at DESC;