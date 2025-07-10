
-- Adicionar coluna ai_enabled na tabela kanban_stages
ALTER TABLE public.kanban_stages 
ADD COLUMN ai_enabled BOOLEAN NOT NULL DEFAULT true;

-- Adicionar comentário para documentar a coluna
COMMENT ON COLUMN public.kanban_stages.ai_enabled IS 'Controla se a IA está habilitada para responder leads nesta etapa do funil';
