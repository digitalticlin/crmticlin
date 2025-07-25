-- Corrigir função para popular campos de mídia corretamente
-- Migration: fix_media_message_fields
-- Date: 2025-01-28

-- Atualizar mensagens existentes que têm media_cache mas não têm media_type
UPDATE messages 
SET 
  media_type = CASE 
    WHEN mc.original_url LIKE '%.jpg%' OR mc.original_url LIKE '%.jpeg%' OR mc.original_url LIKE '%.png%' OR mc.original_url LIKE '%.gif%' THEN 'image'
    WHEN mc.original_url LIKE '%.mp4%' OR mc.original_url LIKE '%.avi%' OR mc.original_url LIKE '%.mov%' THEN 'video'
    WHEN mc.original_url LIKE '%.mp3%' OR mc.original_url LIKE '%.wav%' OR mc.original_url LIKE '%.ogg%' THEN 'audio'
    WHEN mc.original_url LIKE '%.pdf%' OR mc.original_url LIKE '%.doc%' OR mc.original_url LIKE '%.docx%' THEN 'document'
    ELSE 'unknown'
  END,
  media_url = COALESCE(mc.cached_url, mc.original_url)
FROM media_cache mc
WHERE mc.message_id = messages.id 
  AND messages.media_type IS NULL;

-- Recriar a função com correção para popular media_type e media_url
CREATE OR REPLACE FUNCTION save_whatsapp_message_service_role(
  p_external_message_id TEXT,
  p_text TEXT,
  p_timestamp TIMESTAMPTZ,
  p_from_me BOOLEAN,
  p_contact_phone VARCHAR(20),
  p_media_type TEXT DEFAULT NULL,
  p_media_url TEXT DEFAULT NULL,
  p_media_base64 TEXT DEFAULT NULL,
  p_media_filename TEXT DEFAULT NULL,
  p_media_mime_type TEXT DEFAULT NULL,
  p_media_file_size INTEGER DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_message_id UUID;
  v_contact_id UUID;
  v_media_cache_id UUID;
  v_cached_url TEXT;
  v_result JSON;
BEGIN
  -- Buscar ou criar contato
  SELECT id INTO v_contact_id
  FROM contacts 
  WHERE phone = p_contact_phone;
  
  IF v_contact_id IS NULL THEN
    INSERT INTO contacts (phone, name, created_at, updated_at)
    VALUES (p_contact_phone, p_contact_phone, NOW(), NOW())
    RETURNING id INTO v_contact_id;
  END IF;

  -- Gerar ID para a mensagem
  v_message_id := gen_random_uuid();

  -- Determinar media_type se não fornecido mas há mídia
  IF p_media_type IS NULL AND (p_media_url IS NOT NULL OR p_media_base64 IS NOT NULL) THEN
    p_media_type := CASE 
      WHEN p_media_mime_type LIKE 'image/%' THEN 'image'
      WHEN p_media_mime_type LIKE 'video/%' THEN 'video'
      WHEN p_media_mime_type LIKE 'audio/%' THEN 'audio'
      WHEN p_media_mime_type LIKE 'application/pdf%' OR p_media_mime_type LIKE 'application/msword%' THEN 'document'
      WHEN p_media_url LIKE '%.jpg%' OR p_media_url LIKE '%.jpeg%' OR p_media_url LIKE '%.png%' OR p_media_url LIKE '%.gif%' THEN 'image'
      WHEN p_media_url LIKE '%.mp4%' OR p_media_url LIKE '%.avi%' OR p_media_url LIKE '%.mov%' THEN 'video'
      WHEN p_media_url LIKE '%.mp3%' OR p_media_url LIKE '%.wav%' OR p_media_url LIKE '%.ogg%' THEN 'audio'
      ELSE 'unknown'
    END;
  END IF;

  -- Se há mídia, processar cache primeiro
  IF p_media_base64 IS NOT NULL OR p_media_url IS NOT NULL THEN
    INSERT INTO media_cache (
      message_id,
      original_url,
      base64_data,
      filename,
      mime_type,
      file_size,
      created_at
    ) VALUES (
      v_message_id,
      p_media_url,
      p_media_base64,
      p_media_filename,
      p_media_mime_type,
      p_media_file_size,
      NOW()
    ) RETURNING id, cached_url INTO v_media_cache_id, v_cached_url;
    
    -- Usar cached_url se disponível, senão original_url
    IF v_cached_url IS NOT NULL THEN
      p_media_url := v_cached_url;
    END IF;
  END IF;

  -- Inserir mensagem com campos de mídia corretos
  INSERT INTO messages (
    id,
    external_message_id,
    text,
    timestamp,
    from_me,
    contact_id,
    media_type,
    media_url,
    created_at
  ) VALUES (
    v_message_id,
    p_external_message_id,
    p_text,
    p_timestamp,
    p_from_me,
    v_contact_id,
    p_media_type,  -- Agora será preenchido corretamente
    p_media_url,   -- Agora será preenchido corretamente
    NOW()
  );

  -- Retornar resultado
  v_result := json_build_object(
    'message_id', v_message_id,
    'contact_id', v_contact_id,
    'media_cache_id', v_media_cache_id,
    'media_type', p_media_type,
    'media_url', p_media_url,
    'success', true
  );

  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'error_detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 