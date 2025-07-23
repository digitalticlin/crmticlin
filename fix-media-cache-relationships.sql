-- 🔧 SCRIPT PARA CORRIGIR RELACIONAMENTOS MEDIA_CACHE ↔ MESSAGES
-- Este script vai relacionar mídias existentes com suas mensagens

-- 1. Atualizar media_cache com message_id baseado no external_message_id no nome do arquivo
UPDATE media_cache 
SET message_id = m.id
FROM messages m
WHERE media_cache.message_id IS NULL
  AND media_cache.original_url LIKE '%' || m.external_message_id || '%'
  AND media_cache.media_type = m.media_type;

-- 2. Verificar resultados
SELECT 
  'CORRIGIDOS' as status,
  COUNT(*) as quantidade,
  media_type
FROM media_cache 
WHERE message_id IS NOT NULL
GROUP BY media_type

UNION ALL

SELECT 
  'SEM_RELACIONAMENTO' as status,
  COUNT(*) as quantidade,
  media_type
FROM media_cache 
WHERE message_id IS NULL
GROUP BY media_type

ORDER BY status, media_type;

-- 3. Criar índice para melhorar performance das consultas do agente de IA
CREATE INDEX IF NOT EXISTS idx_media_cache_message_id ON media_cache(message_id);
CREATE INDEX IF NOT EXISTS idx_media_cache_original_url ON media_cache(original_url);
CREATE INDEX IF NOT EXISTS idx_messages_external_message_id ON messages(external_message_id);

-- 4. QUERY OTIMIZADA PARA SEU AGENTE DE IA
-- Seu agente deve usar esta query para encontrar mídia por external_message_id:

/*
-- MÉTODO 1: Busca direta por relacionamento (após correção)
SELECT 
  mc.id as cache_id,
  mc.original_url,
  mc.base64_data,
  mc.file_size,
  mc.media_type,
  'RELACIONAMENTO_DIRETO' as source_method
FROM messages m
JOIN media_cache mc ON m.id = mc.message_id
WHERE m.external_message_id = 'SEU_EXTERNAL_MESSAGE_ID_AQUI'
  AND m.media_type = 'audio';

-- MÉTODO 2: Fallback por nome do arquivo (sempre funciona)
SELECT 
  mc.id as cache_id,
  mc.original_url,
  mc.base64_data,
  mc.file_size,
  mc.media_type,
  'NOME_ARQUIVO' as source_method
FROM media_cache mc
WHERE mc.original_url LIKE '%SEU_EXTERNAL_MESSAGE_ID_AQUI%'
  AND mc.media_type = 'audio'
ORDER BY mc.created_at DESC
LIMIT 1;

-- MÉTODO 3: Combinado (mais robusto)
WITH direct_match AS (
  SELECT 
    mc.id as cache_id,
    mc.original_url,
    mc.base64_data,
    mc.file_size,
    mc.media_type,
    'RELACIONAMENTO_DIRETO' as source_method,
    1 as priority
  FROM messages m
  JOIN media_cache mc ON m.id = mc.message_id
  WHERE m.external_message_id = 'SEU_EXTERNAL_MESSAGE_ID_AQUI'
    AND m.media_type = 'audio'
),
filename_match AS (
  SELECT 
    mc.id as cache_id,
    mc.original_url,
    mc.base64_data,
    mc.file_size,
    mc.media_type,
    'NOME_ARQUIVO' as source_method,
    2 as priority
  FROM media_cache mc
  WHERE mc.original_url LIKE '%SEU_EXTERNAL_MESSAGE_ID_AQUI%'
    AND mc.media_type = 'audio'
  ORDER BY mc.created_at DESC
  LIMIT 1
)
SELECT * FROM direct_match
UNION ALL
SELECT * FROM filename_match
ORDER BY priority
LIMIT 1;
*/ 