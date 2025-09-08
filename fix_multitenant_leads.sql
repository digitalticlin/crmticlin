-- =====================================================
-- CORREÇÃO MULTITENANT - RESTAURAR created_by_user_id
-- Usuário modelo: 9936ae64-b78c-48fe-97e8-bf67623349c6
-- =====================================================

-- 1. ANÁLISE: Verificar situação atual dos leads
SELECT 
    'Análise do problema' as info,
    created_by_user_id,
    owner_id,
    COUNT(*) as total_leads,
    CASE 
        WHEN created_by_user_id = owner_id THEN 'Normal'
        WHEN created_by_user_id != owner_id THEN 'Possivelmente migrado incorretamente'
    END as status
FROM leads
WHERE created_by_user_id IN (
    '9936ae64-b78c-48fe-97e8-bf67623349c6',
    '9fb02aac-79d7-4238-a85b-dcfc3d05a92e', -- nathirosa26
    '712e7708-2299-4a00-9128-577c8f113ca4'  -- digitalticlin
)
GROUP BY created_by_user_id, owner_id
ORDER BY total_leads DESC;

-- 2. Verificar se o usuário 9936ae64 tem perfil criado
SELECT 
    'Perfil existe?' as verificacao,
    linked_auth_user_id,
    email,
    role,
    created_by_user_id
FROM profiles
WHERE linked_auth_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6';

-- 3. CRIAR PERFIL para o usuário 9936ae64 se não existir
-- Este usuário parece ser um admin com 2.317 leads
-- DESCOMENTE para executar
/*
INSERT INTO profiles (
    linked_auth_user_id,
    email,
    role,
    full_name,
    created_at,
    updated_at
) VALUES (
    '9936ae64-b78c-48fe-97e8-bf67623349c6',
    'admin@empresa1.com.br', -- Ajuste o email conforme necessário
    'admin',
    'Admin Empresa 1',
    NOW(),
    NOW()
)
ON CONFLICT (linked_auth_user_id) 
DO UPDATE SET 
    role = 'admin',
    updated_at = NOW();
*/

-- 4. IDENTIFICAR leads que foram migrados incorretamente
-- Leads onde nathirosa é created_by mas deveria ser apenas owner
SELECT 
    'Leads migrados incorretamente para nathirosa' as problema,
    COUNT(*) as total
FROM leads
WHERE created_by_user_id = '9fb02aac-79d7-4238-a85b-dcfc3d05a92e' -- nathirosa
AND owner_id = '9fb02aac-79d7-4238-a85b-dcfc3d05a92e';

-- 5. CORREÇÃO: Restaurar created_by_user_id original
-- Para leads da nathirosa, o created_by deveria ser o admin dela (712e7708)
-- DESCOMENTE para executar
/*
UPDATE leads 
SET created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4' -- digitalticlin (admin da nathirosa)
WHERE created_by_user_id = '9fb02aac-79d7-4238-a85b-dcfc3d05a92e' -- nathirosa
AND owner_id = '9fb02aac-79d7-4238-a85b-dcfc3d05a92e';
*/

-- 6. Criar perfis para TODOS os usuários com muitos leads
-- DESCOMENTE para executar
/*
-- Criar perfil para 152f2390-ede4-4f46-89bc-da3d7f5da747 (1.146 leads)
INSERT INTO profiles (linked_auth_user_id, email, role, full_name, created_at, updated_at)
VALUES ('152f2390-ede4-4f46-89bc-da3d7f5da747', 'admin2@empresa.com.br', 'admin', 'Admin 2', NOW(), NOW())
ON CONFLICT (linked_auth_user_id) DO NOTHING;

-- Criar perfil para 8cf224c2-2bed-4687-89a9-8639e76acd47 (564 leads)
INSERT INTO profiles (linked_auth_user_id, email, role, full_name, created_at, updated_at)
VALUES ('8cf224c2-2bed-4687-89a9-8639e76acd47', 'admin3@empresa.com.br', 'admin', 'Admin 3', NOW(), NOW())
ON CONFLICT (linked_auth_user_id) DO NOTHING;

-- Criar perfil para d08b159d-39ad-479a-9f21-d63c13f9e7ee (563 leads)
INSERT INTO profiles (linked_auth_user_id, email, role, full_name, created_at, updated_at)
VALUES ('d08b159d-39ad-479a-9f21-d63c13f9e7ee', 'admin4@empresa.com.br', 'admin', 'Admin 4', NOW(), NOW())
ON CONFLICT (linked_auth_user_id) DO NOTHING;

-- Criar perfil para 02bb7449-ed24-4e9a-8eb2-5a758e4cf871 (431 leads)
INSERT INTO profiles (linked_auth_user_id, email, role, full_name, created_at, updated_at)
VALUES ('02bb7449-ed24-4e9a-8eb2-5a758e4cf871', 'admin5@empresa.com.br', 'admin', 'Admin 5', NOW(), NOW())
ON CONFLICT (linked_auth_user_id) DO NOTHING;

-- Criar perfil para 7c197601-01cc-4f71-a4d8-7c1357cac113 (398 leads)
INSERT INTO profiles (linked_auth_user_id, email, role, full_name, created_at, updated_at)
VALUES ('7c197601-01cc-4f71-a4d8-7c1357cac113', 'admin6@empresa.com.br', 'admin', 'Admin 6', NOW(), NOW())
ON CONFLICT (linked_auth_user_id) DO NOTHING;

-- Criar perfil para d973d018-d053-4a39-b023-765332152dac (194 leads)
INSERT INTO profiles (linked_auth_user_id, email, role, full_name, created_at, updated_at)
VALUES ('d973d018-d053-4a39-b023-765332152dac', 'admin7@empresa.com.br', 'admin', 'Admin 7', NOW(), NOW())
ON CONFLICT (linked_auth_user_id) DO NOTHING;
*/

-- 7. Verificar o trigger problemático
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid::regclass::text IN ('leads', 'whatsapp_instances', 'user_whatsapp_access')
ORDER BY table_name, trigger_name;

-- 8. Estatísticas finais após correções
SELECT 
    'Resumo após correções' as info,
    COUNT(*) as total_leads,
    COUNT(DISTINCT created_by_user_id) as total_admins,
    COUNT(DISTINCT owner_id) as total_owners,
    COUNT(CASE WHEN created_by_user_id = owner_id THEN 1 END) as leads_nao_atribuidos,
    COUNT(CASE WHEN created_by_user_id != owner_id THEN 1 END) as leads_atribuidos,
    COUNT(CASE WHEN owner_id IS NULL THEN 1 END) as leads_sem_owner
FROM leads;

-- 9. Validar que cada admin pode ver seus leads
SELECT 
    p.linked_auth_user_id,
    p.email,
    p.role,
    COUNT(l.id) as total_leads_visiveis
FROM profiles p
LEFT JOIN leads l ON l.created_by_user_id = p.linked_auth_user_id
WHERE p.role = 'admin'
GROUP BY p.linked_auth_user_id, p.email, p.role
ORDER BY total_leads_visiveis DESC;