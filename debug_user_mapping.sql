-- =====================================================
-- 🔍 DEBUG: VERIFICAR MAPEAMENTOS DO USUÁRIO ESPECÍFICO
-- =====================================================

-- 1. Verificar qual é o ID do usuário logado na página de teste
-- (pelo filtro de leads, parece ser: d0bdb8e2-556f-48da-af90-63f14c119340)

-- 2. Verificar se existem mapeamentos user_funnels para este usuário
SELECT 
    'USER_FUNNELS PARA O USUÁRIO LOGADO' as info,
    uf.*,
    p.full_name as user_name,
    f.name as funnel_name
FROM user_funnels uf
LEFT JOIN profiles p ON uf.profile_id = p.id
LEFT JOIN funnels f ON uf.funnel_id = f.id
WHERE uf.profile_id = 'd0bdb8e2-556f-48da-af90-63f14c119340';

-- 3. Verificar se existem mapeamentos user_whatsapp_numbers para este usuário
SELECT 
    'USER_WHATSAPP PARA O USUÁRIO LOGADO' as info,
    uwn.*,
    p.full_name as user_name,
    wi.instance_name
FROM user_whatsapp_numbers uwn
LEFT JOIN profiles p ON uwn.profile_id = p.id
LEFT JOIN whatsapp_instances wi ON uwn.whatsapp_number_id = wi.id
WHERE uwn.profile_id = 'd0bdb8e2-556f-48da-af90-63f14c119340';

-- 4. Verificar todos os mapeamentos user_funnels existentes
SELECT 
    'TODOS OS USER_FUNNELS' as info,
    uf.profile_id,
    p.full_name,
    p.email,
    uf.funnel_id,
    f.name as funnel_name
FROM user_funnels uf
LEFT JOIN profiles p ON uf.profile_id = p.id
LEFT JOIN funnels f ON uf.funnel_id = f.id
ORDER BY uf.created_at DESC;

-- 5. Verificar todos os mapeamentos user_whatsapp_numbers existentes
SELECT 
    'TODOS OS USER_WHATSAPP' as info,
    uwn.profile_id,
    p.full_name,
    p.email,
    uwn.whatsapp_number_id,
    wi.instance_name
FROM user_whatsapp_numbers uwn
LEFT JOIN profiles p ON uwn.profile_id = p.id
LEFT JOIN whatsapp_instances wi ON uwn.whatsapp_number_id = wi.id
ORDER BY uwn.created_at DESC;