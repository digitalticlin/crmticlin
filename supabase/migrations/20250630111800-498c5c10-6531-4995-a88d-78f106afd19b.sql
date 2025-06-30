
-- FASE 1: Correção no Banco de Dados
-- Atualizar todos os leads sem kanban_stage_id para a primeira etapa do seu funil

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

-- Caso não encontre 'Entrada de Leads', usar a primeira etapa por order_position
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
