-- Migração para controle de duplicados entre Baileys e Puppeteer
-- Arquivo: supabase/migrations/YYYYMMDD_add_message_deduplication.sql

-- Adicionar campos para controle de duplicados
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS external_message_id TEXT,
ADD COLUMN IF NOT EXISTS import_source TEXT DEFAULT 'realtime',
ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- Índices para performance na busca de duplicados
CREATE INDEX IF NOT EXISTS idx_messages_external_id ON messages(external_message_id) WHERE external_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_content_hash ON messages(content_hash) WHERE content_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_dedup ON messages(whatsapp_number_id, lead_id, timestamp, from_me);

-- Índice composto para verificação de duplicados por conteúdo
CREATE INDEX IF NOT EXISTS idx_messages_content_dedup ON messages(whatsapp_number_id, lead_id, content_hash) 
WHERE content_hash IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN messages.external_message_id IS 'ID único da mensagem do WhatsApp (Baileys/Puppeteer)';
COMMENT ON COLUMN messages.import_source IS 'Fonte da importação: realtime, baileys, puppeteer';
COMMENT ON COLUMN messages.content_hash IS 'Hash do conteúdo para detectar duplicados';

-- Adicionar também campo para leads se não existir
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS import_source TEXT DEFAULT 'realtime';

-- Índice para leads
CREATE INDEX IF NOT EXISTS idx_leads_import_source ON leads(import_source);

COMMENT ON COLUMN leads.import_source IS 'Fonte da importação: realtime, baileys, puppeteer'; 