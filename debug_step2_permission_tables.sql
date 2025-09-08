-- PASSO 2: MAPEAR TABELAS DE CONTROLE DE PERMISSÕES
-- Execute este SQL para entender a estrutura atual

-- ========================================
-- 1. ESTRUTURA DA TABELA USER_FUNNELS
-- ========================================
SELECT 
    '=== ESTRUTURA USER_FUNNELS ===' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_funnels' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ========================================
-- 2. DADOS DA TABELA USER_FUNNELS
-- ========================================
SELECT 
    '=== DADOS USER_FUNNELS ===' as info,
    uf.*,
    p.full_name as usuario_nome,
    p.role as usuario_role
FROM user_funnels uf
LEFT JOIN profiles p ON p.id = uf.user_id::text
ORDER BY uf.created_at DESC
LIMIT 20;

-- ========================================
-- 3. ESTRUTURA DA TABELA USER_WHATSAPP_NUMBERS  
-- ========================================
SELECT 
    '=== ESTRUTURA USER_WHATSAPP_NUMBERS ===' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_whatsapp_numbers'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ========================================
-- 4. DADOS DA TABELA USER_WHATSAPP_NUMBERS
-- ========================================
SELECT 
    '=== DADOS USER_WHATSAPP_NUMBERS ===' as info,
    uwn.*,
    p.full_name as usuario_nome,
    p.role as usuario_role
FROM user_whatsapp_numbers uwn
LEFT JOIN profiles p ON p.id = uwn.user_id::text
ORDER BY uwn.created_at DESC
LIMIT 20;

-- ========================================
-- 5. VERIFICAR USUÁRIO OPERACIONAL ESPECÍFICO
-- ========================================
SELECT 
    '=== PERMISSÕES DO USUÁRIO OPERACIONAL ===' as info,
    'a5aedd43-c4bd-481e-a061-d96d17127b26' as user_id,
    
    -- Funis atribuídos
    (SELECT COUNT(*) FROM user_funnels WHERE user_id = 'a5aedd43-c4bd-481e-a061-d96d17127b26') as funis_atribuidos,
    
    -- WhatsApp atribuídos  
    (SELECT COUNT(*) FROM user_whatsapp_numbers WHERE user_id = 'a5aedd43-c4bd-481e-a061-d96d17127b26') as whatsapp_atribuidos,
    
    -- Dados do perfil
    p.full_name,
    p.role,
    p.created_by_user_id
FROM profiles p
WHERE p.id = 'a5aedd43-c4bd-481e-a061-d96d17127b26';

-- ========================================
-- 6. VERIFICAR ESTRUTURA DA TABELA LEADS
-- ========================================
SELECT 
    '=== COLUNAS LEADS IMPORTANTES ===' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'leads' 
  AND table_schema = 'public'
  AND column_name IN ('id', 'funnel_id', 'created_by', 'company_id')
ORDER BY ordinal_position;