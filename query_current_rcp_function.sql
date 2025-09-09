-- =====================================================
-- 🔍 CONSULTAR FUNÇÃO RCP ATUAL NO SUPABASE
-- =====================================================
-- Use este SQL no Supabase SQL Editor para ver a função atual

-- 1. VERIFICAR SE A FUNÇÃO EXISTE E SUAS VERSÕES
SELECT 
    routine_name,
    routine_type,
    data_type as return_type,
    routine_definition IS NOT NULL as has_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%save_whatsapp_message%'
ORDER BY routine_name;

-- 2. OBTER DEFINIÇÃO COMPLETA DA FUNÇÃO ATUAL
SELECT routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'save_whatsapp_message_service_role';

-- 3. VERIFICAR PARÂMETROS DA FUNÇÃO
SELECT 
    p.parameter_name,
    p.data_type,
    p.parameter_default,
    p.parameter_mode
FROM information_schema.parameters p
WHERE p.specific_schema = 'public'
AND p.specific_name IN (
    SELECT r.specific_name
    FROM information_schema.routines r
    WHERE r.routine_schema = 'public'
    AND r.routine_name = 'save_whatsapp_message_service_role'
)
ORDER BY p.ordinal_position;

-- 4. TESTAR A FUNÇÃO ATUAL (SUBSTITUA OS VALORES)
-- SELECT save_whatsapp_message_service_role(
--   'sua_instancia_vps_id'::text,
--   '556299212484'::text,
--   'Mensagem de teste'::text,
--   false::boolean,
--   'text'::text,
--   null::text,
--   'test_message_id'::text,
--   'Nome Teste'::text,
--   null::text,
--   'https://example.com/profile.jpg'::text
-- );

-- 5. VERIFICAR ÚLTIMAS MENSAGENS E LEADS CRIADOS
SELECT 
    m.id,
    m.text,
    m.from_me,
    m.media_type,
    m.media_url,
    m.created_at,
    l.name as lead_name,
    l.phone as lead_phone
FROM messages m
JOIN leads l ON l.id = m.lead_id
ORDER BY m.created_at DESC
LIMIT 10;

-- 6. VERIFICAR LEADS COM PROBLEMAS DE NOME
SELECT 
    id,
    name,
    phone,
    created_at
FROM leads
WHERE name NOT LIKE '+55 (%' -- Nomes que não seguem padrão telefone
AND name NOT SIMILAR TO '[A-Za-z]%' -- Nomes que não começam com letra
ORDER BY created_at DESC
LIMIT 20;

-- 7. VERIFICAR MENSAGENS COM FROM_ME INCORRETO
SELECT 
    id,
    text,
    from_me,
    created_at
FROM messages
WHERE from_me IS NULL -- Valores nulos (problema)
ORDER BY created_at DESC
LIMIT 10;

-- 8. VERIFICAR MENSAGENS COM MÍDIA SEM URL
SELECT 
    id,
    text,
    media_type,
    media_url,
    created_at
FROM messages
WHERE media_type != 'text'
AND (media_url IS NULL OR media_url = '')
ORDER BY created_at DESC
LIMIT 10;