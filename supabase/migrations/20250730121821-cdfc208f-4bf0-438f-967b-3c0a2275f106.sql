
-- 🔧 CORREÇÃO COMPLETA DO SISTEMA DE MÍDIA

-- 1. Primeiro, vamos corrigir o relacionamento entre media_cache e messages
-- usando external_message_id como chave de ligação
UPDATE media_cache 
SET message_id = m.id
FROM messages m
WHERE media_cache.message_id IS NULL
  AND media_cache.external_message_id IS NOT NULL
  AND m.external_message_id = media_cache.external_message_id;

-- 2. Para registros que não têm external_message_id, tentar por URL
UPDATE media_cache 
SET message_id = m.id
FROM messages m
WHERE media_cache.message_id IS NULL
  AND media_cache.original_url IS NOT NULL
  AND m.media_url = media_cache.original_url
  AND m.media_type != 'text';

-- 3. Criar índices para melhorar performance das consultas de mídia
CREATE INDEX IF NOT EXISTS idx_media_cache_message_id ON media_cache(message_id) WHERE message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_cache_external_message_id ON media_cache(external_message_id) WHERE external_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_external_message_id ON messages(external_message_id) WHERE external_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_media_url ON messages(media_url) WHERE media_url IS NOT NULL;

-- 4. Função para recuperação automática de mídia órfã
CREATE OR REPLACE FUNCTION public.recover_orphaned_media()
RETURNS TABLE(
  recovered_count INTEGER,
  total_orphaned INTEGER,
  recovery_details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recovered INTEGER := 0;
  v_total_orphaned INTEGER := 0;
  v_details JSONB;
BEGIN
  -- Contar mídia órfã
  SELECT COUNT(*) INTO v_total_orphaned
  FROM media_cache mc
  WHERE mc.message_id IS NULL
    AND (mc.external_message_id IS NOT NULL OR mc.original_url IS NOT NULL);
  
  -- Recuperar por external_message_id
  WITH recovery_external AS (
    UPDATE media_cache 
    SET message_id = m.id
    FROM messages m
    WHERE media_cache.message_id IS NULL
      AND media_cache.external_message_id IS NOT NULL
      AND m.external_message_id = media_cache.external_message_id
    RETURNING media_cache.id
  )
  SELECT COUNT(*) INTO v_recovered FROM recovery_external;
  
  -- Recuperar por URL (adicional)
  WITH recovery_url AS (
    UPDATE media_cache 
    SET message_id = m.id
    FROM messages m
    WHERE media_cache.message_id IS NULL
      AND media_cache.original_url IS NOT NULL
      AND m.media_url = media_cache.original_url
      AND m.media_type != 'text'
    RETURNING media_cache.id
  )
  SELECT v_recovered + COUNT(*) INTO v_recovered FROM recovery_url;
  
  -- Criar detalhes do resultado
  v_details := jsonb_build_object(
    'timestamp', now(),
    'method', 'automatic_recovery',
    'success_rate', 
      CASE 
        WHEN v_total_orphaned > 0 THEN ROUND((v_recovered::NUMERIC / v_total_orphaned) * 100, 2)
        ELSE 0
      END
  );
  
  RETURN QUERY SELECT v_recovered, v_total_orphaned, v_details;
END;
$$;

-- 5. Trigger para auto-vincular novas mídias
CREATE OR REPLACE FUNCTION public.auto_link_media_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se inserindo uma nova entrada de cache sem message_id
  IF NEW.message_id IS NULL AND NEW.external_message_id IS NOT NULL THEN
    -- Tentar encontrar mensagem correspondente
    SELECT id INTO NEW.message_id
    FROM messages
    WHERE external_message_id = NEW.external_message_id
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger
DROP TRIGGER IF EXISTS trigger_auto_link_media_cache ON media_cache;
CREATE TRIGGER trigger_auto_link_media_cache
  BEFORE INSERT ON media_cache
  FOR EACH ROW
  EXECUTE FUNCTION auto_link_media_cache();

-- 6. View otimizada para debugging de mídia
CREATE OR REPLACE VIEW public.media_debug_view AS
SELECT 
  m.id as message_id,
  m.text,
  m.media_type,
  m.media_url,
  m.external_message_id,
  m.from_me,
  m.created_at as message_created_at,
  mc.id as cache_id,
  mc.original_url as cache_original_url,
  mc.base64_data IS NOT NULL as has_base64,
  mc.file_size,
  mc.created_at as cache_created_at,
  CASE 
    WHEN mc.id IS NULL THEN 'NO_CACHE'
    WHEN mc.base64_data IS NOT NULL THEN 'CACHED_WITH_BASE64'
    WHEN mc.cached_url IS NOT NULL THEN 'CACHED_URL_ONLY'
    ELSE 'CACHE_INCOMPLETE'
  END as media_status
FROM messages m
LEFT JOIN media_cache mc ON m.id = mc.message_id
WHERE m.media_type != 'text'
ORDER BY m.created_at DESC;

-- 7. Estatísticas de mídia para monitoramento
CREATE OR REPLACE VIEW public.media_stats_view AS
SELECT 
  COUNT(*) as total_media_messages,
  COUNT(mc.id) as messages_with_cache,
  COUNT(mc.base64_data) as messages_with_base64,
  ROUND(AVG(mc.file_size::NUMERIC / 1024), 2) as avg_size_kb,
  COUNT(*) - COUNT(mc.id) as missing_cache_count,
  ROUND(
    (COUNT(mc.id)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2
  ) as cache_coverage_percentage
FROM messages m
LEFT JOIN media_cache mc ON m.id = mc.message_id
WHERE m.media_type != 'text';
