-- Criar tabela de Base de Conhecimento para agentes de IA
-- Permite que cada agente tenha um catálogo de produtos/serviços para oferecer

CREATE TABLE IF NOT EXISTS ai_agent_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'product' CHECK (type IN ('product', 'service')),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('BRL', 'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD')),
  image_url TEXT,
  created_by_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_agent_knowledge_agent_id ON ai_agent_knowledge(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_knowledge_created_by ON ai_agent_knowledge(created_by_user_id);

-- Comentários explicativos
COMMENT ON TABLE ai_agent_knowledge IS 'Base de Conhecimento: catálogo de produtos e serviços que cada agente IA pode oferecer aos clientes';
COMMENT ON COLUMN ai_agent_knowledge.type IS 'Tipo do item: product (produto físico com imagem obrigatória) ou service (serviço com imagem opcional)';
COMMENT ON COLUMN ai_agent_knowledge.currency IS 'Moeda do preço: BRL (Real), USD (Dólar), EUR (Euro), GBP (Libra), JPY (Iene), CHF (Franco), CAD (Dólar Can.), AUD (Dólar Aus.)';
COMMENT ON COLUMN ai_agent_knowledge.image_url IS 'URL pública da imagem do produto no Supabase Storage (bucket: agent-knowledge)';

-- RLS (Row Level Security)
ALTER TABLE ai_agent_knowledge ENABLE ROW LEVEL SECURITY;

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Users can manage their agent knowledge" ON ai_agent_knowledge;

-- Política: Usuários podem gerenciar itens da base de conhecimento dos seus próprios agentes
CREATE POLICY "Users can manage their agent knowledge"
ON ai_agent_knowledge
FOR ALL
USING (created_by_user_id = auth.uid())
WITH CHECK (created_by_user_id = auth.uid());

-- NOTA: O bucket 'agent-knowledge' e suas políticas de storage
-- são criados na migration 20250111000003_create_agent_knowledge_bucket.sql
