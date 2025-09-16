-- Testar a RPC corrigida com UUID válido

SELECT save_received_message_webhook(
    '00000000-0000-0000-0000-000000000000'::uuid,   -- p_vps_instance_id (UUID válido mas não usado)
    '5562999888777',                                 -- p_phone (telefone que não existe - novo lead)
    'Teste da RPC corrigida',                       -- p_message_text
    false,                                          -- p_from_me
    'text',                                         -- p_media_type
    NULL,                                           -- p_media_url
    'test_corrected_123',                           -- p_external_message_id
    NULL,                                           -- p_contact_name
    NULL,                                           -- p_profile_pic_url
    NULL,                                           -- p_base64_data
    NULL,                                           -- p_mime_type
    NULL,                                           -- p_file_name
    '66ae98b4-1c72-49e4-a7e9-ab774db101ec'::uuid,  -- p_whatsapp_number_id (UUID da instância)
    'webhook_whatsapp_web'                          -- p_source_edge
) as rpc_result_corrected;