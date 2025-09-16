-- ================================================
-- SCRIPT DE MIGRAÇÃO DE LEADS E ADIÇÃO DE TAG
-- ================================================
-- Objetivo:
-- 1. Mover todos os leads do created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'
--    que estão na etapa '6b4a81cf-cf58-42d2-a856-e313a3e13943'
--    para a etapa '614be6b1-cc3d-4ea5-b436-98d16b686eb9'
-- 2. Adicionar a tag 'e6a2d0d0-8a9b-4c24-9fa7-e3d6e3cd8175' a esses leads
-- ================================================

BEGIN;

-- 1️⃣ PRIMEIRO: Verificar quantos leads serão afetados
DO $$
DECLARE
    total_leads INTEGER;
    etapa_origem_nome TEXT;
    etapa_destino_nome TEXT;
    tag_nome TEXT;
BEGIN
    -- Contar leads que serão movidos
    SELECT COUNT(*) INTO total_leads
    FROM leads
    WHERE created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'::uuid
    AND kanban_stage_id = '6b4a81cf-cf58-42d2-a856-e313a3e13943'::uuid;

    -- Buscar nome da etapa origem
    SELECT title INTO etapa_origem_nome
    FROM kanban_stages
    WHERE id = '6b4a81cf-cf58-42d2-a856-e313a3e13943'::uuid;

    -- Buscar nome da etapa destino
    SELECT title INTO etapa_destino_nome
    FROM kanban_stages
    WHERE id = '614be6b1-cc3d-4ea5-b436-98d16b686eb9'::uuid;

    -- Buscar nome da tag
    SELECT name INTO tag_nome
    FROM tags
    WHERE id = 'e6a2d0d0-8a9b-4c24-9fa7-e3d6e3cd8175'::uuid;

    RAISE NOTICE '================================================';
    RAISE NOTICE '📊 RESUMO DA OPERAÇÃO:';
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ Total de leads a serem movidos: %', total_leads;
    RAISE NOTICE '📌 Etapa origem: % (%)', etapa_origem_nome, '6b4a81cf-cf58-42d2-a856-e313a3e13943';
    RAISE NOTICE '📌 Etapa destino: % (%)', etapa_destino_nome, '614be6b1-cc3d-4ea5-b436-98d16b686eb9';
    RAISE NOTICE '🏷️ Tag a ser adicionada: % (%)', tag_nome, 'e6a2d0d0-8a9b-4c24-9fa7-e3d6e3cd8175';
    RAISE NOTICE '================================================';
END $$;

-- 2️⃣ LISTAR os leads que serão movidos (para conferência)
SELECT
    l.id,
    l.name,
    l.phone,
    l.email,
    ks_old.title as etapa_atual,
    ks_new.title as nova_etapa
FROM leads l
LEFT JOIN kanban_stages ks_old ON ks_old.id = l.kanban_stage_id
LEFT JOIN kanban_stages ks_new ON ks_new.id = '614be6b1-cc3d-4ea5-b436-98d16b686eb9'::uuid
WHERE l.created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'::uuid
AND l.kanban_stage_id = '6b4a81cf-cf58-42d2-a856-e313a3e13943'::uuid
ORDER BY l.created_at DESC;

-- 3️⃣ MOVER os leads para a nova etapa
UPDATE leads
SET
    kanban_stage_id = '614be6b1-cc3d-4ea5-b436-98d16b686eb9'::uuid,
    updated_at = NOW()
WHERE created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'::uuid
AND kanban_stage_id = '6b4a81cf-cf58-42d2-a856-e313a3e13943'::uuid
RETURNING id, name, phone;

-- 4️⃣ ADICIONAR a tag aos leads movidos
-- Primeiro, vamos inserir as associações de tag (evitando duplicatas)
INSERT INTO lead_tags (lead_id, tag_id)
SELECT
    l.id as lead_id,
    'e6a2d0d0-8a9b-4c24-9fa7-e3d6e3cd8175'::uuid as tag_id
FROM leads l
WHERE l.created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'::uuid
AND l.kanban_stage_id = '614be6b1-cc3d-4ea5-b436-98d16b686eb9'::uuid
-- Evitar duplicatas caso a tag já esteja associada
AND NOT EXISTS (
    SELECT 1
    FROM lead_tags lt
    WHERE lt.lead_id = l.id
    AND lt.tag_id = 'e6a2d0d0-8a9b-4c24-9fa7-e3d6e3cd8175'::uuid
)
RETURNING lead_id;

-- 5️⃣ VERIFICAR o resultado final
DO $$
DECLARE
    leads_movidos INTEGER;
    leads_com_tag INTEGER;
BEGIN
    -- Contar leads na nova etapa
    SELECT COUNT(*) INTO leads_movidos
    FROM leads
    WHERE created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'::uuid
    AND kanban_stage_id = '614be6b1-cc3d-4ea5-b436-98d16b686eb9'::uuid;

    -- Contar leads com a tag
    SELECT COUNT(DISTINCT lt.lead_id) INTO leads_com_tag
    FROM lead_tags lt
    INNER JOIN leads l ON l.id = lt.lead_id
    WHERE l.created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'::uuid
    AND l.kanban_stage_id = '614be6b1-cc3d-4ea5-b436-98d16b686eb9'::uuid
    AND lt.tag_id = 'e6a2d0d0-8a9b-4c24-9fa7-e3d6e3cd8175'::uuid;

    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ OPERAÇÃO CONCLUÍDA COM SUCESSO!';
    RAISE NOTICE '================================================';
    RAISE NOTICE '📊 Leads movidos para nova etapa: %', leads_movidos;
    RAISE NOTICE '🏷️ Leads com a tag adicionada: %', leads_com_tag;
    RAISE NOTICE '================================================';
END $$;

-- 6️⃣ VISUALIZAR resultado final detalhado
SELECT
    l.id,
    l.name,
    l.phone,
    l.email,
    ks.title as etapa_atual,
    STRING_AGG(t.name, ', ') as tags
FROM leads l
LEFT JOIN kanban_stages ks ON ks.id = l.kanban_stage_id
LEFT JOIN lead_tags lt ON lt.lead_id = l.id
LEFT JOIN tags t ON t.id = lt.tag_id
WHERE l.created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'::uuid
AND l.kanban_stage_id = '614be6b1-cc3d-4ea5-b436-98d16b686eb9'::uuid
GROUP BY l.id, l.name, l.phone, l.email, ks.title
ORDER BY l.updated_at DESC
LIMIT 20;

-- COMMIT ou ROLLBACK
-- Descomente a linha apropriada após verificar os resultados:

-- COMMIT; -- ✅ Confirma as mudanças
-- ROLLBACK; -- ❌ Desfaz as mudanças se algo estiver errado

COMMIT; -- Deixando COMMIT ativo por padrão, mas você pode mudar se necessário