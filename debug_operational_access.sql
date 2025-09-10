-- Debug: Verificar dados para usuário operacional
-- Execute este SQL no painel do Supabase para verificar

-- 1. Verificar usuários operacionais
SELECT 
    'USUARIOS OPERACIONAIS' as type,
    p.id,
    p.full_name,
    p.email,
    p.role
FROM profiles p
WHERE p.role = 'operational'
ORDER BY p.created_at DESC;

-- 2. Verificar mapeamentos user_funnels
SELECT 
    'USER_FUNNELS MAPPINGS' as type,
    uf.id,
    uf.profile_id,
    uf.funnel_id,
    uf.created_by_user_id,
    p.full_name as user_name,
    f.name as funnel_name
FROM user_funnels uf
LEFT JOIN profiles p ON uf.profile_id = p.id
LEFT JOIN funnels f ON uf.funnel_id = f.id
ORDER BY uf.created_at DESC;

-- 3. Verificar mapeamentos user_whatsapp_numbers
SELECT 
    'USER_WHATSAPP MAPPINGS' as type,
    uwn.id,
    uwn.profile_id,
    uwn.whatsapp_number_id,
    uwn.created_by_user_id,
    p.full_name as user_name,
    wi.instance_name
FROM user_whatsapp_numbers uwn
LEFT JOIN profiles p ON uwn.profile_id = p.id
LEFT JOIN whatsapp_instances wi ON uwn.whatsapp_number_id = wi.id
ORDER BY uwn.created_at DESC;

-- 4. Verificar se existe ao menos um usuário operacional com dados atribuídos
SELECT 
    'OPERATIONAL USER STATUS' as type,
    p.full_name,
    p.email,
    COUNT(DISTINCT uf.funnel_id) as funnels_count,
    COUNT(DISTINCT uwn.whatsapp_number_id) as whatsapp_count
FROM profiles p
LEFT JOIN user_funnels uf ON uf.profile_id = p.id
LEFT JOIN user_whatsapp_numbers uwn ON uwn.profile_id = p.id
WHERE p.role = 'operational'
GROUP BY p.id, p.full_name, p.email;