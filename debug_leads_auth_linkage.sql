-- 🔍 DEBUG: Verificar ligação entre auth.users e profiles para o admin

-- 1. Ver profile do admin direto
SELECT 'PROFILE DIRETO:' as info;
SELECT id, email, role, auth_user_id, linked_auth_user_id
FROM profiles 
WHERE id = '7c197601-01cc-4f71-a4d8-7c1357cac113';

-- 2. Verificar se existe ligação correta com auth
SELECT 'AUTH LINKAGE CHECK:' as info;  
SELECT 
  p.id as profile_id,
  p.email,
  p.role,
  p.auth_user_id,
  p.linked_auth_user_id,
  CASE 
    WHEN p.auth_user_id IS NOT NULL THEN 'HAS auth_user_id'
    WHEN p.linked_auth_user_id IS NOT NULL THEN 'HAS linked_auth_user_id'  
    ELSE 'NO AUTH LINK'
  END as auth_status
FROM profiles p
WHERE p.id = '7c197601-01cc-4f71-a4d8-7c1357cac113';

-- 3. Testar query de leads direto (como faria o hook)
SELECT 'LEADS COUNT DIRECT:' as info;
SELECT COUNT(*) as total_leads
FROM leads 
WHERE funnel_id IN (
  SELECT id FROM funnels WHERE created_by_user_id = '7c197601-01cc-4f71-a4d8-7c1357cac113'
);

