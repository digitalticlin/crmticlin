-- Testar a RPC corrigida com os dados EXATOS dos logs

SELECT save_received_message_webhook(
    '712e7708-2299-4a00-9128-577c8f113ca4'::uuid,  -- p_vps_instance_id (created_by_user_id do RETORNO)
    '5562999999999',                                -- p_phone (telefone de teste)
    'Teste de mensagem do webhook',                 -- p_message_text
    false,                                         -- p_from_me
    'text',                                        -- p_media_type
    NULL,                                          -- p_media_url
    'test_msg_123456',                             -- p_external_message_id
    NULL,                                          -- p_contact_name
    NULL,                                          -- p_profile_pic_url
    NULL,                                          -- p_base64_data
    NULL,                                          -- p_mime_type
    NULL,                                          -- p_file_name
    '66ae98b4-1c72-49e4-a7e9-ab774db101ec'::uuid, -- p_whatsapp_number_id (ID da instância do RETORNO)
    'webhook_whatsapp_web'                         -- p_source_edge
) as test_result;