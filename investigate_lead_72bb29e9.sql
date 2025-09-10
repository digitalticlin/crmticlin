-- 🔍 INVESTIGAÇÃO DO LEAD PROBLEMÁTICO: 72bb29e9-c7b1-4042-92dc-64dfa8ff4ef8
-- Problema: 556281364997 → +92 (04) 54609-51243 → 92045460951243@lid

-- 1. 📋 DADOS COMPLETOS DO LEAD
SELECT 
    '=== DADOS DO LEAD ===' as section,
    id,
    phone,
    name,
    whatsapp_number_id,
    created_at,
    updated_at,
    import_source,
    last_message,
    last_message_time,
    profile_pic_url,
    unread_count
FROM leads 
WHERE id = '72bb29e9-c7b1-4042-92dc-64dfa8ff4ef8';

-- 2. 📱 INSTÂNCIA WHATSAPP RELACIONADA
SELECT 
    '=== INSTÂNCIA WHATSAPP ===' as section,
    wi.id,
    wi.vps_instance_id,
    wi.phone as instance_phone,
    wi.profile_name,
    wi.connection_status,
    wi.created_at as instance_created,
    wi.updated_at as instance_updated
FROM whatsapp_instances wi
INNER JOIN leads l ON l.whatsapp_number_id = wi.id
WHERE l.id = '72bb29e9-c7b1-4042-92dc-64dfa8ff4ef8';

-- 3. 💬 MENSAGENS RECENTES (últimas 5)
SELECT 
    '=== MENSAGENS RECENTES ===' as section,
    m.id,
    m.text,
    m.from_me,
    m.timestamp,
    m.media_type,
    m.external_message_id,
    CASE WHEN m.base64_data IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as has_base64,
    LENGTH(m.base64_data) as base64_length
FROM messages m
WHERE m.lead_id = '72bb29e9-c7b1-4042-92dc-64dfa8ff4ef8'
ORDER BY m.timestamp DESC
LIMIT 5;

-- 4. 🧪 TESTE DA FUNÇÃO format_brazilian_phone COM DADOS REAIS
SELECT 
    '=== TESTE FORMATAÇÃO ===' as section,
    'Teste com número original' as test_description,
    format_brazilian_phone('556281364997') as result_original;

SELECT 
    '=== TESTE FORMATAÇÃO ===' as section,
    'Teste com número corrompido (phone atual)' as test_description,
    format_brazilian_phone(l.phone) as result_current_phone
FROM leads l
WHERE l.id = '72bb29e9-c7b1-4042-92dc-64dfa8ff4ef8';

-- 5. 📊 LOGS DE WEBHOOK (se disponível)
SELECT 
    '=== LOGS WEBHOOK ===' as section,
    sl.function_name,
    sl.status,
    sl.created_at,
    sl.result->>'event' as event_type,
    sl.result->>'instanceId' as instance_id,
    sl.result->>'hasMedia' as has_media,
    sl.error_message
FROM sync_logs sl
WHERE sl.function_name = 'webhook_whatsapp_web'
    AND sl.created_at >= (
        SELECT created_at - INTERVAL '1 hour' 
        FROM leads 
        WHERE id = '72bb29e9-c7b1-4042-92dc-64dfa8ff4ef8'
    )
    AND sl.created_at <= (
        SELECT created_at + INTERVAL '1 hour' 
        FROM leads 
        WHERE id = '72bb29e9-c7b1-4042-92dc-64dfa8ff4ef8'
    )
ORDER BY sl.created_at DESC
LIMIT 10;

-- 6. 🔍 BUSCAR OUTROS LEADS COM PROBLEMA SIMILAR
SELECT 
    '=== LEADS SIMILARES COM @lid ===' as section,
    COUNT(*) as total_leads_com_lid,
    string_agg(DISTINCT SUBSTRING(name, 1, 20), ', ') as exemplos_nomes
FROM leads 
WHERE name LIKE '%@lid%';

-- 7. 📈 ANÁLISE ESTATÍSTICA DO PROBLEMA
SELECT 
    '=== ESTATÍSTICAS DO PROBLEMA ===' as section,
    COUNT(*) FILTER (WHERE name LIKE '%@lid%') as leads_com_lid,
    COUNT(*) FILTER (WHERE LENGTH(phone) > 13) as phones_muito_longos,
    COUNT(*) FILTER (WHERE phone ~ '^[0-9]+$' AND LENGTH(phone) = 12) as phones_12_digitos,
    COUNT(*) FILTER (WHERE phone ~ '^[0-9]+$' AND LENGTH(phone) = 13) as phones_13_digitos,
    COUNT(*) FILTER (WHERE phone ~ '^[0-9]+$' AND LENGTH(phone) > 13) as phones_mais_13_digitos
FROM leads;

-- 8. 🎯 VERIFICAR SE HÁ PADRÃO NA CORRUPÇÃO
SELECT 
    '=== PADRÃO DE CORRUPÇÃO ===' as section,
    phone,
    name,
    created_at,
    import_source
FROM leads 
WHERE name LIKE '%@lid%'
ORDER BY created_at DESC
LIMIT 10;