-- =====================================================
-- 🎯 CRIAR MAPEAMENTOS DE FUNIS PARA USUÁRIOS OPERACIONAIS
-- Baseado nos dados reais encontrados no RETORNO
-- =====================================================

-- Atribuir funis aos usuários operacionais existentes
INSERT INTO user_funnels (
    profile_id,
    funnel_id,
    created_by_user_id,
    created_at,
    updated_at
) VALUES 
-- Usuário: Inacio (você) - ID: cee24fa8-8328-4c77-95d4-6e8d4c95482c
-- Funil: Funil Principal mais recente - ID: 70b4e1dc-aa4c-493a-8c68-867d2dbc473c
(
    'cee24fa8-8328-4c77-95d4-6e8d4c95482c',
    '70b4e1dc-aa4c-493a-8c68-867d2dbc473c',
    'cee24fa8-8328-4c77-95d4-6e8d4c95482c',
    now(),
    now()
),

-- Usuário: Jessica - ID: f0c1aee1-a077-4622-9fbf-6f31e3855c69
-- Funil: Funil Principal - ID: 5343e2b1-c87a-49d8-9241-049060385268
(
    'f0c1aee1-a077-4622-9fbf-6f31e3855c69',
    '5343e2b1-c87a-49d8-9241-049060385268',
    'f0c1aee1-a077-4622-9fbf-6f31e3855c69',
    now(),
    now()
),

-- Usuário: Max Taylor - ID: 2503a507-cab2-4568-b60e-461fb15b1421
-- Funil: Funil Principal - ID: f6e6ecea-dd10-4358-a5ee-5ca4bb6c971a
(
    '2503a507-cab2-4568-b60e-461fb15b1421',
    'f6e6ecea-dd10-4358-a5ee-5ca4bb6c971a',
    '2503a507-cab2-4568-b60e-461fb15b1421',
    now(),
    now()
),

-- Usuário: Jaqueline - ID: accf3322-fd5b-4a8b-b345-421a09ab47cf
-- Funil: Funil Principal - ID: 2d6c9b7e-13ab-4b8e-837e-da89d5c00830
(
    'accf3322-fd5b-4a8b-b345-421a09ab47cf',
    '2d6c9b7e-13ab-4b8e-837e-da89d5c00830',
    'accf3322-fd5b-4a8b-b345-421a09ab47cf',
    now(),
    now()
),

-- Usuário: Maryanna - ID: 5fc95e35-ef2b-49f7-9d86-5bbf86d74fee
-- Funil: Funil Principal - ID: 28dfc9bb-3c5c-482c-aca6-805a5c2bf280
(
    '5fc95e35-ef2b-49f7-9d86-5bbf86d74fee',
    '28dfc9bb-3c5c-482c-aca6-805a5c2bf280',
    '5fc95e35-ef2b-49f7-9d86-5bbf86d74fee',
    now(),
    now()
);

-- Criar alguns leads de teste para você (Inacio)
INSERT INTO leads (
    name,
    phone,
    funnel_id,
    owner_id,
    created_by_user_id,
    created_at,
    updated_at
) VALUES 
(
    'Lead Teste Inacio 1',
    '+55 (62) 98888-1001',
    '70b4e1dc-aa4c-493a-8c68-867d2dbc473c',
    'cee24fa8-8328-4c77-95d4-6e8d4c95482c',
    'cee24fa8-8328-4c77-95d4-6e8d4c95482c',
    now(),
    now()
),
(
    'Lead Teste Inacio 2',
    '+55 (62) 98888-1002',
    '70b4e1dc-aa4c-493a-8c68-867d2dbc473c',
    'cee24fa8-8328-4c77-95d4-6e8d4c95482c',
    'cee24fa8-8328-4c77-95d4-6e8d4c95482c',
    now(),
    now()
);

-- Verificar se foi criado corretamente
SELECT 
    'NOVOS MAPEAMENTOS USER_FUNNELS' as info,
    uf.*,
    p.full_name as user_name,
    f.name as funnel_name
FROM user_funnels uf
LEFT JOIN profiles p ON uf.profile_id = p.id
LEFT JOIN funnels f ON uf.funnel_id = f.id
WHERE uf.profile_id IN (
    'cee24fa8-8328-4c77-95d4-6e8d4c95482c',
    'f0c1aee1-a077-4622-9fbf-6f31e3855c69',
    '2503a507-cab2-4568-b60e-461fb15b1421',
    'accf3322-fd5b-4a8b-b345-421a09ab47cf',
    '5fc95e35-ef2b-49f7-9d86-5bbf86d74fee'
);