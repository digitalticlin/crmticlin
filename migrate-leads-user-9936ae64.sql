-- Migração de leads para usuário 9936ae64-b78c-48fe-97e8-bf67623349c6
-- Executar em transação para garantir atomicidade

BEGIN;

-- 1. Migrar leads da etapa 5b9aa7f5-9578-47fd-a92b-abb721abf1f3 para 5ae37e93-2794-447e-bf5b-97ecae6ae901
-- e adicionar tag e4edd28f-d3cc-44f0-bc22-526f92c6cc03
UPDATE leads
SET kanban_stage_id = '5ae37e93-2794-447e-bf5b-97ecae6ae901'
WHERE created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'
  AND kanban_stage_id = '5b9aa7f5-9578-47fd-a92b-abb721abf1f3';

-- Adicionar tag e4edd28f-d3cc-44f0-bc22-526f92c6cc03 aos leads migrados
INSERT INTO lead_tags (lead_id, tag_id, created_by_user_id, created_at)
SELECT l.id, 'e4edd28f-d3cc-44f0-bc22-526f92c6cc03', l.created_by_user_id, NOW()
FROM leads l
WHERE l.created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'
  AND l.kanban_stage_id = '5ae37e93-2794-447e-bf5b-97ecae6ae901'
  AND NOT EXISTS (
    SELECT 1 FROM lead_tags lt
    WHERE lt.lead_id = l.id AND lt.tag_id = 'e4edd28f-d3cc-44f0-bc22-526f92c6cc03'
  );

-- 2. Migrar leads da etapa 844b7501-d002-43c0-834e-7435220d58ff para 2fd0525e-a510-44c1-bcff-6645d5541fd5
-- e adicionar tag e6a2d0d0-8a9b-4c24-9fa7-e3d6e3cd8175
UPDATE leads
SET kanban_stage_id = '2fd0525e-a510-44c1-bcff-6645d5541fd5'
WHERE created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'
  AND kanban_stage_id = '844b7501-d002-43c0-834e-7435220d58ff';

-- Adicionar tag e6a2d0d0-8a9b-4c24-9fa7-e3d6e3cd8175 aos leads migrados
INSERT INTO lead_tags (lead_id, tag_id, created_by_user_id, created_at)
SELECT l.id, 'e6a2d0d0-8a9b-4c24-9fa7-e3d6e3cd8175', l.created_by_user_id, NOW()
FROM leads l
WHERE l.created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'
  AND l.kanban_stage_id = '2fd0525e-a510-44c1-bcff-6645d5541fd5'
  AND NOT EXISTS (
    SELECT 1 FROM lead_tags lt
    WHERE lt.lead_id = l.id AND lt.tag_id = 'e6a2d0d0-8a9b-4c24-9fa7-e3d6e3cd8175'
  );

-- 3. Migrar leads da etapa 7474b0f7-78ff-4e7f-92bb-15c2dd158e21 para 2fd0525e-a510-44c1-bcff-6645d5541fd5
-- e adicionar tag e6a2d0d0-8a9b-4c24-9fa7-e3d6e3cd8175
UPDATE leads
SET kanban_stage_id = '2fd0525e-a510-44c1-bcff-6645d5541fd5'
WHERE created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'
  AND kanban_stage_id = '7474b0f7-78ff-4e7f-92bb-15c2dd158e21';

-- Adicionar tag e6a2d0d0-8a9b-4c24-9fa7-e3d6e3cd8175 aos leads migrados
INSERT INTO lead_tags (lead_id, tag_id, created_by_user_id, created_at)
SELECT l.id, 'e6a2d0d0-8a9b-4c24-9fa7-e3d6e3cd8175', l.created_by_user_id, NOW()
FROM leads l
WHERE l.created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'
  AND l.kanban_stage_id = '2fd0525e-a510-44c1-bcff-6645d5541fd5'
  AND NOT EXISTS (
    SELECT 1 FROM lead_tags lt
    WHERE lt.lead_id = l.id AND lt.tag_id = 'e6a2d0d0-8a9b-4c24-9fa7-e3d6e3cd8175'
  );

-- Verificar quantos leads foram afetados
SELECT
  'Leads migrados para etapa 5ae37e93-2794-447e-bf5b-97ecae6ae901' as descricao,
  COUNT(*) as total
FROM leads
WHERE created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'
  AND kanban_stage_id = '5ae37e93-2794-447e-bf5b-97ecae6ae901'

UNION ALL

SELECT
  'Leads migrados para etapa 2fd0525e-a510-44c1-bcff-6645d5541fd5' as descricao,
  COUNT(*) as total
FROM leads
WHERE created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'
  AND kanban_stage_id = '2fd0525e-a510-44c1-bcff-6645d5541fd5';

COMMIT;