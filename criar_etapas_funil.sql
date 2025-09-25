-- SQL para criar as etapas padrão do funil
-- Funil ID: 120fdecf-c134-400c-9416-37ca9890c43a
-- Usuário ID: 97747ca9-6963-4458-a12b-b1d3a85cc9d2

INSERT INTO kanban_stages (
  title,
  color,
  order_position,
  is_won,
  is_lost,
  is_fixed,
  funnel_id,
  created_by_user_id
)
VALUES
  ('Entrada de Leads', '#3B82F6', 1, false, false, true, '120fdecf-c134-400c-9416-37ca9890c43a', '97747ca9-6963-4458-a12b-b1d3a85cc9d2'),
  ('Qualificação', '#10B981', 2, false, false, false, '120fdecf-c134-400c-9416-37ca9890c43a', '97747ca9-6963-4458-a12b-b1d3a85cc9d2'),
  ('Proposta', '#F59E0B', 3, false, false, false, '120fdecf-c134-400c-9416-37ca9890c43a', '97747ca9-6963-4458-a12b-b1d3a85cc9d2'),
  ('Negociação', '#8B5CF6', 4, false, false, false, '120fdecf-c134-400c-9416-37ca9890c43a', '97747ca9-6963-4458-a12b-b1d3a85cc9d2'),
  ('Fechamento', '#EF4444', 5, false, false, false, '120fdecf-c134-400c-9416-37ca9890c43a', '97747ca9-6963-4458-a12b-b1d3a85cc9d2'),
  ('GANHO', '#10B981', 6, true, false, true, '120fdecf-c134-400c-9416-37ca9890c43a', '97747ca9-6963-4458-a12b-b1d3a85cc9d2'),
  ('PERDIDO', '#EF4444', 7, false, true, true, '120fdecf-c134-400c-9416-37ca9890c43a', '97747ca9-6963-4458-a12b-b1d3a85cc9d2');

-- Etapas criadas:
-- 1. Entrada de Leads - Etapa fixa inicial (azul)
-- 2. Qualificação - Para qualificar os leads (verde)
-- 3. Proposta - Envio de propostas (laranja)
-- 4. Negociação - Negociação de valores (roxo)
-- 5. Fechamento - Finalização da venda (vermelho)
-- 6. GANHO - Etapa fixa para vendas concluídas (verde)
-- 7. PERDIDO - Etapa fixa para oportunidades perdidas (vermelho)