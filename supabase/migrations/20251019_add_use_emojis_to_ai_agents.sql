-- Adicionar coluna use_emojis na tabela ai_agents
ALTER TABLE ai_agents ADD COLUMN IF NOT EXISTS use_emojis BOOLEAN DEFAULT true;

-- Comentário explicativo
COMMENT ON COLUMN ai_agents.use_emojis IS 'Define se o agente pode usar emojis na comunicação. TRUE = pode usar emojis, FALSE = comunicação apenas com texto.';
