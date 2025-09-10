-- =====================================================
-- CORREÇÃO PARA O ADMIN DIGITALTICLIN
-- ID correto: 712e7708-2299-4a00-9128-577c8f113ca4
-- =====================================================

-- 1. Verificar o perfil do digitalticlin com o ID correto
SELECT 
    linked_auth_user_id,
    email,
    role,
    full_name,
    created_by_user_id
FROM profiles
WHERE linked_auth_user_id = '712e7708-2299-4a00-9128-577c8f113ca4';

-- 2. Verificar quantos leads este admin possui atualmente
SELECT 
    COUNT(*) as total_leads_do_admin_digitalticlin
FROM leads
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4';

-- 3. Verificar os leads órfãos que provavelmente pertencem a este admin
-- ID antigo: 9936ae64-b78c-48fe-97e8-bf67623349c6 (2.317 leads)
SELECT 
    created_by_user_id,
    COUNT(*) as total_leads,
    MIN(created_at) as primeiro_lead,
    MAX(created_at) as ultimo_lead
FROM leads
WHERE created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'
GROUP BY created_by_user_id;

-- 4. CORREÇÃO: Migrar leads do ID antigo para o ID correto do digitalticlin
-- DESCOMENTE para executar a migração
/*
UPDATE leads 
SET created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'
WHERE created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6';
*/

-- 5. Corrigir também o owner_id para leads sem owner
/*
UPDATE leads 
SET owner_id = '712e7708-2299-4a00-9128-577c8f113ca4'
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'
AND owner_id IS NULL;
*/

-- 6. Migrar outros IDs órfãos que também podem pertencer ao digitalticlin
-- IDs identificados: 152f2390-ede4-4f46-89bc-da3d7f5da747 (1.146 leads), etc.
SELECT 
    'IDs órfãos com muitos leads' as info,
    created_by_user_id,
    COUNT(*) as total_leads
FROM leads
WHERE created_by_user_id IN (
    '152f2390-ede4-4f46-89bc-da3d7f5da747',  -- 1.146 leads
    '8cf224c2-2bed-4687-89a9-8639e76acd47',   -- 564 leads
    'd08b159d-39ad-479a-9f21-d63c13f9e7ee',   -- 563 leads
    '02bb7449-ed24-4e9a-8eb2-5a758e4cf871',   -- 431 leads
    '7c197601-01cc-4f71-a4d8-7c1357cac113',   -- 398 leads
    'd973d018-d053-4a39-b023-765332152dac',   -- 194 leads
    'fe93fa35-a38f-4c08-86c4-0dabc90df5a0',   -- 90 leads
    'c9181d71-2616-4e2c-9dab-d9c2f30f4e33'    -- 31 leads
)
AND created_by_user_id NOT IN (
    SELECT linked_auth_user_id FROM profiles
)
GROUP BY created_by_user_id
ORDER BY total_leads DESC;

-- 7. OPCIONAL: Migrar TODOS os leads órfãos para o digitalticlin
-- CUIDADO: Isso vai atribuir TODOS os leads sem dono ao digitalticlin
/*
UPDATE leads 
SET created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'
WHERE created_by_user_id NOT IN (
    SELECT linked_auth_user_id FROM profiles
);
*/

-- 8. Verificar o operacional vinculado ao digitalticlin
SELECT 
    p.email as operacional_email,
    p.linked_auth_user_id as operacional_id,
    p.created_by_user_id as admin_id,
    p.role,
    COUNT(l.id) as leads_atribuidos
FROM profiles p
LEFT JOIN leads l ON l.owner_id = p.linked_auth_user_id
WHERE p.created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'
GROUP BY p.email, p.linked_auth_user_id, p.created_by_user_id, p.role;

-- 9. Resultado final após correções
SELECT 
    'Estatísticas Finais' as info,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4' THEN 1 END) as leads_digitalticlin,
    COUNT(CASE WHEN owner_id = '712e7708-2299-4a00-9128-577c8f113ca4' THEN 1 END) as leads_onde_digitalticlin_e_owner,
    COUNT(CASE WHEN owner_id IS NULL THEN 1 END) as leads_sem_owner
FROM leads;

-- 10. Testar se o digitalticlin consegue ver os leads agora
SELECT 
    'Teste de visibilidade para digitalticlin' as teste,
    COUNT(*) as leads_visiveis
FROM leads
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4';