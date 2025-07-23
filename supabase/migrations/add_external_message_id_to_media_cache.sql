-- ✅ MIGRATION: Adicionar external_message_id na tabela media_cache
-- Para permitir que o agente de IA encontre mídia por external_message_id

-- 1. Adicionar nova coluna
ALTER TABLE media_cache 
ADD COLUMN IF NOT EXISTS external_message_id TEXT;

-- 2. Comentário explicativo
COMMENT ON COLUMN media_cache.external_message_id IS 'External message ID para busca direta pelo agente de IA';

-- 3. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_media_cache_external_message_id 
ON media_cache(external_message_id);

-- 4. Também criar índices que faltavam
CREATE INDEX IF NOT EXISTS idx_media_cache_message_id 
ON media_cache(message_id);

CREATE INDEX IF NOT EXISTS idx_media_cache_media_type 
ON media_cache(media_type);

-- 5. Atualizar registros existentes baseado no nome do arquivo
UPDATE media_cache 
SET external_message_id = 
  CASE 
    WHEN original_url ~ '[A-F0-9]{16,}' THEN 
      (regexp_matches(original_url, '([A-F0-9]{16,})', 'g'))[1]
    ELSE NULL
  END
WHERE external_message_id IS NULL 
  AND original_url IS NOT NULL;

-- 6. Verificar resultados
SELECT 
  'ATUALIZADOS' as status,
  COUNT(*) as quantidade,
  media_type
FROM media_cache 
WHERE external_message_id IS NOT NULL
GROUP BY media_type

UNION ALL

SELECT 
  'SEM_EXTERNAL_ID' as status,
  COUNT(*) as quantidade,
  media_type
FROM media_cache 
WHERE external_message_id IS NULL
GROUP BY media_type

ORDER BY status, media_type; 