-- PASSO 2B: CORRIGIDO - MAPEAR PERMISSÕES COM COLUNAS CORRETAS

-- ========================================
-- 1. DADOS DA TABELA USER_FUNNELS (CORRIGIDO)
-- ========================================
SELECT 
    '=== DADOS USER_FUNNELS ===' as info,
    uf.*,
    p.full_name as usuario_nome,
    p.role as usuario_role
FROM user_funnels uf
LEFT JOIN profiles p ON p.id::text = uf.profile_id::text
ORDER BY uf.created_at DESC
LIMIT 10;

-- ========================================
-- 2. DADOS DA TABELA USER_WHATSAPP_NUMBERS (CORRIGIDO)
-- ========================================
SELECT 
    '=== DADOS USER_WHATSAPP_NUMBERS ===' as info,
    uwn.*,
    p.full_name as usuario_nome,
    p.role as usuario_role
FROM user_whatsapp_numbers uwn
LEFT JOIN profiles p ON p.id::text = uwn.profile_id::text
ORDER BY uwn.created_at DESC
LIMIT 10;

-- ========================================
-- 3. PERMISSÕES DO USUÁRIO OPERACIONAL (CORRIGIDO)
-- ========================================
SELECT 
    '=== PERMISSÕES DO USUÁRIO OPERACIONAL ===' as info,
    'a5aedd43-c4bd-481e-a061-d96d17127b26'::uuid as user_id,
    
    -- Funis atribuídos
    (SELECT COUNT(*) FROM user_funnels WHERE profile_id = 'a5aedd43-c4bd-481e-a061-d96d17127b26'::uuid) as funis_atribuidos,
    
    -- WhatsApp atribuídos  
    (SELECT COUNT(*) FROM user_whatsapp_numbers WHERE profile_id = 'a5aedd43-c4bd-481e-a061-d96d17127b26'::uuid) as whatsapp_atribuidos,
    
    -- Dados do perfil
    p.full_name,
    p.role,
    p.created_by_user_id,
    p.linked_auth_user_id
FROM profiles p
WHERE p.id = 'a5aedd43-c4bd-481e-a061-d96d17127b26'::uuid;

-- ========================================
-- 4. FUNIS ESPECÍFICOS ATRIBUÍDOS AO USUÁRIO
-- ========================================
SELECT 
    '=== FUNIS ATRIBUÍDOS ===' as info,
    uf.funnel_id,
    f.name as funnel_name,
    uf.created_at as atribuido_em
FROM user_funnels uf
LEFT JOIN funnels f ON f.id = uf.funnel_id
WHERE uf.profile_id = 'a5aedd43-c4bd-481e-a061-d96d17127b26'::uuid
ORDER BY uf.created_at DESC;

-- ========================================
-- 5. INSTÂNCIAS WHATSAPP ATRIBUÍDAS
-- ========================================
SELECT 
    '=== WHATSAPP ATRIBUÍDOS ===' as info,
    uwn.whatsapp_number_id,
    wn.name as whatsapp_name,
    uwn.created_at as atribuido_em
FROM user_whatsapp_numbers uwn
LEFT JOIN whatsapp_numbers wn ON wn.id = uwn.whatsapp_number_id
WHERE uwn.profile_id = 'a5aedd43-c4bd-481e-a061-d96d17127b26'::uuid
ORDER BY uwn.created_at DESC;

-- ========================================
-- 6. LEADS QUE O USUÁRIO DEVERIA VER
-- ========================================
SELECT 
    '=== LEADS ACESSÍVEIS ===' as info,
    COUNT(*) as total_leads_acessiveis
FROM leads l
WHERE l.funnel_id IN (
    SELECT uf.funnel_id 
    FROM user_funnels uf 
    WHERE uf.profile_id = 'a5aedd43-c4bd-481e-a061-d96d17127b26'::uuid
);