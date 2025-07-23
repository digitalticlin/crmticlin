-- Adicionar coluna external_message_id se não existir
ALTER TABLE media_cache 
ADD COLUMN IF NOT EXISTS external_message_id TEXT;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_media_cache_external_message_id 
ON media_cache(external_message_id);

CREATE INDEX IF NOT EXISTS idx_media_cache_message_id 
ON media_cache(message_id);

CREATE INDEX IF NOT EXISTS idx_media_cache_media_type 
ON media_cache(media_type);

-- Atualizar registros existentes baseado no nome do arquivo
UPDATE media_cache 
SET external_message_id = 
  CASE 
    WHEN original_url ~ '[A-F0-9]{16,}' THEN 
      (regexp_matches(original_url, '([A-F0-9]{16,})', 'g'))[1]
    ELSE NULL
  END
WHERE external_message_id IS NULL 
  AND original_url IS NOT NULL;
