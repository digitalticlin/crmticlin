-- =====================================================
-- 🔧 CORRIGIR VÍNCULOS WHATSAPP PARA vendas01@geuniformes.com.br  
-- ID Sincronizado: 04e4d0e8-fa37-4733-af40-8d3ea28ca763
-- =====================================================

-- 1. Primeiro, verificar se já existem vínculos antigos (ID antigo)
DELETE FROM user_whatsapp_numbers 
WHERE profile_id = '4d8c4fdd-5664-475f-a1de-54b6d5b61c5c'; -- ID antigo se ainda existir

-- 2. Criar vínculo de WhatsApp com ID sincronizado
INSERT INTO user_whatsapp_numbers (
    profile_id,
    whatsapp_number_id,
    created_by_user_id,
    created_at
) VALUES (
    '04e4d0e8-fa37-4733-af40-8d3ea28ca763',  -- ID sincronizado
    'c1fb1905-7e52-4752-a471-a7818c121801',  -- admgeuniformesgmailcom (mesmo usado antes)
    '7c197601-01cc-4f71-a4d8-7c1357cac113',  -- Admin que criou
    now()
)
ON CONFLICT (profile_id, whatsapp_number_id) DO NOTHING;

-- 3. Verificar funil (deve estar correto baseado nos logs)
INSERT INTO user_funnels (
    profile_id,
    funnel_id,
    created_by_user_id,
    created_at
) VALUES (
    '04e4d0e8-fa37-4733-af40-8d3ea28ca763',  -- ID sincronizado  
    '28dfc9bb-3c5c-482c-aca6-805a5c2bf280',  -- Funil Principal
    '7c197601-01cc-4f71-a4d8-7c1357cac113',  -- Admin que criou
    now()
)
ON CONFLICT (profile_id, funnel_id) DO NOTHING;

-- 4. Atualizar ownership dos leads existentes se necessário
UPDATE leads 
SET owner_id = '04e4d0e8-fa37-4733-af40-8d3ea28ca763'  -- ID sincronizado
WHERE owner_id = '4d8c4fdd-5664-475f-a1de-54b6d5b61c5c'  -- ID antigo
AND created_by_user_id = '7c197601-01cc-4f71-a4d8-7c1357cac113';

-- 5. Verificação final
SELECT 'RESULTADO FINAL' as status;

SELECT 
    'USER_WHATSAPP_FINAL' as info,
    uwn.profile_id,
    uwn.whatsapp_number_id,
    wi.instance_name,
    wi.status
FROM user_whatsapp_numbers uwn
LEFT JOIN whatsapp_instances wi ON uwn.whatsapp_number_id = wi.id
WHERE uwn.profile_id = '04e4d0e8-fa37-4733-af40-8d3ea28ca763';

SELECT 
    'USER_FUNNELS_FINAL' as info,
    uf.profile_id,
    uf.funnel_id,
    f.name as funnel_name
FROM user_funnels uf
LEFT JOIN funnels f ON uf.funnel_id = f.id
WHERE uf.profile_id = '04e4d0e8-fa37-4733-af40-8d3ea28ca763';