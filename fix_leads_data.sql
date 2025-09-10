-- =====================================================
-- SCRIPT PARA DIAGNOSTICAR E CORRIGIR DADOS DE LEADS
-- =====================================================

-- 1. Verificar se há leads sem created_by_user_id
SELECT 
    COUNT(*) as leads_sem_created_by,
    array_agg(id) as lead_ids
FROM leads
WHERE created_by_user_id IS NULL;

-- 2. Verificar se há leads sem owner_id
SELECT 
    COUNT(*) as leads_sem_owner,
    array_agg(id) as lead_ids
FROM leads
WHERE owner_id IS NULL;

-- 3. Verificar relação entre created_by_user_id e owner_id
SELECT 
    l.created_by_user_id,
    pc.email as creator_email,
    pc.role as creator_role,
    l.owner_id,
    po.email as owner_email,
    po.role as owner_role,
    COUNT(*) as total_leads
FROM leads l
LEFT JOIN profiles pc ON pc.linked_auth_user_id = l.created_by_user_id
LEFT JOIN profiles po ON po.linked_auth_user_id = l.owner_id
GROUP BY l.created_by_user_id, pc.email, pc.role, l.owner_id, po.email, po.role
ORDER BY total_leads DESC;

-- 4. Para admin específico (substitua o email), verificar seus leads
WITH admin_user AS (
    SELECT linked_auth_user_id 
    FROM profiles 
    WHERE email = 'inacio@ticlin.com.br' -- Substitua pelo email do admin
    AND role = 'admin'
    LIMIT 1
)
SELECT 
    COUNT(*) as total_leads_do_admin,
    COUNT(CASE WHEN l.owner_id = au.linked_auth_user_id THEN 1 END) as leads_onde_admin_e_owner,
    COUNT(CASE WHEN l.owner_id != au.linked_auth_user_id THEN 1 END) as leads_atribuidos_a_outros
FROM leads l
CROSS JOIN admin_user au
WHERE l.created_by_user_id = au.linked_auth_user_id;

-- 5. Verificar operacionais e seus leads atribuídos
SELECT 
    p.email as operacional_email,
    p.linked_auth_user_id as operacional_id,
    p.created_by_user_id as admin_id,
    pa.email as admin_email,
    COUNT(l.id) as total_leads_atribuidos
FROM profiles p
LEFT JOIN profiles pa ON pa.linked_auth_user_id = p.created_by_user_id
LEFT JOIN leads l ON l.owner_id = p.linked_auth_user_id
WHERE p.role = 'operational'
GROUP BY p.email, p.linked_auth_user_id, p.created_by_user_id, pa.email;

-- 6. CORREÇÃO: Atualizar leads sem owner_id para o created_by_user_id
-- DESCOMENTE apenas se quiser executar a correção
-- UPDATE leads 
-- SET owner_id = created_by_user_id 
-- WHERE owner_id IS NULL 
-- AND created_by_user_id IS NOT NULL;

-- 7. CORREÇÃO: Para leads órfãos (sem created_by), atribuir ao admin principal
-- DESCOMENTE e ajuste o ID do admin se necessário
-- UPDATE leads 
-- SET created_by_user_id = (
--     SELECT linked_auth_user_id 
--     FROM profiles 
--     WHERE role = 'admin' 
--     LIMIT 1
-- )
-- WHERE created_by_user_id IS NULL;

-- 8. Verificar se existem leads com IDs de usuários que não existem mais
SELECT 
    'created_by não existe' as problema,
    COUNT(*) as quantidade
FROM leads l
WHERE NOT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.linked_auth_user_id = l.created_by_user_id
)
UNION ALL
SELECT 
    'owner_id não existe' as problema,
    COUNT(*) as quantidade
FROM leads l
WHERE NOT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.linked_auth_user_id = l.owner_id
);

-- 9. Estatísticas gerais dos leads
SELECT 
    COUNT(*) as total_leads,
    COUNT(DISTINCT created_by_user_id) as total_criadores,
    COUNT(DISTINCT owner_id) as total_owners,
    COUNT(DISTINCT funnel_id) as total_funis,
    COUNT(CASE WHEN created_by_user_id = owner_id THEN 1 END) as leads_nao_atribuidos,
    COUNT(CASE WHEN created_by_user_id != owner_id THEN 1 END) as leads_atribuidos
FROM leads;