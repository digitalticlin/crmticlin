-- Verificar todos os triggers na tabela whatsapp_instances
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.action_timing,
    t.action_statement,
    t.created
FROM information_schema.triggers t
WHERE t.event_object_table = 'whatsapp_instances'
ORDER BY t.trigger_name;

-- Verificar todas as funções relacionadas a delete
SELECT 
    p.proname as function_name,
    p.prosrc as function_body_start
FROM pg_proc p
WHERE p.proname LIKE '%delete%whatsapp%' 
   OR p.proname LIKE '%trigger%whatsapp%'
ORDER BY p.proname;

-- Verificar especificamente os triggers after_delete
SELECT 
    schemaname,
    tablename,
    triggername,
    triggerdef
FROM pg_triggers 
WHERE tablename = 'whatsapp_instances' 
  AND triggername LIKE '%delete%'
ORDER BY triggername;