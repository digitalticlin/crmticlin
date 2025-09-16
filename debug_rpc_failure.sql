-- Debug: Investigar falha na RPC save_received_message_webhook

-- 1. Verificar se a RPC existe
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'save_received_message_webhook';

-- 2. Verificar estrutura da tabela leads
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela messages
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- 4. Testar a RPC manualmente com dados simples
SELECT save_received_message_webhook(
    'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,  -- p_vps_instance_id (fake UUID)
    '5562999999999',                                -- p_phone
    'Teste de mensagem',                           -- p_message_text
    false,                                         -- p_from_me
    'text'                                         -- p_media_type
) as test_result;