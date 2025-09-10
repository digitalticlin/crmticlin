-- 🔍 DEBUG: Investigar por que owner_id não foi sincronizado

-- 1. Verificar se owner_id foi criado corretamente
SELECT 
    'OWNER_ID STATUS' as check_type,
    COUNT(*) as total_leads,
    COUNT(owner_id) as leads_with_owner,
    COUNT(created_by_user_id) as leads_with_creator,
    ROUND(COUNT(owner_id) * 100.0 / COUNT(*), 2) as percentage_with_owner
FROM leads;

-- 2. Verificar profiles ativos
SELECT 
    'PROFILES STATUS' as check_type,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN linked_auth_user_id IS NOT NULL THEN 1 END) as profiles_with_auth_link,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_profiles,
    COUNT(CASE WHEN role = 'operational' THEN 1 END) as operational_profiles
FROM profiles;

-- 3. Verificar atribuições ativas
SELECT 
    'ASSIGNMENTS STATUS' as check_type,
    'FUNNELS' as type,
    COUNT(*) as total_assignments
FROM user_funnels
UNION ALL
SELECT 
    'ASSIGNMENTS STATUS' as check_type,
    'WHATSAPP' as type,
    COUNT(*) as total_assignments
FROM user_whatsapp_numbers;

-- 4. Verificar alguns leads específicos (amostra)
SELECT 
    'LEAD SAMPLE' as check_type,
    l.id,
    l.name,
    l.funnel_id,
    l.whatsapp_number_id,
    l.created_by_user_id,
    l.owner_id,
    f.name as funnel_name,
    wi.instance_name
FROM leads l
LEFT JOIN funnels f ON l.funnel_id = f.id
LEFT JOIN whatsapp_instances wi ON l.whatsapp_number_id = wi.id
LIMIT 5;

-- 5. Verificar se funções existem
SELECT 
    'FUNCTIONS STATUS' as check_type,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'sync_lead_ownership'
AND routine_schema = 'public';

-- 6. Tentar executar sincronização novamente
SELECT 'MANUAL SYNC TEST' as check_type, * FROM sync_lead_ownership();

-- 7. Verificar perfis com linked_auth_user_id
SELECT 
    'LINKED PROFILES' as check_type,
    p.id,
    p.full_name,
    p.role,
    p.linked_auth_user_id,
    p.invite_status
FROM profiles p
WHERE p.linked_auth_user_id IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 10;