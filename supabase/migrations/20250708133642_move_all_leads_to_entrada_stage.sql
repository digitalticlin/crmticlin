-- Migração para mover TODOS os leads para a etapa "Entrada de Leads"
-- Garantindo que todos os leads estejam na etapa inicial do funil

-- PASSO 1: Mover todos os leads que já têm funil_id para a etapa "Entrada de Leads"
UPDATE leads 
SET kanban_stage_id = (
  SELECT ks.id 
  FROM kanban_stages ks 
  WHERE ks.funnel_id = leads.funnel_id 
  AND ks.title = 'Entrada de Leads'
  LIMIT 1
)
WHERE funnel_id IS NOT NULL;

-- PASSO 2: Para leads que não encontraram "Entrada de Leads", usar a primeira etapa do funil
UPDATE leads 
SET kanban_stage_id = (
  SELECT ks.id 
  FROM kanban_stages ks 
  WHERE ks.funnel_id = leads.funnel_id 
  ORDER BY ks.order_position ASC
  LIMIT 1
)
WHERE kanban_stage_id IS NULL 
AND funnel_id IS NOT NULL;

-- PASSO 3: Para leads sem funnel_id, atribuir ao primeiro funil do usuário
UPDATE leads 
SET funnel_id = (
  SELECT f.id 
  FROM funnels f 
  WHERE f.created_by_user_id = leads.created_by_user_id
  ORDER BY f.created_at ASC
  LIMIT 1
)
WHERE funnel_id IS NULL;

-- PASSO 4: Atribuir etapa "Entrada de Leads" para os leads que acabaram de receber funnel_id
UPDATE leads 
SET kanban_stage_id = (
  SELECT ks.id 
  FROM kanban_stages ks 
  WHERE ks.funnel_id = leads.funnel_id 
  AND ks.title = 'Entrada de Leads'
  LIMIT 1
)
WHERE kanban_stage_id IS NULL 
AND funnel_id IS NOT NULL;
