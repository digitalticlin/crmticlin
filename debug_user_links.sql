-- =====================================================
-- 🔍 DEBUG DOS VÍNCULOS DO USUÁRIO vendas01@geuniformes.com.br
-- ID Sincronizado: 04e4d0e8-fa37-4733-af40-8d3ea28ca763
-- =====================================================

-- 1. Verificar profile atual
SELECT 
    '1. PROFILE ATUAL' as info,
    id as profile_id,
    email,
    role
FROM profiles 
WHERE id = '04e4d0e8-fa37-4733-af40-8d3ea28ca763';

-- 2. Verificar vínculos WhatsApp com profile_id correto
SELECT 
    '2. USER_WHATSAPP_NUMBERS' as info,
    id as tabela_id,
    profile_id,
    whatsapp_number_id,
    created_at
FROM user_whatsapp_numbers 
WHERE profile_id = '04e4d0e8-fa37-4733-af40-8d3ea28ca763';

-- 3. Verificar se a instância existe e está ativa
SELECT 
    '3. WHATSAPP_INSTANCE' as info,
    id as instance_id,
    instance_name,
    connection_status,
    connection_type,
    created_by_user_id
FROM whatsapp_instances 
WHERE id = 'c1fb1905-7e52-4752-a471-a7818c121801';

-- 4. Verificar vínculos de funil
SELECT 
    '4. USER_FUNNELS' as info,
    id as tabela_id,
    profile_id,
    funnel_id,
    created_at
FROM user_funnels 
WHERE profile_id = '04e4d0e8-fa37-4733-af40-8d3ea28ca763';

-- 5. Verificar se o funil existe
SELECT 
    '5. FUNNEL' as info,
    id as funnel_id,
    name,
    created_by_user_id
FROM funnels 
WHERE id = '28dfc9bb-3c5c-482c-aca6-805a5c2bf280';

-- 6. QUERY EXATA QUE O HOOK DEVE FAZER (simulação)
SELECT 
    '6. SIMULACAO_HOOK_WHATSAPP' as info,
    wi.*
FROM user_whatsapp_numbers uwn
JOIN whatsapp_instances wi ON uwn.whatsapp_number_id = wi.id
WHERE uwn.profile_id = '04e4d0e8-fa37-4733-af40-8d3ea28ca763'
AND wi.connection_type = 'web'
AND wi.connection_status IN ('connected', 'ready', 'connecting', 'disconnected');

-- 7. DEBUG: Verificar se existem vínculos com IDs antigos
SELECT 
    '7. LINKS_ANTIGOS_WHATSAPP' as info,
    COUNT(*) as total
FROM user_whatsapp_numbers 
WHERE profile_id = '4d8c4fdd-5664-475f-a1de-54b6d5b61c5c';

SELECT 
    '8. LINKS_ANTIGOS_FUNNELS' as info,
    COUNT(*) as total
FROM user_funnels 
WHERE profile_id = '4d8c4fdd-5664-475f-a1de-54b6d5b61c5c';