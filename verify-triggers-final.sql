-- Verificar TODOS os triggers ativos na tabela whatsapp_instances
SELECT 
    'TRIGGERS ATIVOS:' as status,
    t.trigger_name,
    t.event_manipulation,
    t.action_timing,
    SUBSTRING(t.action_statement, 1, 100) as function_call
FROM information_schema.triggers t
WHERE t.event_object_table = 'whatsapp_instances'
  AND t.event_manipulation = 'DELETE'
ORDER BY t.trigger_name;

-- Verificar funções relacionadas
SELECT 
    'FUNCOES RELACIONADAS:' as status,
    p.proname as function_name,
    CASE 
        WHEN p.prosrc LIKE '%🔥 TRIGGER ÚNICO%' THEN 'FUNCAO_NOVA'
        WHEN p.prosrc LIKE '%userId%' THEN 'FUNCAO_COM_USERID'
        ELSE 'FUNCAO_ANTIGA'
    END as tipo
FROM pg_proc p
WHERE p.proname LIKE '%delete%whatsapp%' 
   OR p.proname LIKE '%trigger%whatsapp%'
ORDER BY p.proname;