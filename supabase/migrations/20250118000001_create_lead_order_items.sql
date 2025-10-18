-- ============================================
-- Tabela: lead_order_items
-- Descrição: Armazena itens de pedidos/listas dos leads
-- Usado pelos blocos: ADD_TO_LIST, GET_LIST, REMOVE_FROM_LIST
-- ============================================

CREATE TABLE IF NOT EXISTS lead_order_items (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Dados do item
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'BRL',

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_lead_order_items_lead_id
  ON lead_order_items(lead_id);

-- Comentários
COMMENT ON TABLE lead_order_items IS 'Itens de pedidos/listas dos leads (Flow Builder)';
COMMENT ON COLUMN lead_order_items.lead_id IS 'ID do lead (cliente) dono do item';
COMMENT ON COLUMN lead_order_items.name IS 'Nome do produto/serviço';
COMMENT ON COLUMN lead_order_items.description IS 'Observações/detalhes do item (preenchido pelo agente IA)';
COMMENT ON COLUMN lead_order_items.price IS 'Preço do item (opcional)';
COMMENT ON COLUMN lead_order_items.currency IS 'Moeda do preço (padrão: BRL)';
