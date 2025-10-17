-- Verificar instância
SELECT id, vps_instance_id, instance_name, connection_status 
FROM whatsapp_instances 
WHERE id = '66ae98b4-1c72-49e4-a7e9-ab774db101ec';

-- Verificar lead
SELECT id, phone, name 
FROM leads 
WHERE id = 'cbed9f4b-2033-430c-8772-104bfcae4efd';
