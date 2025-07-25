-- Migração para corrigir mensagens com mídia não detectada
-- Data: 2025-01-28
-- Objetivo: Atualizar mensagens que têm media_cache mas não têm media_type preenchido

-- 1. Atualizar mensagens existentes que têm cache de mídia mas sem media_type
UPDATE messages 
SET 
  media_type = CASE 
    WHEN mc.original_url LIKE '%.jpg%' OR mc.original_url LIKE '%.jpeg%' OR mc.original_url LIKE '%.png%' OR mc.original_url LIKE '%.gif%' OR mc.original_url LIKE '%.webp%' THEN 'image'
    WHEN mc.original_url LIKE '%.mp4%' OR mc.original_url LIKE '%.avi%' OR mc.original_url LIKE '%.mov%' OR mc.original_url LIKE '%.webm%' THEN 'video'
    WHEN mc.original_url LIKE '%.mp3%' OR mc.original_url LIKE '%.wav%' OR mc.original_url LIKE '%.ogg%' OR mc.original_url LIKE '%.m4a%' THEN 'audio'
    WHEN mc.original_url LIKE '%.pdf%' OR mc.original_url LIKE '%.doc%' OR mc.original_url LIKE '%.docx%' THEN 'document'
    ELSE 'file'
  END,
  media_url = COALESCE(mc.cached_url, mc.original_url)
FROM media_cache mc
WHERE mc.message_id = messages.id 
  AND (messages.media_type IS NULL OR messages.media_type = '')
  AND mc.original_url IS NOT NULL;

-- 2. Verificar resultados da atualização
SELECT 
  COUNT(*) as mensagens_atualizadas,
  COUNT(CASE WHEN media_type = 'image' THEN 1 END) as imagens,
  COUNT(CASE WHEN media_type = 'video' THEN 1 END) as videos,
  COUNT(CASE WHEN media_type = 'audio' THEN 1 END) as audios,
  COUNT(CASE WHEN media_type = 'document' THEN 1 END) as documentos,
  COUNT(CASE WHEN media_type = 'file' THEN 1 END) as outros_arquivos
FROM messages 
WHERE media_type IS NOT NULL AND media_type != '';

-- 3. Criar função melhorada para salvar mensagens com mídia
CREATE OR REPLACE FUNCTION save_whatsapp_message_service_role_v2(
  p_external_message_id TEXT,
  p_contact_id UUID,
  p_text TEXT,
  p_from_me BOOLEAN,
  p_timestamp TIMESTAMPTZ,
  p_media_type TEXT DEFAULT NULL,
  p_media_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
  v_existing_cache_record RECORD;
BEGIN
  -- Inserir mensagem
  INSERT INTO messages (
    external_message_id,
    contact_id,
    text,
    from_me,
    timestamp,
    media_type,
    media_url
  ) VALUES (
    p_external_message_id,
    p_contact_id,
    p_text,
    p_from_me,
    p_timestamp,
    p_media_type,
    p_media_url
  ) RETURNING id INTO v_message_id;

  -- Se não foi fornecido media_type, verificar se há cache de mídia e atualizar
  IF (p_media_type IS NULL OR p_media_type = '') THEN
    SELECT * INTO v_existing_cache_record
    FROM media_cache 
    WHERE message_id = v_message_id
    LIMIT 1;
    
    IF FOUND THEN
      UPDATE messages 
      SET 
        media_type = CASE 
          WHEN v_existing_cache_record.original_url LIKE '%.jpg%' OR v_existing_cache_record.original_url LIKE '%.jpeg%' OR v_existing_cache_record.original_url LIKE '%.png%' OR v_existing_cache_record.original_url LIKE '%.gif%' OR v_existing_cache_record.original_url LIKE '%.webp%' THEN 'image'
          WHEN v_existing_cache_record.original_url LIKE '%.mp4%' OR v_existing_cache_record.original_url LIKE '%.avi%' OR v_existing_cache_record.original_url LIKE '%.mov%' OR v_existing_cache_record.original_url LIKE '%.webm%' THEN 'video'
          WHEN v_existing_cache_record.original_url LIKE '%.mp3%' OR v_existing_cache_record.original_url LIKE '%.wav%' OR v_existing_cache_record.original_url LIKE '%.ogg%' OR v_existing_cache_record.original_url LIKE '%.m4a%' THEN 'audio'
          WHEN v_existing_cache_record.original_url LIKE '%.pdf%' OR v_existing_cache_record.original_url LIKE '%.doc%' OR v_existing_cache_record.original_url LIKE '%.docx%' THEN 'document'
          ELSE 'file'
        END,
        media_url = COALESCE(v_existing_cache_record.cached_url, v_existing_cache_record.original_url)
      WHERE id = v_message_id;
    END IF;
  END IF;

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar trigger para auto-atualizar mensagens quando media_cache é inserido
CREATE OR REPLACE FUNCTION update_message_media_on_cache_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar a mensagem correspondente com informações de mídia
  UPDATE messages 
  SET 
    media_type = CASE 
      WHEN NEW.original_url LIKE '%.jpg%' OR NEW.original_url LIKE '%.jpeg%' OR NEW.original_url LIKE '%.png%' OR NEW.original_url LIKE '%.gif%' OR NEW.original_url LIKE '%.webp%' THEN 'image'
      WHEN NEW.original_url LIKE '%.mp4%' OR NEW.original_url LIKE '%.avi%' OR NEW.original_url LIKE '%.mov%' OR NEW.original_url LIKE '%.webm%' THEN 'video'
      WHEN NEW.original_url LIKE '%.mp3%' OR NEW.original_url LIKE '%.wav%' OR NEW.original_url LIKE '%.ogg%' OR NEW.original_url LIKE '%.m4a%' THEN 'audio'
      WHEN NEW.original_url LIKE '%.pdf%' OR NEW.original_url LIKE '%.doc%' OR NEW.original_url LIKE '%.docx%' THEN 'document'
      ELSE 'file'
    END,
    media_url = COALESCE(NEW.cached_url, NEW.original_url)
  WHERE id = NEW.message_id 
    AND (media_type IS NULL OR media_type = '');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_update_message_media ON media_cache;
CREATE TRIGGER trigger_update_message_media
  AFTER INSERT ON media_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_message_media_on_cache_insert(); 