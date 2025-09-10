-- =====================================================
-- 🔍 VERIFICAR VÍNCULOS PARA vendas01@geuniformes.com.br
-- ID Sincronizado: 04e4d0e8-fa37-4733-af40-8d3ea28ca763
-- =====================================================

-- 1. Verificar profile atual
SELECT 
    'PROFILE ATUAL' as info,
    id as profile_id,
    full_name,
    email,
    role,
    invite_status,
    created_by_user_id,
    created_at
FROM profiles 
WHERE email = 'vendas01@geuniformes.com.br'
ORDER BY created_at DESC;

-- 2. Verificar vínculos de funil
SELECT 
    'USER_FUNNELS' as info,
    uf.*,
    f.name as funnel_name
FROM user_funnels uf
LEFT JOIN funnels f ON uf.funnel_id = f.id
WHERE uf.profile_id = '04e4d0e8-fa37-4733-af40-8d3ea28ca763';

-- 3. Verificar vínculos de WhatsApp  
SELECT 
    'USER_WHATSAPP' as info,
    uwn.*,
    wi.instance_name
FROM user_whatsapp_numbers uwn
LEFT JOIN whatsapp_instances wi ON uwn.whatsapp_number_id = wi.id
WHERE uwn.profile_id = '04e4d0e8-fa37-4733-af40-8d3ea28ca763';

-- 4. Verificar instâncias disponíveis
SELECT 
    'INSTANCIAS_DISPONIVEIS' as info,
    id,
    instance_name,
    status
FROM whatsapp_instances
WHERE created_by_user_id = '7c197601-01cc-4f71-a4d8-7c1357cac113'
ORDER BY created_at;

-- 5. Verificar leads atribuídos
SELECT 
    'LEADS_ATRIBUIDOS' as info,
    COUNT(*) as total_leads
FROM leads 
WHERE owner_id = '04e4d0e8-fa37-4733-af40-8d3ea28ca763';