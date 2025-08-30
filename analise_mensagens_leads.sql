-- Comando para analisar os campos das tabelas MESSAGES e LEADS

-- Estrutura da tabela LEADS
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Estrutura da tabela MESSAGES
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Exemplos de dados da tabela LEADS (limitado a 5 registros)
SELECT * FROM public.leads LIMIT 5;

-- Exemplos de dados da tabela MESSAGES (limitado a 5 registros)
SELECT * FROM public.messages LIMIT 5;

-- Contagem total de registros em cada tabela
SELECT 'leads' as table_name, COUNT(*) as total_records FROM public.leads
UNION ALL
SELECT 'messages' as table_name, COUNT(*) as total_records FROM public.messages;

-- Relacionamento entre LEADS e MESSAGES (exemplo com JOIN)
SELECT 
    l.id as lead_id,
    l.name as lead_name,
    l.phone as lead_phone,
    m.id as message_id,
    m.text as message_text,
    m.from_me,
    m.timestamp
FROM public.leads l
JOIN public.messages m ON l.id = m.lead_id
LIMIT 10;