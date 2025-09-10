-- =====================================================
-- 🔍 VERIFICAR E CONFIGURAR MAPEAMENTOS USER_FUNNELS E USER_WHATSAPP_NUMBERS
-- =====================================================

-- 1. VERIFICAR ESTRUTURA DAS TABELAS
SELECT 
    'ESTRUTURA user_funnels' as info,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_funnels' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'ESTRUTURA user_whatsapp_numbers' as info,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_whatsapp_numbers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VERIFICAR DADOS EXISTENTES EM user_funnels
SELECT 
    'user_funnels - DADOS ATUAIS' as info,
    uf.*,
    p.full_name as user_name,
    p.role as user_role,
    f.name as funnel_name
FROM user_funnels uf
LEFT JOIN profiles p ON uf.profile_id = p.id
LEFT JOIN funnels f ON uf.funnel_id = f.id
ORDER BY uf.created_at DESC;

-- 3. VERIFICAR DADOS EXISTENTES EM user_whatsapp_numbers
SELECT 
    'user_whatsapp_numbers - DADOS ATUAIS' as info,
    uwn.*,
    p.full_name as user_name,
    p.role as user_role,
    wi.instance_name
FROM user_whatsapp_numbers uwn
LEFT JOIN profiles p ON uwn.profile_id = p.id
LEFT JOIN whatsapp_instances wi ON uwn.whatsapp_number_id = wi.id
ORDER BY uwn.created_at DESC;

-- 4. LISTAR USUÁRIOS OPERACIONAIS SEM FUNIS ATRIBUÍDOS
SELECT 
    'OPERACIONAIS SEM FUNIS' as info,
    p.id,
    p.full_name,
    p.email,
    p.role,
    COUNT(uf.id) as total_funnels_assigned
FROM profiles p
LEFT JOIN user_funnels uf ON uf.profile_id = p.id
WHERE p.role = 'operational'
GROUP BY p.id, p.full_name, p.email, p.role
HAVING COUNT(uf.id) = 0;

-- 5. LISTAR FUNIS DISPONÍVEIS PARA ATRIBUIÇÃO
SELECT 
    'FUNIS DISPONÍVEIS' as info,
    f.id,
    f.name,
    f.created_by_user_id,
    p.full_name as created_by_name,
    COUNT(DISTINCT uf.profile_id) as users_assigned
FROM funnels f
LEFT JOIN profiles p ON f.created_by_user_id = p.id
LEFT JOIN user_funnels uf ON uf.funnel_id = f.id
GROUP BY f.id, f.name, f.created_by_user_id, p.full_name
ORDER BY f.created_at DESC;

-- 6. LISTAR INSTÂNCIAS WHATSAPP DISPONÍVEIS
SELECT 
    'INSTÂNCIAS WHATSAPP DISPONÍVEIS' as info,
    wi.id,
    wi.instance_name,
    wi.phone,
    wi.created_by_user_id,
    p.full_name as created_by_name,
    COUNT(DISTINCT uwn.profile_id) as users_assigned
FROM whatsapp_instances wi
LEFT JOIN profiles p ON wi.created_by_user_id = p.id
LEFT JOIN user_whatsapp_numbers uwn ON uwn.whatsapp_number_id = wi.id
GROUP BY wi.id, wi.instance_name, wi.phone, wi.created_by_user_id, p.full_name
ORDER BY wi.created_at DESC;

-- =====================================================
-- 🔧 EXEMPLO DE INSERÇÃO PARA ATRIBUIR FUNIL A USUÁRIO OPERACIONAL
-- =====================================================
-- DESCOMENTE E AJUSTE OS IDs CONFORME NECESSÁRIO:

/*
-- Atribuir funil a usuário operacional
INSERT INTO user_funnels (
    profile_id,
    funnel_id,
    can_view,
    can_edit,
    created_at,
    updated_at
) VALUES (
    'ID_DO_USUARIO_OPERACIONAL',  -- Substitua pelo ID do usuário operacional
    'ID_DO_FUNIL',                 -- Substitua pelo ID do funil
    true,                          -- Pode visualizar
    false,                         -- Não pode editar (operacional)
    now(),
    now()
);

-- Atribuir instância WhatsApp a usuário operacional
INSERT INTO user_whatsapp_numbers (
    profile_id,
    whatsapp_number_id,
    can_view,
    can_manage,
    created_at,
    updated_at
) VALUES (
    'ID_DO_USUARIO_OPERACIONAL',  -- Substitua pelo ID do usuário operacional
    'ID_DA_INSTANCIA_WHATSAPP',   -- Substitua pelo ID da instância
    true,                          -- Pode visualizar
    false,                         -- Não pode gerenciar (operacional)
    now(),
    now()
);
*/

-- 7. VERIFICAR LEADS E SEUS OWNERS
SELECT 
    'LEADS COM OWNER_ID' as info,
    l.id,
    l.name as lead_name,
    l.phone,
    l.owner_id,
    p.full_name as owner_name,
    p.role as owner_role,
    f.name as funnel_name
FROM leads l
LEFT JOIN profiles p ON l.owner_id = p.id
LEFT JOIN funnels f ON l.funnel_id = f.id
WHERE l.owner_id IS NOT NULL
ORDER BY l.created_at DESC
LIMIT 20;