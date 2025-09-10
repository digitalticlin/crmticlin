-- =====================================================
-- 🔧 CRIAR VÍNCULOS PARA vendas01@geuniformes.com.br
-- Profile ID: 4d8c4fdd-5664-475f-a1de-54b6d5b61c5c
-- =====================================================

-- 1. Criar vínculo de funil
INSERT INTO user_funnels (
    profile_id,
    funnel_id,
    created_by_user_id,
    created_at
) VALUES (
    '4d8c4fdd-5664-475f-a1de-54b6d5b61c5c',
    '28dfc9bb-3c5c-482c-aca6-805a5c2bf280',  -- Funil Principal usado pelos outros
    '7c197601-01cc-4f71-a4d8-7c1357cac113',  -- Admin que criou
    now()
);

-- 2. Criar vínculo de WhatsApp
INSERT INTO user_whatsapp_numbers (
    profile_id,
    whatsapp_number_id,
    created_by_user_id,
    created_at
) VALUES (
    '4d8c4fdd-5664-475f-a1de-54b6d5b61c5c',
    'c5114c9c-34a2-4ad1-975c-b9e7794e8a7d',  -- admgeuniformesgmailcom2
    '7c197601-01cc-4f71-a4d8-7c1357cac113',  -- Admin que criou
    now()
);

-- 3. Criar leads de teste para vendas01
INSERT INTO leads (
    name,
    phone,
    funnel_id,
    owner_id,
    created_by_user_id,
    created_at
) VALUES 
(
    'Lead Teste Vendas01 1',
    '+55 (11) 97777-0001',
    '28dfc9bb-3c5c-482c-aca6-805a5c2bf280',
    '4d8c4fdd-5664-475f-a1de-54b6d5b61c5c',
    '7c197601-01cc-4f71-a4d8-7c1357cac113',
    now()
),
(
    'Lead Teste Vendas01 2', 
    '+55 (11) 97777-0002',
    '28dfc9bb-3c5c-482c-aca6-805a5c2bf280',
    '4d8c4fdd-5664-475f-a1de-54b6d5b61c5c',
    '7c197601-01cc-4f71-a4d8-7c1357cac113',
    now()
);

-- 4. Verificar se foi criado
SELECT 'VÍNCULOS CRIADOS PARA VENDAS01' as resultado;