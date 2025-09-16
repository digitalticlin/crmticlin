-- MAPEAMENTO COMPLETO: O que a RPC salva em cada tabela

-- 1. VERIFICAR ESTRUTURA DA TABELA LEADS (todos os campos)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position;

-- 2. VERIFICAR ESTRUTURA DA TABELA MESSAGES (todos os campos)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- 3. VERIFICAR ESTRUTURA DA TABELA WHATSAPP_INSTANCES
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'whatsapp_instances'
ORDER BY ordinal_position;

-- 4. VERIFICAR ESTRUTURA DA TABELA FUNNELS
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'funnels'
ORDER BY ordinal_position;

-- 5. TESTAR APENAS A CRIAÇÃO DE LEAD (isoladamente)
INSERT INTO public.leads (
    name,
    phone,
    created_by_user_id,
    import_source,
    last_message,
    last_message_time
) VALUES (
    '+55 (62) 99999-9999',
    '5562999999999',
    '712e7708-2299-4a00-9128-577c8f113ca4'::uuid,
    'webhook',
    'Teste isolado de criação',
    NOW()
) RETURNING id, name, phone;