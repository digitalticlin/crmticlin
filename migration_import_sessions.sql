-- Migração para tabela de sessões de importação Puppeteer
-- Arquivo: supabase/migrations/YYYYMMDD_add_import_sessions.sql

-- Criar tabela para controlar sessões de importação
CREATE TABLE IF NOT EXISTS whatsapp_import_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('waiting_qr', 'connecting', 'connected', 'importing', 'completed', 'error')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  qr_code TEXT,
  total_contacts INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_import_sessions_instance ON whatsapp_import_sessions(instance_id);
CREATE INDEX IF NOT EXISTS idx_import_sessions_user ON whatsapp_import_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_import_sessions_status ON whatsapp_import_sessions(status);
CREATE INDEX IF NOT EXISTS idx_import_sessions_created ON whatsapp_import_sessions(created_at DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_import_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_import_sessions_updated_at
  BEFORE UPDATE ON whatsapp_import_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_import_sessions_updated_at();

-- RLS (Row Level Security) para segurança
ALTER TABLE whatsapp_import_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: usuários só podem ver suas próprias sessões
CREATE POLICY "Users can view own import sessions"
  ON whatsapp_import_sessions FOR SELECT
  USING (user_id = auth.uid());

-- Policy: usuários só podem inserir sessões para si mesmos
CREATE POLICY "Users can insert own import sessions"
  ON whatsapp_import_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: usuários só podem atualizar suas próprias sessões
CREATE POLICY "Users can update own import sessions"
  ON whatsapp_import_sessions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: usuários só podem deletar suas próprias sessões
CREATE POLICY "Users can delete own import sessions"
  ON whatsapp_import_sessions FOR DELETE
  USING (user_id = auth.uid());

-- Criar tabela de notificações se não existir
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para notificações
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- RLS para notificações
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Comentários para documentação
COMMENT ON TABLE whatsapp_import_sessions IS 'Sessões de importação de histórico via Puppeteer';
COMMENT ON COLUMN whatsapp_import_sessions.status IS 'Status: waiting_qr, connecting, connected, importing, completed, error';
COMMENT ON COLUMN whatsapp_import_sessions.progress IS 'Progresso da importação (0-100%)';
COMMENT ON COLUMN whatsapp_import_sessions.qr_code IS 'QR Code base64 para conexão WhatsApp';

COMMENT ON TABLE notifications IS 'Sistema de notificações para usuários';
COMMENT ON COLUMN notifications.type IS 'Tipo: import_completed, import_error, etc.';
COMMENT ON COLUMN notifications.data IS 'Dados extras em JSON'; 