-- ================================================
-- EXECUTAR ESTE SCRIPT MANUALMENTE NO SUPABASE
-- ================================================
-- Vá em: SQL Editor no painel do Supabase
-- Cole este código e clique em "Run"
-- ================================================

-- PASSO 1: Ver quantos leads serão afetados
SELECT COUNT(*) as total_leads_para_mover
FROM leads
WHERE created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'::uuid
AND kanban_stage_id = '6b4a81cf-cf58-42d2-a856-e313a3e13943'::uuid;

-- PASSO 2: Listar os leads (para conferir)
SELECT id, name, phone, email
FROM leads
WHERE created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'::uuid
AND kanban_stage_id = '6b4a81cf-cf58-42d2-a856-e313a3e13943'::uuid
LIMIT 10;

-- PASSO 3: MOVER OS LEADS PARA NOVA ETAPA
UPDATE leads
SET
    kanban_stage_id = '614be6b1-cc3d-4ea5-b436-98d16b686eb9'::uuid,
    updated_at = NOW()
WHERE
    created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'::uuid
    AND kanban_stage_id = '6b4a81cf-cf58-42d2-a856-e313a3e13943'::uuid;

-- PASSO 4: ADICIONAR A TAG AOS LEADS MOVIDOS
INSERT INTO lead_tags (lead_id, tag_id)
SELECT
    l.id as lead_id,
    'e6a2d0d0-8a9b-4c24-9fa7-e3d6e3cd8175'::uuid as tag_id
FROM leads l
WHERE
    l.created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'::uuid
    AND l.kanban_stage_id = '614be6b1-cc3d-4ea5-b436-98d16b686eb9'::uuid
    AND NOT EXISTS (
        SELECT 1
        FROM lead_tags lt
        WHERE lt.lead_id = l.id
        AND lt.tag_id = 'e6a2d0d0-8a9b-4c24-9fa7-e3d6e3cd8175'::uuid
    );

-- PASSO 5: VERIFICAR O RESULTADO
SELECT
    l.id,
    l.name,
    l.phone,
    ks.title as etapa_atual,
    COUNT(lt.tag_id) as total_tags
FROM leads l
LEFT JOIN kanban_stages ks ON ks.id = l.kanban_stage_id
LEFT JOIN lead_tags lt ON lt.lead_id = l.id AND lt.tag_id = 'e6a2d0d0-8a9b-4c24-9fa7-e3d6e3cd8175'::uuid
WHERE
    l.created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'::uuid
    AND l.kanban_stage_id = '614be6b1-cc3d-4ea5-b436-98d16b686eb9'::uuid
GROUP BY l.id, l.name, l.phone, ks.title
LIMIT 20;