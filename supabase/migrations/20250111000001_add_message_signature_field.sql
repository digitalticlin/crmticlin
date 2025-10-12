-- Adicionar campo message_signature_enabled na tabela ai_agents
-- Este campo controla se o agente adiciona "Agente diz:" antes de cada mensagem

ALTER TABLE ai_agents
ADD COLUMN IF NOT EXISTS message_signature_enabled BOOLEAN DEFAULT FALSE;

-- Comentário explicativo
COMMENT ON COLUMN ai_agents.message_signature_enabled IS 'Quando TRUE, adiciona "Agente diz:" antes de cada mensagem enviada pelo agente';
