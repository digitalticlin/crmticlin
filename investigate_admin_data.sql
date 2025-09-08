-- Verificar se o usuário admin atual tem funis criados
SELECT 
  p.id as profile_id,
  p.full_name,
  p.role,
  p.email,
  COUNT(f.id) as funis_count
FROM profiles p
LEFT JOIN funnels f ON f.created_by_user_id = p.id  
WHERE p.email = 'adm.geuniformes@gmail.com'
GROUP BY p.id, p.full_name, p.role, p.email;

-- Verificar se existem leads para este admin  
SELECT COUNT(*) as leads_count 
FROM leads 
WHERE created_by_user_id = '7c197601-01cc-4f71-a4d8-7c1357cac113';

-- Verificar estrutura completa do usuário admin
SELECT 
  auth_user_id,
  id,
  email,
  full_name, 
  role,
  created_by_user_id,
  created_at
FROM profiles 
WHERE email = 'adm.geuniformes@gmail.com';
