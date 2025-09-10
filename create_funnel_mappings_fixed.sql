-- =====================================================
-- 🎯 CRIAR MAPEAMENTOS DE FUNIS - VERSÃO CORRIGIDA
-- Execute um comando por vez no Supabase
-- =====================================================

-- COMANDO 1: Inserir mapeamento para Inacio
INSERT INTO user_funnels (profile_id, funnel_id, created_by_user_id, created_at) 
VALUES ('cee24fa8-8328-4c77-95d4-6e8d4c95482c', '70b4e1dc-aa4c-493a-8c68-867d2dbc473c', 'cee24fa8-8328-4c77-95d4-6e8d4c95482c', now());

-- COMANDO 2: Inserir mapeamento para Jessica
INSERT INTO user_funnels (profile_id, funnel_id, created_by_user_id, created_at) 
VALUES ('f0c1aee1-a077-4622-9fbf-6f31e3855c69', '5343e2b1-c87a-49d8-9241-049060385268', 'f0c1aee1-a077-4622-9fbf-6f31e3855c69', now());

-- COMANDO 3: Inserir mapeamento para Max Taylor
INSERT INTO user_funnels (profile_id, funnel_id, created_by_user_id, created_at) 
VALUES ('2503a507-cab2-4568-b60e-461fb15b1421', 'f6e6ecea-dd10-4358-a5ee-5ca4bb6c971a', '2503a507-cab2-4568-b60e-461fb15b1421', now());

-- COMANDO 4: Inserir mapeamento para Jaqueline
INSERT INTO user_funnels (profile_id, funnel_id, created_by_user_id, created_at) 
VALUES ('accf3322-fd5b-4a8b-b345-421a09ab47cf', '2d6c9b7e-13ab-4b8e-837e-da89d5c00830', 'accf3322-fd5b-4a8b-b345-421a09ab47cf', now());

-- COMANDO 5: Inserir mapeamento para Maryanna
INSERT INTO user_funnels (profile_id, funnel_id, created_by_user_id, created_at) 
VALUES ('5fc95e35-ef2b-49f7-9d86-5bbf86d74fee', '28dfc9bb-3c5c-482c-aca6-805a5c2bf280', '5fc95e35-ef2b-49f7-9d86-5bbf86d74fee', now());

-- COMANDO 6: Criar lead teste 1 para Inacio
INSERT INTO leads (name, phone, funnel_id, owner_id, created_by_user_id, created_at) 
VALUES ('Lead Teste Inacio 1', '+55 (62) 98888-1001', '70b4e1dc-aa4c-493a-8c68-867d2dbc473c', 'cee24fa8-8328-4c77-95d4-6e8d4c95482c', 'cee24fa8-8328-4c77-95d4-6e8d4c95482c', now());

-- COMANDO 7: Criar lead teste 2 para Inacio
INSERT INTO leads (name, phone, funnel_id, owner_id, created_by_user_id, created_at) 
VALUES ('Lead Teste Inacio 2', '+55 (62) 98888-1002', '70b4e1dc-aa4c-493a-8c68-867d2dbc473c', 'cee24fa8-8328-4c77-95d4-6e8d4c95482c', 'cee24fa8-8328-4c77-95d4-6e8d4c95482c', now());

-- COMANDO 8: Verificar se foi criado corretamente
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