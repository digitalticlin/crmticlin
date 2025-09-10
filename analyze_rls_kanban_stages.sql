-- ============================================
-- ANÁLISE DO RLS DA TABELA kanban_stages
-- ============================================

-- 1. Ver todas as políticas RLS da tabela kanban_stages
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
WHERE tablename = 'kanban_stages'
ORDER BY policyname;

-- 2. Ver a estrutura da tabela kanban_stages
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'kanban_stages'
ORDER BY ordinal_position;

-- 3. Verificar se RLS está ativado
SELECT 
    relname as table_name,
    relrowsecurity as rls_enabled,
    relforcerowsecurity as rls_forced
FROM pg_class
WHERE relname = 'kanban_stages';

-- 4. Análise de dados para entender a estrutura
-- Quantas etapas existem por funil e quem as criou
SELECT 
    ks.funnel_id,
    f.name as funnel_name,
    f.created_by_user_id as funnel_owner,
    COUNT(ks.id) as total_stages,
    STRING_AGG(ks.title, ', ' ORDER BY ks.order_position) as stage_names
FROM kanban_stages ks
JOIN funnels f ON f.id = ks.funnel_id
WHERE f.id = '28dfc9bb-3c5c-482c-aca6-805a5c2bf280' -- ID do funil do operacional
GROUP BY ks.funnel_id, f.name, f.created_by_user_id;

-- 5. Verificar permissões do usuário operacional nos funis
SELECT 
    uf.profile_id as operational_user_id,
    uf.funnel_id,
    f.name as funnel_name,
    f.created_by_user_id as admin_id,
    p.email as operational_email
FROM user_funnels uf
JOIN funnels f ON f.id = uf.funnel_id
JOIN profiles p ON p.id = uf.profile_id
WHERE uf.profile_id = 'd0bdb8e2-556f-48da-af90-63f14c119340'; -- ID do operacional

-- 6. Tentar simular a query que o operacional faria
-- Esta query mostra o que o operacional DEVERIA ver
SELECT 
    ks.*,
    'Via Funil Atribuído' as access_reason
FROM kanban_stages ks
WHERE ks.funnel_id IN (
    SELECT funnel_id 
    FROM user_funnels 
    WHERE profile_id = 'd0bdb8e2-556f-48da-af90-63f14c119340'
)
ORDER BY ks.funnel_id, ks.order_position;