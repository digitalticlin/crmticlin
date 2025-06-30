-- ====================================================================
-- MIGRAÇÃO: Sistema de Cache de Mídia WhatsApp
-- APLIQUE ESTE SQL NO SEU BANCO SUPABASE
-- ====================================================================

-- 1. Criar tabela para cache de mídia do WhatsApp
CREATE TABLE IF NOT EXISTS media_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência à mensagem original
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  
  -- URL original temporária do WhatsApp
  original_url TEXT NOT NULL,
  
  -- URL permanente da mídia armazenada no Supabase Storage
  cached_url TEXT,
  
  -- Dados da mídia em Base64 (fallback para mídias pequenas)
  media_data TEXT,
  
  -- Metadados
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  media_type media_type NOT NULL,
  
  -- Status do cache
  cache_status TEXT DEFAULT 'pending' CHECK (cache_status IN ('pending', 'cached', 'failed', 'expired')),
  
  -- Hash para evitar duplicatas
  content_hash TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  cached_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(message_id),
  UNIQUE(original_url, content_hash)
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_media_cache_original_url ON media_cache(original_url);
CREATE INDEX IF NOT EXISTS idx_media_cache_status ON media_cache(cache_status);
CREATE INDEX IF NOT EXISTS idx_media_cache_type ON media_cache(media_type);
CREATE INDEX IF NOT EXISTS idx_media_cache_message_id ON media_cache(message_id);
CREATE INDEX IF NOT EXISTS idx_media_cache_hash ON media_cache(content_hash);

-- 3. RLS Policies
ALTER TABLE media_cache ENABLE ROW LEVEL SECURITY;

-- Policy para visualizar cache de mídia próprio
DROP POLICY IF EXISTS "Users can view their own media cache" ON media_cache;
CREATE POLICY "Users can view their own media cache" ON media_cache
  FOR SELECT USING (
    message_id IN (
      SELECT id FROM messages WHERE created_by_user_id = auth.uid()
    )
  );

-- Policy para inserir cache de mídia próprio
DROP POLICY IF EXISTS "Users can insert their own media cache" ON media_cache;
CREATE POLICY "Users can insert their own media cache" ON media_cache
  FOR INSERT WITH CHECK (
    message_id IN (
      SELECT id FROM messages WHERE created_by_user_id = auth.uid()
    )
  );

-- Policy para atualizar cache de mídia próprio
DROP POLICY IF EXISTS "Users can update their own media cache" ON media_cache;
CREATE POLICY "Users can update their own media cache" ON media_cache
  FOR UPDATE USING (
    message_id IN (
      SELECT id FROM messages WHERE created_by_user_id = auth.uid()
    )
  );

-- 4. Função para limpar cache expirado (executar periodicamente)
CREATE OR REPLACE FUNCTION clean_expired_media_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM media_cache 
  WHERE expires_at < NOW() 
    AND cache_status = 'expired';
    
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- 5. Função para atualizar last_accessed
CREATE OR REPLACE FUNCTION update_media_access()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.last_accessed = NOW();
  RETURN NEW;
END;
$$;

-- Trigger para atualizar last_accessed automaticamente
DROP TRIGGER IF EXISTS trigger_update_media_access ON media_cache;
CREATE TRIGGER trigger_update_media_access
  BEFORE UPDATE ON media_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_media_access();

-- 6. Função para buscar cache (usada pelo TypeScript)
CREATE OR REPLACE FUNCTION get_media_cache(p_message_id UUID)
RETURNS TABLE (
  id UUID,
  message_id UUID,
  original_url TEXT,
  cached_url TEXT,
  media_data TEXT,
  cache_status TEXT,
  media_type media_type,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mc.id,
    mc.message_id,
    mc.original_url,
    mc.cached_url,
    mc.media_data,
    mc.cache_status,
    mc.media_type,
    mc.created_at
  FROM media_cache mc
  WHERE mc.message_id = p_message_id;
END;
$$;

-- 7. Criar bucket no Storage (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('whatsapp-media', 'whatsapp-media', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Policy para o bucket de mídia
CREATE POLICY "Users can view whatsapp media" ON storage.objects
  FOR SELECT USING (bucket_id = 'whatsapp-media');

CREATE POLICY "Users can upload whatsapp media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'whatsapp-media');

-- ====================================================================
-- INSTRUÇÕES:
-- 1. Copie todo este SQL
-- 2. Execute no Editor SQL do Supabase
-- 3. Verifique se a tabela foi criada com: SELECT * FROM media_cache LIMIT 1;
-- 4. Verifique se o bucket foi criado: SELECT * FROM storage.buckets WHERE id = 'whatsapp-media';
-- ==================================================================== 