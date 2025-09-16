-- Debug: Testar criação de novo lead isoladamente

-- 1. Testar INSERT direto (sem RPC) para identificar o campo problemático
INSERT INTO public.leads (
    name,
    phone,
    profile_pic_url,
    whatsapp_number_id,
    created_by_user_id,
    import_source,
    funnel_id,
    kanban_stage_id,
    owner_id,
    country,
    last_message,
    last_message_time
) VALUES (
    '+55 (62) 98603-2824',                           -- name (formatado)
    '5562986032824',                                 -- phone (limpo)
    NULL,                                            -- profile_pic_url
    '66ae98b4-1c72-49e4-a7e9-ab774db101ec'::uuid,   -- whatsapp_number_id
    '712e7708-2299-4a00-9128-577c8f113ca4'::uuid,   -- created_by_user_id
    'webhook',                                       -- import_source
    NULL,                                            -- funnel_id (pode ser NULL)
    NULL,                                            -- kanban_stage_id (pode ser NULL)
    '712e7708-2299-4a00-9128-577c8f113ca4'::uuid,   -- owner_id
    NULL,                                            -- country (NULL como solicitado)
    'Teste de mensagem',                             -- last_message
    NOW()                                            -- last_message_time
);

-- 2. Se o INSERT falhar, teste sem os campos opcionais
INSERT INTO public.leads (
    name,
    phone,
    created_by_user_id,
    import_source,
    last_message,
    last_message_time
) VALUES (
    '+55 (62) 98603-2825',                           -- name (diferente para evitar duplicate)
    '5562986032825',                                 -- phone (diferente)
    '712e7708-2299-4a00-9128-577c8f113ca4'::uuid,   -- created_by_user_id
    'webhook',                                       -- import_source
    'Teste simples',                                 -- last_message
    NOW()                                            -- last_message_time
);