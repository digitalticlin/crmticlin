-- Criar tabela para produtos e serviços dos agentes de IA
-- Permite que cada agente tenha um catálogo de produtos/serviços para oferecer

CREATE TABLE IF NOT EXISTS ai_agent_products (
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
CREATE INDEX IF NOT EXISTS idx_ai_agent_products_agent_id ON ai_agent_products(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_products_created_by ON ai_agent_products(created_by_user_id);

-- Comentários explicativos
COMMENT ON TABLE ai_agent_products IS 'Catálogo de produtos e serviços que cada agente IA pode oferecer aos clientes';
COMMENT ON COLUMN ai_agent_products.type IS 'Tipo do item: product (produto físico com imagem obrigatória) ou service (serviço com imagem opcional)';
COMMENT ON COLUMN ai_agent_products.currency IS 'Moeda do preço: BRL (Real), USD (Dólar), EUR (Euro), GBP (Libra), JPY (Iene), CHF (Franco), CAD (Dólar Can.), AUD (Dólar Aus.)';
COMMENT ON COLUMN ai_agent_products.image_url IS 'URL pública da imagem do produto no Supabase Storage (bucket: agent-products)';

-- RLS (Row Level Security)
ALTER TABLE ai_agent_products ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem gerenciar produtos dos seus próprios agentes
CREATE POLICY "Users can manage their agent products"
ON ai_agent_products
FOR ALL
USING (created_by_user_id = auth.uid())
WITH CHECK (created_by_user_id = auth.uid());

-- Criar bucket de storage para imagens de produtos (se não existir)
-- Nota: Isso precisa ser executado manualmente no painel do Supabase Storage
-- ou via script separado, pois CREATE BUCKET não é SQL padrão

-- Instruções para criar o bucket manualmente:
-- 1. Ir em Storage > Buckets
-- 2. Criar novo bucket: "agent-products"
-- 3. Marcar como "Public bucket"
-- 4. Aplicar as políticas abaixo via SQL Editor:

/*
-- Política de upload (usuários podem fazer upload em suas próprias pastas)
CREATE POLICY "Users can upload product images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'agent-products' AND
  auth.uid() IS NOT NULL
);

-- Política de leitura pública
CREATE POLICY "Public can read product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'agent-products');

-- Política de atualização (usuários podem atualizar suas próprias imagens)
CREATE POLICY "Users can update their product images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'agent-products' AND
  auth.uid() IS NOT NULL
);

-- Política de exclusão (usuários podem deletar suas próprias imagens)
CREATE POLICY "Users can delete their product images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'agent-products' AND
  auth.uid() IS NOT NULL
);
*/
