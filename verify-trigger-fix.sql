-- Verificar se a função foi realmente atualizada
-- e encontrar onde ainda está sendo usado whatsapp_instance_id

-- 1. Ver o código atual da função
\sf update_leads_owner_on_assignment_change;

-- 2. Buscar todas as referências a whatsapp_instance_id em funções
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND pg_get_functiondef(p.oid) LIKE '%whatsapp_instance_id%';

-- 3. Verificar triggers ativos que podem estar causando o problema
SELECT 
    schemaname,
    tablename,
    triggername,
    definition
FROM pg_triggers 
WHERE tablename IN ('user_whatsapp_numbers', 'profiles')
ORDER BY tablename, triggername;

-- 4. Verificar estrutura da tabela leads
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name LIKE '%whatsapp%';