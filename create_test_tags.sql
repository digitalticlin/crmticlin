-- Criar tags de teste se não existirem
INSERT INTO public.tags (name, color, created_by_user_id)
SELECT 'Cliente VIP', '#FF6B35', auth.uid()
WHERE NOT EXISTS (SELECT 1 FROM public.tags WHERE name = 'Cliente VIP');

INSERT INTO public.tags (name, color, created_by_user_id)
SELECT 'Urgente', '#E74C3C', auth.uid()
WHERE NOT EXISTS (SELECT 1 FROM public.tags WHERE name = 'Urgente');

INSERT INTO public.tags (name, color, created_by_user_id)
SELECT 'Follow-up', '#3498DB', auth.uid()
WHERE NOT EXISTS (SELECT 1 FROM public.tags WHERE name = 'Follow-up');

INSERT INTO public.tags (name, color, created_by_user_id)
SELECT 'Lead Quente', '#F39C12', auth.uid()
WHERE NOT EXISTS (SELECT 1 FROM public.tags WHERE name = 'Lead Quente');

INSERT INTO public.tags (name, color, created_by_user_id)
SELECT 'Interessado', '#27AE60', auth.uid()
WHERE NOT EXISTS (SELECT 1 FROM public.tags WHERE name = 'Interessado');

-- Associar algumas tags aos primeiros leads (para teste)
-- Selecionar alguns leads para associar
WITH random_leads AS (
  SELECT id FROM public.leads
  ORDER BY created_at DESC
  LIMIT 10
),
test_tags AS (
  SELECT id FROM public.tags
  WHERE name IN ('Cliente VIP', 'Urgente', 'Follow-up', 'Lead Quente', 'Interessado')
)
INSERT INTO public.lead_tags (lead_id, tag_id)
SELECT
  rl.id,
  tt.id
FROM random_leads rl
CROSS JOIN test_tags tt
WHERE NOT EXISTS (
  SELECT 1 FROM public.lead_tags
  WHERE lead_id = rl.id AND tag_id = tt.id
)
-- Limitar para não criar muitas associações
AND random() < 0.3; -- 30% de chance para cada combinação

-- Verificar o resultado
SELECT
  l.name as lead_name,
  t.name as tag_name,
  t.color as tag_color
FROM public.leads l
JOIN public.lead_tags lt ON l.id = lt.lead_id
JOIN public.tags t ON lt.tag_id = t.id
ORDER BY l.name, t.name
LIMIT 20;