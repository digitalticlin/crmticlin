-- TESTE SIMPLES: Testar a função webhook com dados mínimos
SELECT public.save_received_message_webhook(
    'digitalticlingmailcom',  -- p_vps_instance_id
    '5562999999999',         -- p_phone
    'Mensagem de teste',     -- p_message_text
    false,                   -- p_from_me
    'text'                   -- p_media_type
);