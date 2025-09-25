-- ============================================
-- INVESTIGAÇÃO: VINCULAÇÃO INSTÂNCIA WHATSAPP -> FUNIL
-- ============================================

-- 1. VERIFICAR SE JÁ EXISTE VINCULAÇÃO DIRETA NAS TABELAS
-- Buscar por campos que possam indicar vinculação instância -> funil
SELECT DISTINCT
    c.table_name,
    c.column_name,
    c.data_type
FROM information_schema.columns c
WHERE c.table_schema = 'public'
    AND (
        (c.table_name = 'whatsapp_instances' AND c.column_name ILIKE '%funnel%') OR
        (c.table_name = 'funnels' AND c.column_name ILIKE '%whatsapp%') OR
        (c.column_name ILIKE '%whatsapp%' AND c.column_name ILIKE '%funnel%')
    )
ORDER BY c.table_name, c.column_name;

-- 2. VERIFICAR TODAS AS FOREIGN KEYS RELACIONADAS A WHATSAPP_INSTANCES
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND (tc.table_name = 'whatsapp_instances' OR ccu.table_name = 'whatsapp_instances')
ORDER BY tc.table_name, kcu.column_name;

-- 3. BUSCAR TABELAS QUE PODEM FAZER PONTE INSTÂNCIA <-> FUNIL
SELECT
    table_name,
    column_name
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name NOT IN ('whatsapp_instances', 'funnels')
    AND (
        column_name ILIKE '%whatsapp%instance%' OR
        column_name ILIKE '%funnel%id%' OR
        column_name = 'whatsapp_number_id'
    )
ORDER BY table_name, column_name;

-- 4. VERIFICAR SE LEADS FAZEM A PONTE (instância -> lead -> funil)
-- Contar quantos leads por instância e funil para ver padrão
SELECT
    wi.instance_name,
    wi.phone as whatsapp_phone,
    l.funnel_id,
    f.name as funnel_name,
    COUNT(l.id) as leads_count,
    MIN(l.created_at) as primeiro_lead,
    MAX(l.created_at) as ultimo_lead
FROM whatsapp_instances wi
LEFT JOIN leads l ON wi.id = l.whatsapp_number_id
LEFT JOIN funnels f ON l.funnel_id = f.id
WHERE wi.created_by_user_id = 'e75375eb-37a8-4afa-8fa3-1f13e4855439'
GROUP BY wi.id, wi.instance_name, wi.phone, l.funnel_id, f.name
ORDER BY wi.instance_name, leads_count DESC;

-- 5. PROPOSTA: COMO DETERMINAR FUNIL PADRÃO PARA INSTÂNCIA
-- Opção A: Usar o primeiro funil criado pelo admin
SELECT
    'OPCAO_A' as estrategia,
    f.id as funil_id,
    f.name as funil_nome,
    f.created_at,
    ks.id as primeira_etapa_id,
    ks.title as primeira_etapa_nome
FROM funnels f
LEFT JOIN kanban_stages ks ON f.id = ks.funnel_id AND ks.order_position = 1
WHERE f.created_by_user_id = 'e75375eb-37a8-4afa-8fa3-1f13e4855439'
    AND f.is_active = true
ORDER BY f.created_at ASC
LIMIT 1;

-- Opção B: Usar funil mais usado pelo admin (se houver leads)
SELECT
    'OPCAO_B' as estrategia,
    f.id as funil_id,
    f.name as funil_nome,
    COUNT(l.id) as total_leads,
    ks.id as primeira_etapa_id,
    ks.title as primeira_etapa_nome
FROM funnels f
LEFT JOIN leads l ON f.id = l.funnel_id
LEFT JOIN kanban_stages ks ON f.id = ks.funnel_id AND ks.order_position = 1
WHERE f.created_by_user_id = 'e75375eb-37a8-4afa-8fa3-1f13e4855439'
    AND f.is_active = true
GROUP BY f.id, f.name, ks.id, ks.title
ORDER BY total_leads DESC, f.created_at ASC
LIMIT 1;

-- 6. VERIFICAR SE PODEMOS ADICIONAR CAMPO default_funnel_id EM whatsapp_instances
-- Isso mostraria se é viável essa abordagem
SELECT
    'ESTRUTURA_ATUAL' as info,
    COUNT(*) as total_instancias,
    COUNT(DISTINCT created_by_user_id) as admins_unicos
FROM whatsapp_instances;

-- 7. SIMULAR LÓGICA MELHORADA PARA process_whatsapp_message
-- Como a função deveria buscar funil + etapa para instância específica
SELECT
    wi.id as instancia_id,
    wi.instance_name,
    wi.created_by_user_id as admin_id,
    -- Funil padrão (primeiro criado pelo admin)
    f.id as funil_padrao_id,
    f.name as funil_padrao_nome,
    -- Primeira etapa deste funil
    ks.id as primeira_etapa_id,
    ks.title as primeira_etapa_nome,
    ks.order_position
FROM whatsapp_instances wi
LEFT JOIN funnels f ON wi.created_by_user_id = f.created_by_user_id
    AND f.is_active = true
LEFT JOIN kanban_stages ks ON f.id = ks.funnel_id
    AND ks.order_position = 1
WHERE wi.id = '988273f7-819f-4584-b4b4-c60f229d34e2'  -- Instância dos leads problemáticos
ORDER BY f.created_at ASC
LIMIT 1;