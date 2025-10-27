-- Adicionar coluna country na tabela ai_agents
ALTER TABLE ai_agents ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'BR';

-- Comentário explicativo
COMMENT ON COLUMN ai_agents.country IS 'Código do país de atuação do agente (ISO 3166-1 alpha-2). Define a moeda padrão e formatação regional. Exemplos: BR (Brasil - Real), US (EUA - Dólar), GB (Reino Unido - Libra), EU (União Europeia - Euro).';
