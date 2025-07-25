-- Migração para corrigir o salvamento de mensagens com mídia
-- Data: 2024-01-27

-- Atualizar a função para salvar media_type e media_url corretamente
CREATE OR REPLACE FUNCTION save_whatsapp_message_service_role(
  p_external_message_id TEXT,
  p_whatsapp_number TEXT,
  p_text TEXT,
  p_from_me BOOLEAN,
  p_timestamp TIMESTAMPTZ,
  p_media_type TEXT DEFAULT NULL,
  p_media_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
  v_contact_id UUID;
BEGIN
  -- Buscar ou criar contato
  SELECT id INTO v_contact_id
  FROM contacts
  WHERE whatsapp_number = p_whatsapp_number;
  
  IF v_contact_id IS NULL THEN
    INSERT INTO contacts (whatsapp_number, name, created_at)
    VALUES (p_whatsapp_number, p_whatsapp_number, NOW())
    RETURNING id INTO v_contact_id;
  END IF;

  -- Verificar se mensagem já existe
  SELECT id INTO v_message_id
  FROM messages
  WHERE external_message_id = p_external_message_id
  AND contact_id = v_contact_id;

  IF v_message_id IS NULL THEN
    -- Inserir nova mensagem com campos de mídia
    INSERT INTO messages (
      external_message_id,
      contact_id,
      text,
      from_me,
      timestamp,
      media_type,
      media_url,
      created_at
    ) VALUES (
      p_external_message_id,
      v_contact_id,
      p_text,
      p_from_me,
      p_timestamp,
      p_media_type,
      p_media_url,
      NOW()
    ) RETURNING id INTO v_message_id;
  ELSE
    -- Atualizar mensagem existente incluindo campos de mídia
    UPDATE messages
    SET 
      text = p_text,
      from_me = p_from_me,
      timestamp = p_timestamp,
      media_type = COALESCE(p_media_type, media_type),
      media_url = COALESCE(p_media_url, media_url),
      updated_at = NOW()
    WHERE id = v_message_id;
  END IF;

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar mensagens existentes que têm media_cache mas não têm media_type
UPDATE messages 
SET 
  media_type = CASE 
    WHEN mc.original_url LIKE '%.jpg%' OR mc.original_url LIKE '%.jpeg%' OR mc.original_url LIKE '%.png%' OR mc.original_url LIKE '%.gif%' THEN 'image'
    WHEN mc.original_url LIKE '%.mp4%' OR mc.original_url LIKE '%.mov%' OR mc.original_url LIKE '%.avi%' THEN 'video'
    WHEN mc.original_url LIKE '%.mp3%' OR mc.original_url LIKE '%.wav%' OR mc.original_url LIKE '%.ogg%' THEN 'audio'
    WHEN mc.original_url LIKE '%.pdf%' OR mc.original_url LIKE '%.doc%' OR mc.original_url LIKE '%.docx%' THEN 'document'
    ELSE 'media'
  END,
  media_url = COALESCE(mc.cached_url, mc.original_url)
FROM media_cache mc
WHERE mc.message_id = messages.id
  AND messages.media_type IS NULL
  AND mc.original_url IS NOT NULL; 