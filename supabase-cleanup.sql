-- 🗄️ LIMPEZA EMERGENCIAL DO BANCO SUPABASE
-- Execute este SQL no painel do Supabase

-- 1. Verificar a instância problemática
SELECT 
  id, 
  instance_name, 
  vps_instance_id,
  connection_status,
  created_at
FROM whatsapp_instances 
WHERE id = 'c3b6cfe7-bc4e-4b1f-9f18-4573f4232785'
   OR instance_name = 'digitalticlin'
   OR vps_instance_id = 'digitalticlin';

-- 2. DELETAR a instância diretamente (SEM TRIGGER)
-- IMPORTANTE: Isso bypassa o trigger que está causando timeout
DELETE FROM whatsapp_instances 
WHERE id = 'c3b6cfe7-bc4e-4b1f-9f18-4573f4232785';

-- 3. Verificar se foi removida
SELECT COUNT(*) as instancias_restantes 
FROM whatsapp_instances 
WHERE instance_name LIKE '%digitalticlin%';