-- Adicionar colunas keywords e price_type na tabela ai_agent_knowledge

-- 1. Adicionar coluna keywords (TEXT) para busca semântica
ALTER TABLE ai_agent_knowledge
  ADD COLUMN IF NOT EXISTS keywords TEXT;

-- 2. Adicionar coluna price_type (VARCHAR) para diferenciar preço fixo vs sob consulta
ALTER TABLE ai_agent_knowledge
  ADD COLUMN IF NOT EXISTS price_type VARCHAR(20) DEFAULT 'fixed';

-- 3. Permitir que price e currency sejam NULL (para quando price_type = 'on_request')
ALTER TABLE ai_agent_knowledge
  ALTER COLUMN price DROP NOT NULL,
  ALTER COLUMN currency DROP NOT NULL;

-- 4. Comentários explicativos
COMMENT ON COLUMN ai_agent_knowledge.keywords IS 'Palavras-chave separadas por vírgula para melhorar busca semântica. Ex: "carne, bovina, churrasco, bife"';
COMMENT ON COLUMN ai_agent_knowledge.price_type IS 'Tipo de precificação: "fixed" = preço fixo (usa valor de price), "on_request" = sob consulta (price fica NULL)';
COMMENT ON COLUMN ai_agent_knowledge.price IS 'Preço do produto/serviço. NULL quando price_type = "on_request"';
COMMENT ON COLUMN ai_agent_knowledge.currency IS 'Moeda do preço. NULL quando price_type = "on_request"';

-- 5. Atualizar registros existentes: definir price_type baseado em price
UPDATE ai_agent_knowledge
SET price_type = CASE
  WHEN price IS NULL THEN 'on_request'
  ELSE 'fixed'
END
WHERE price_type IS NULL;
