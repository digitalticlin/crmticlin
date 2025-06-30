-- Tabela para armazenar intenções de importação que devem ser executadas automaticamente
CREATE TABLE import_intentions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id UUID NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'executed', 'error', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  error_message TEXT,
  result JSONB,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para performance
CREATE INDEX idx_import_intentions_instance_id ON import_intentions(instance_id);
CREATE INDEX idx_import_intentions_user_id ON import_intentions(user_id);
CREATE INDEX idx_import_intentions_status ON import_intentions(status);
CREATE INDEX idx_import_intentions_created_at ON import_intentions(created_at);

-- RLS policies
ALTER TABLE import_intentions ENABLE ROW LEVEL SECURITY;

-- Policy para usuários verem apenas suas próprias intenções
CREATE POLICY "Users can view their own import intentions" ON import_intentions
  FOR SELECT USING (auth.uid() = user_id);

-- Policy para usuários criarem suas próprias intenções
CREATE POLICY "Users can create their own import intentions" ON import_intentions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy para usuários atualizarem suas próprias intenções
CREATE POLICY "Users can update their own import intentions" ON import_intentions
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy para sistema (service role) acessar todas as intenções
CREATE POLICY "Service role can access all import intentions" ON import_intentions
  FOR ALL USING (auth.role() = 'service_role');

-- Comentários
COMMENT ON TABLE import_intentions IS 'Armazena intenções de importação de histórico que devem ser executadas automaticamente quando a instância conectar';
COMMENT ON COLUMN import_intentions.instance_id IS 'ID da instância WhatsApp';
COMMENT ON COLUMN import_intentions.user_id IS 'ID do usuário que solicitou a importação';
COMMENT ON COLUMN import_intentions.status IS 'Status da intenção: pending, processing, executed, error, cancelled';
COMMENT ON COLUMN import_intentions.result IS 'Resultado da execução da importação (JSON)';
COMMENT ON COLUMN import_intentions.metadata IS 'Metadados adicionais sobre a intenção de importação'; 