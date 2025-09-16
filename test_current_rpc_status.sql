-- Testar o estado atual da RPC no banco

-- 1. Verificar se a RPC foi atualizada (deve mencionar "funnels" não "sales_funnels")
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'save_received_message_webhook';

-- 2. Testar a RPC com dados exatos dos logs
SELECT save_received_message_webhook(
    '712e7708-2299-4a00-9128-577c8f113ca4'::uuid,  -- p_vps_instance_id
    '5562999999999',                                -- p_phone
    'Teste de mensagem',                           -- p_message_text
    false,                                         -- p_from_me
    'text',                                        -- p_media_type
    NULL,                                          -- p_media_url
    'test_123',                                    -- p_external_message_id
    NULL,                                          -- p_contact_name
    NULL,                                          -- p_profile_pic_url
    NULL,                                          -- p_base64_data
    NULL,                                          -- p_mime_type
    NULL,                                          -- p_file_name
    '66ae98b4-1c72-49e4-a7e9-ab774db101ec'::uuid, -- p_whatsapp_number_id
    'webhook_whatsapp_web'                         -- p_source_edge
) as current_rpc_result;

-- 3. Verificar se as tabelas funnels e funnel_stages existem
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('funnels', 'funnel_stages', 'sales_funnels');