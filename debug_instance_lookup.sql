-- Debug: Verificar se a instância 'digitalticlingmailcom' existe

-- 1. Buscar a instância exata dos logs
SELECT id, created_by_user_id, instance_name, connection_status
FROM whatsapp_instances
WHERE instance_name = 'digitalticlingmailcom';

-- 2. Listar todas as instâncias para comparar
SELECT id, created_by_user_id, instance_name, connection_status
FROM whatsapp_instances
ORDER BY created_at DESC;

-- 3. Testar a RPC com os dados CORRETOS da instância encontrada
-- (Substitua os UUIDs pelos valores encontrados acima)
SELECT save_received_message_webhook(
    '712e7708-2299-4a00-9128-577c8f113ca4'::uuid,  -- p_vps_instance_id (created_by_user_id)
    '5562999999999',                                -- p_phone
    'Teste de mensagem',                           -- p_message_text
    false,                                         -- p_from_me
    'text',                                        -- p_media_type
    NULL,                                          -- p_media_url
    NULL,                                          -- p_external_message_id
    NULL,                                          -- p_contact_name
    NULL,                                          -- p_profile_pic_url
    NULL,                                          -- p_base64_data
    NULL,                                          -- p_mime_type
    NULL,                                          -- p_file_name
    'COLE_O_ID_DA_INSTANCIA_AQUI'::uuid,          -- p_whatsapp_number_id (id da instância)
    'webhook_whatsapp_web'                         -- p_source_edge
) as rpc_result;