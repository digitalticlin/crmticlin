-- Adicionar campo global_notify_phone à tabela ai_agents
ALTER TABLE ai_agents ADD COLUMN global_notify_phone TEXT;

-- Comentário explicativo
COMMENT ON COLUMN ai_agents.global_notify_phone IS 'Telefone único para receber notificações de todos os estágios do funil deste agente IA';