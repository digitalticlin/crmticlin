-- Criar tabela para sessões de importação via Puppeteer
CREATE TABLE IF NOT EXISTS instances_puppeteer (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id UUID NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE,
  qr_code TEXT,
  status TEXT DEFAULT 'waiting_qr' CHECK (status IN ('waiting_qr', 'connected', 'importing', 'completed', 'error')),
  progress INTEGER DEFAULT 0,
  total_contacts INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_instances_puppeteer_instance_id ON instances_puppeteer(instance_id);
CREATE INDEX IF NOT EXISTS idx_instances_puppeteer_user_id ON instances_puppeteer(user_id);
CREATE INDEX IF NOT EXISTS idx_instances_puppeteer_session_id ON instances_puppeteer(session_id);
CREATE INDEX IF NOT EXISTS idx_instances_puppeteer_status ON instances_puppeteer(status);

-- RLS (Row Level Security)
ALTER TABLE instances_puppeteer ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own puppeteer sessions" ON instances_puppeteer
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own puppeteer sessions" ON instances_puppeteer
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own puppeteer sessions" ON instances_puppeteer
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own puppeteer sessions" ON instances_puppeteer
  FOR DELETE USING (user_id = auth.uid());

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_instances_puppeteer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_instances_puppeteer_updated_at
  BEFORE UPDATE ON instances_puppeteer
  FOR EACH ROW
  EXECUTE FUNCTION update_instances_puppeteer_updated_at(); 