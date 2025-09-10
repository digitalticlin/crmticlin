-- =====================================================
-- 🔍 VERIFICAR ACESSO ÀS STAGES PARA OPERACIONAL
-- Usuário: vendas02@geuniformes.com.br
-- Profile ID: d0bdb8e2-556f-48da-af90-63f14c119340
-- Funil ID: 28dfc9bb-3c5c-482c-aca6-805a5c2bf280
-- =====================================================

-- 1. Verificar se existem stages no funil
SELECT 
    '1. STAGES NO FUNIL' as info,
    COUNT(*) as total_stages,
    STRING_AGG(name, ', ' ORDER BY order_position) as stage_names
FROM kanban_stages
WHERE funnel_id = '28dfc9bb-3c5c-482c-aca6-805a5c2bf280';

-- 2. Listar todas as stages com detalhes
SELECT 
    '2. DETALHES DAS STAGES' as info,
    id,
    name,
    order_position,
    created_by_user_id,
    created_at
FROM kanban_stages
WHERE funnel_id = '28dfc9bb-3c5c-482c-aca6-805a5c2bf280'
ORDER BY order_position;

-- 3. Verificar se o usuário tem acesso ao funil
SELECT 
    '3. ACESSO AO FUNIL' as info,
    uf.profile_id,
    uf.funnel_id,
    f.name as funnel_name,
    f.created_by_user_id as funnel_owner
FROM user_funnels uf
JOIN funnels f ON uf.funnel_id = f.id
WHERE uf.profile_id = 'd0bdb8e2-556f-48da-af90-63f14c119340'
AND uf.funnel_id = '28dfc9bb-3c5c-482c-aca6-805a5c2bf280';

-- 4. Simular query que o sistema faz (com RLS)
-- Esta é a query que o hook provavelmente está fazendo
SELECT 
    '4. QUERY SIMULADA COM RLS' as info,
    *
FROM kanban_stages
WHERE funnel_id = '28dfc9bb-3c5c-482c-aca6-805a5c2bf280'
ORDER BY order_position;

-- 5. Verificar se há políticas RLS bloqueando stages
SELECT 
    '5. POLÍTICAS RLS NA TABELA STAGES' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'kanban_stages';

-- 6. Contar leads por stage (para ver se o problema é só visual)
SELECT 
    '6. LEADS POR STAGE' as info,
    ks.name as stage_name,
    COUNT(l.id) as total_leads
FROM kanban_stages ks
LEFT JOIN leads l ON ks.id = l.kanban_stage_id
WHERE ks.funnel_id = '28dfc9bb-3c5c-482c-aca6-805a5c2bf280'
GROUP BY ks.id, ks.name, ks.order_position
ORDER BY ks.order_position;