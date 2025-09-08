-- =====================================================
-- IDENTIFICAR E CORRIGIR LEADS DO ADMIN CORRETO
-- =====================================================

-- 1. Identificar o admin digitalticlin@gmail.com
SELECT 
    linked_auth_user_id,
    email,
    role,
    created_by_user_id
FROM profiles
WHERE email = 'digitalticlin@gmail.com';

-- 2. Verificar quantos leads pertencem a este admin
-- O ID 9936ae64-b78c-48fe-97e8-bf67623349c6 parece ser o digitalticlin
SELECT 
    COUNT(*) as total_leads_digitalticlin
FROM leads
WHERE created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6';

-- 3. Verificar se o perfil do digitalticlin existe
SELECT 
    'Perfil digitalticlin existe?' as verificacao,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM profiles 
            WHERE linked_auth_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'
        ) THEN 'SIM'
        ELSE 'NÃO - PRECISA SER CRIADO'
    END as resultado;

-- 4. Se o perfil NÃO existe, criar o perfil do admin
-- DESCOMENTE para executar se necessário
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
    'digitalticlin@gmail.com',
    'admin',
    'Digital Ticlin',
    NOW(),
    NOW()
)
ON CONFLICT (linked_auth_user_id) DO UPDATE
SET 
    email = EXCLUDED.email,
    role = 'admin',
    updated_at = NOW();
*/

-- 5. Verificar outros IDs com muitos leads que também não têm perfil
SELECT 
    l.created_by_user_id,
    COUNT(*) as total_leads,
    p.email,
    p.role,
    CASE 
        WHEN p.linked_auth_user_id IS NULL THEN 'PERFIL NÃO EXISTE'
        ELSE 'PERFIL EXISTE'
    END as status_perfil
FROM leads l
LEFT JOIN profiles p ON p.linked_auth_user_id = l.created_by_user_id
GROUP BY l.created_by_user_id, p.email, p.role, p.linked_auth_user_id
HAVING COUNT(*) > 100
ORDER BY total_leads DESC;

-- 6. Verificar se inacio@ticlin.com.br precisa assumir alguns leads
SELECT 
    'Admin inacio' as usuario,
    linked_auth_user_id,
    email,
    role
FROM profiles
WHERE email = 'inacio@ticlin.com.br';

-- 7. OPCIONAL: Transferir leads do digitalticlin para inacio
-- DESCOMENTE apenas se quiser transferir TODOS os leads
/*
UPDATE leads 
SET created_by_user_id = (
    SELECT linked_auth_user_id 
    FROM profiles 
    WHERE email = 'inacio@ticlin.com.br'
    LIMIT 1
)
WHERE created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6';
*/

-- 8. Estatísticas finais para validação
SELECT 
    'Resumo dos Leads' as info,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6' THEN 1 END) as leads_digitalticlin,
    COUNT(CASE WHEN created_by_user_id = (SELECT linked_auth_user_id FROM profiles WHERE email = 'inacio@ticlin.com.br') THEN 1 END) as leads_inacio,
    COUNT(CASE WHEN owner_id IS NULL THEN 1 END) as leads_sem_owner
FROM leads;