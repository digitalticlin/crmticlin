-- ============================================
-- INVESTIGAÇÃO: NOVOS LEADS E created_by_user_id
-- ============================================

-- 1. VERIFICAR LEADS CRIADOS HOJE
SELECT
    l.id,
    l.name,
    l.phone,
    l.created_by_user_id,
    l.funnel_id,
    l.kanban_stage_id,
    l.whatsapp_number_id,
    l.created_at,
    l.updated_at,
    -- Informações do admin
    p.full_name as admin_name,
    p.email as admin_email,
    -- Informações da instância
    wi.instance_name,
    wi.phone as whatsapp_phone,
    wi.profile_name as whatsapp_profile,
    wi.created_by_user_id as instance_created_by
FROM leads l
LEFT JOIN profiles p ON l.created_by_user_id = p.id
LEFT JOIN whatsapp_instances wi ON l.whatsapp_number_id = wi.id
WHERE l.created_at >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY l.created_at DESC
LIMIT 50;

-- 2. VERIFICAR ÚLTIMAS MENSAGENS RECEBIDAS (24H)
SELECT
    m.id as message_id,
    m.created_at as message_date,
    m.from_me,
    m.text as message_text,
    m.lead_id,
    m.status,
    m.media_type,
    m.whatsapp_number_id,
    -- Dados do lead (se existir)
    l.name as lead_name,
    l.phone as lead_phone,
    l.created_by_user_id as lead_created_by,
    l.funnel_id,
    -- Dados da instância
    wi.instance_name,
    wi.phone as instance_phone,
    wi.created_by_user_id as instance_created_by
FROM messages m
LEFT JOIN leads l ON m.lead_id = l.id
LEFT JOIN whatsapp_instances wi ON m.whatsapp_number_id = wi.id
WHERE
    m.created_at > NOW() - INTERVAL '24 hours'
    AND m.from_me = false
ORDER BY m.created_at DESC
LIMIT 30;

-- 3. VERIFICAR CONFIGURAÇÃO DAS INSTÂNCIAS WHATSAPP
SELECT
    wi.id,
    wi.instance_name,
    wi.phone,
    wi.profile_name,
    wi.created_by_user_id,
    wi.connection_status,
    wi.created_at,
    -- Dados do admin
    p.full_name as admin_name,
    p.email as admin_email,
    p.role as admin_role,
    -- Contar leads dessa instância
    COUNT(DISTINCT l.id) as total_leads,
    COUNT(DISTINCT CASE WHEN l.created_at > NOW() - INTERVAL '1 day' THEN l.id END) as leads_hoje
FROM whatsapp_instances wi
LEFT JOIN profiles p ON wi.created_by_user_id = p.id
LEFT JOIN leads l ON l.whatsapp_number_id = wi.id
WHERE wi.connection_status = 'connected'
GROUP BY wi.id, wi.instance_name, wi.phone, wi.profile_name, wi.created_by_user_id, wi.connection_status, wi.created_at, p.full_name, p.email, p.role
ORDER BY wi.created_at DESC;

-- 4. VERIFICAR FUNIS E SUAS CONFIGURAÇÕES
SELECT
    f.id,
    f.name,
    f.created_by_user_id,
    f.is_active,
    f.created_at,
    -- Dados do admin
    p.full_name as admin_name,
    p.email as admin_email,
    -- Primeira etapa (entrada de leads)
    ks_first.id as primeira_etapa_id,
    ks_first.title as primeira_etapa_nome,
    -- Contar leads
    COUNT(DISTINCT l.id) as total_leads,
    COUNT(DISTINCT CASE WHEN l.created_at > NOW() - INTERVAL '1 day' THEN l.id END) as leads_hoje
FROM funnels f
LEFT JOIN profiles p ON f.created_by_user_id = p.id
LEFT JOIN kanban_stages ks_first ON f.id = ks_first.funnel_id AND ks_first.order_position = 1
LEFT JOIN leads l ON f.id = l.funnel_id
WHERE f.is_active = true
GROUP BY f.id, f.name, f.created_by_user_id, f.is_active, f.created_at, p.full_name, p.email, ks_first.id, ks_first.title
ORDER BY f.created_at DESC;

-- 5. VERIFICAR SYNC_LOGS DO WEBHOOK (últimas 24h)
SELECT
    sl.id,
    sl.function_name,
    sl.status,
    sl.created_at,
    sl.result->>'event' as webhook_event,
    sl.result->>'instanceId' as instance_id,
    sl.result->>'hasMedia' as has_media,
    sl.result->>'processed' as processed,
    sl.error_message
FROM sync_logs sl
WHERE
    sl.function_name = 'webhook_whatsapp_web'
    AND sl.created_at > NOW() - INTERVAL '24 hours'
ORDER BY sl.created_at DESC
LIMIT 20;

-- 6. INVESTIGAR LEADS SEM created_by_user_id (problema comum)
SELECT
    COUNT(*) as total_leads_sem_created_by,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 day' THEN 1 END) as leads_hoje_sem_created_by
FROM leads
WHERE created_by_user_id IS NULL;

-- 7. VERIFICAR RELAÇÃO TELEFONE -> INSTÂNCIA -> ADMIN
-- (Para entender como o webhook deve determinar o created_by_user_id)
SELECT DISTINCT
    wi.instance_name,
    wi.phone as instancia_telefone,
    wi.created_by_user_id as admin_id,
    p.full_name as admin_name,
    p.email as admin_email
FROM whatsapp_instances wi
LEFT JOIN profiles p ON wi.created_by_user_id = p.id
WHERE wi.connection_status = 'connected'
ORDER BY wi.phone;