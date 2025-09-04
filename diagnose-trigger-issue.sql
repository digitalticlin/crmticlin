-- DIAGNÓSTICO COMPLETO DOS TRIGGERS
SELECT 'STEP 1: Verificando triggers DELETE ativos' as step;

SELECT 
    t.trigger_name,
    t.trigger_schema,
    t.event_object_table,
    t.action_timing,
    t.event_manipulation
FROM information_schema.triggers t
WHERE t.event_object_table = 'whatsapp_instances'
ORDER BY t.trigger_name;

SELECT 'STEP 2: Verificando todas as funções trigger' as step;

SELECT 
    p.proname as function_name,
    CASE 
        WHEN p.prosrc LIKE '%🔥 TRIGGER ÚNICO%' THEN 'NOVA_COM_EMOJI'
        WHEN p.prosrc LIKE '%userId%' THEN 'COM_USERID'
        WHEN p.prosrc LIKE '%instanceId%' THEN 'COM_INSTANCEID'
        ELSE 'DESCONHECIDA'
    END as tipo,
    LENGTH(p.prosrc) as tamanho_codigo
FROM pg_proc p
WHERE (p.proname LIKE '%delete%whatsapp%' 
   OR p.proname LIKE '%trigger%whatsapp%'
   OR p.proname LIKE '%final%trigger%')
ORDER BY p.proname;

SELECT 'STEP 3: Verificando se há cache de conexões HTTP' as step;

-- Testar se a extensão http funciona
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http') 
        THEN 'HTTP EXTENSION ATIVA' 
        ELSE 'HTTP EXTENSION NAO ENCONTRADA' 
    END as http_status;