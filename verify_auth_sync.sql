-- =====================================================
-- 🔍 VERIFICAR SINCRONIZAÇÃO AUTH.USERS E PROFILES
-- =====================================================

-- 1. Verificar profile do usuário vendas01@geuniformes.com.br
SELECT 
    'PROFILE CRIADO' as info,
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

-- 2. Verificar se existe user no auth.users com email vendas01@geuniformes.com.br
-- (Esta query só funciona com service role - execute no painel admin do Supabase)
SELECT 
    'AUTH USER' as info,
    id as auth_user_id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'vendas01@geuniformes.com.br'
ORDER BY created_at DESC;

-- 3. Verificar vínculos para o profile_id específico
SELECT 
    'USER_FUNNELS PARA PROFILE' as info,
    uf.*,
    f.name as funnel_name
FROM user_funnels uf
LEFT JOIN funnels f ON uf.funnel_id = f.id
WHERE uf.profile_id = '4d8c4fdd-5664-475f-a1de-54b6d5b61c5c';

SELECT 
    'USER_WHATSAPP PARA PROFILE' as info,
    uwn.*,
    wi.instance_name
FROM user_whatsapp_numbers uwn
LEFT JOIN whatsapp_instances wi ON uwn.whatsapp_number_id = wi.id
WHERE uwn.profile_id = '4d8c4fdd-5664-475f-a1de-54b6d5b61c5c';

-- 4. Verificar se o usuário completou o registro (aceito o convite)
SELECT 
    'STATUS DO CONVITE' as info,
    id,
    email,
    invite_status,
    invite_token IS NOT NULL as tem_token_pendente,
    created_at
FROM profiles 
WHERE id = '4d8c4fdd-5664-475f-a1de-54b6d5b61c5c';