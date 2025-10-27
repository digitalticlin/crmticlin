-- Adicionar coluna order_management na tabela ai_agents
ALTER TABLE ai_agents
ADD COLUMN IF NOT EXISTS order_management BOOLEAN DEFAULT false;

-- Comentário explicativo
COMMENT ON COLUMN ai_agents.order_management IS
'Define se o agente pode gerenciar pedidos/listas de produtos com clientes. TRUE = blocos de lista liberados no Flow Builder, FALSE = blocos bloqueados.';
