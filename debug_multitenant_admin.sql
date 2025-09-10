-- 🔍 INVESTIGAÇÃO MULTITENANT - Debug específico do admin atual

-- 1. Verificar perfil do admin logado
SELECT 'PERFIL ADMIN:' as info;
SELECT id, email, full_name, role, created_by_user_id 
FROM profiles 
WHERE id = '7c197601-01cc-4f71-a4d8-7c1357cac113';

-- 2. Verificar funis criados POR este admin (multitenant correto)
SELECT 'FUNIS CRIADOS PELO ADMIN:' as info;
SELECT id, name, created_by_user_id, created_at 
FROM funnels 
WHERE created_by_user_id = '7c197601-01cc-4f71-a4d8-7c1357cac113';

-- 3. Verificar leads criados POR este admin  
SELECT 'LEADS CRIADOS PELO ADMIN:' as info;
SELECT COUNT(*) as total_leads
FROM leads 
WHERE created_by_user_id = '7c197601-01cc-4f71-a4d8-7c1357cac113';

-- 4. Verificar se existem funis no sistema (qualquer usuário) - só para debug
SELECT 'TOTAL FUNIS SISTEMA (DEBUG):' as info;
SELECT COUNT(*) as total_funis_sistema FROM funnels;

-- 5. Verificar instâncias WhatsApp do admin
SELECT 'WHATSAPP INSTANCES ADMIN:' as info;
SELECT COUNT(*) as total_instances
FROM whatsapp_instances
WHERE created_by_user_id = '7c197601-01cc-4f71-a4d8-7c1357cac113';

