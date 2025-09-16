-- Teste cirúrgico para identificar erro exato na RPC

-- 1. Verificar se a função existe e com quais parâmetros
SELECT
    proname,
    oidvectortypes(proargtypes) as parameter_types,
    prosrc LIKE '%instance_name%' as uses_instance_name
FROM pg_proc
WHERE proname = 'save_received_message_webhook';

-- 2. Testar RPC com dados EXATOS dos logs mais recentes
-- Usando instanceId: "digitalticlingmailcom" dos logs
SELECT save_received_message_webhook(
    'digitalticlingmailcom',                        -- p_vps_instance_id (nome da instância)
    '5562999777888',                                -- p_phone (telefone inexistente - criar novo)
    'Teste cirúrgico da mensagem',                  -- p_message_text
    false,                                         -- p_from_me
    'text',                                        -- p_media_type
    NULL,                                          -- p_media_url
    'test_surgical_' || extract(epoch from now())::text, -- p_external_message_id
    NULL,                                          -- p_contact_name
    NULL,                                          -- p_profile_pic_url
    NULL,                                          -- p_base64_data
    NULL,                                          -- p_mime_type
    NULL,                                          -- p_file_name
    NULL,                                          -- p_whatsapp_number_id
    'webhook_whatsapp_web'                         -- p_source_edge
) as teste_resultado;