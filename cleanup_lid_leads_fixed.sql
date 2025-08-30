-- 🧹 SCRIPT CORRIGIDO PARA LIMPAR LEADS CORROMPIDOS COM @lid

-- 1. Verificar leads com @lid antes da limpeza
SELECT 
    '=== LEADS COM @lid ANTES DA LIMPEZA ===' as info,
    COUNT(*) as total_leads_lid,
    string_agg(DISTINCT substring(phone, 1, 20), ', ') as exemplos_phones,
    string_agg(DISTINCT substring(name, 1, 20), ', ') as exemplos_names
FROM leads 
WHERE phone LIKE '%@lid%' OR name LIKE '%@lid%';

-- 2. Verificar mensagens relacionadas a esses leads
SELECT 
    '=== MENSAGENS DOS LEADS @lid ===' as info,
    COUNT(m.id) as total_messages,
    COUNT(DISTINCT m.lead_id) as leads_com_mensagens
FROM messages m
INNER JOIN leads l ON l.id = m.lead_id
WHERE l.phone LIKE '%@lid%' OR l.name LIKE '%@lid%';

-- 3. Excluir mensagens dos leads @lid primeiro (FK constraint)
DELETE FROM messages 
WHERE lead_id IN (
    SELECT id FROM leads 
    WHERE phone LIKE '%@lid%' OR name LIKE '%@lid%'
);

-- 4. Excluir leads com @lid  
DELETE FROM leads 
WHERE phone LIKE '%@lid%' OR name LIKE '%@lid%';

-- 5. Verificar limpeza
SELECT 
    '=== VERIFICAÇÃO APÓS LIMPEZA ===' as info,
    COUNT(*) as leads_restantes_com_lid
FROM leads 
WHERE phone LIKE '%@lid%' OR name LIKE '%@lid%';

-- 6. Estatísticas gerais após limpeza
SELECT 
    '=== ESTATÍSTICAS GERAIS ===' as info,
    COUNT(*) as total_leads,
    COUNT(DISTINCT phone) as phones_unicos,
    COUNT(*) FILTER (WHERE import_source = 'realtime') as leads_realtime,
    COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) as leads_hoje
FROM leads;

-- 7. Verificar se existem outros formatos problemáticos
SELECT 
    '=== POSSÍVEIS OUTROS PROBLEMAS ===' as info,
    COUNT(*) FILTER (WHERE LENGTH(phone) > 15) as phones_muito_longos,
    COUNT(*) FILTER (WHERE phone ~ '[^0-9@.]') as phones_caracteres_estranhos,
    COUNT(*) FILTER (WHERE name ~ '@') as names_com_arroba,
    string_agg(DISTINCT substring(phone, 1, 20), ', ') 
        FILTER (WHERE LENGTH(phone) > 15) as exemplos_phones_longos
FROM leads
LIMIT 1;

-- 8. Resultado final
SELECT '✅ LIMPEZA CONCLUÍDA!' as resultado;