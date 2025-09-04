-- Verificar todos os triggers na tabela whatsapp_instances
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.action_timing,
    t.action_statement
FROM information_schema.triggers t
WHERE t.event_object_table = 'whatsapp_instances'
ORDER BY t.trigger_name;

-- Verificar todas as funções relacionadas a delete
SELECT 
    p.proname as function_name,
    LEFT(p.prosrc, 200) as function_body_start
FROM pg_proc p
WHERE p.proname LIKE '%delete%whatsapp%' 
   OR p.proname LIKE '%trigger%whatsapp%'
ORDER BY p.proname;

-- Verificar especificamente os triggers using pg_trigger (corrigido)
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'whatsapp_instances' 
  AND t.tgname LIKE '%delete%'
ORDER BY t.tgname;