-- =====================================================
-- COMANDOS SQL PARA CORRIGIR TRIGGER DO MEDIA_CACHE
-- Execute um por vez para garantir segurança
-- =====================================================

-- PASSO 1: Remover trigger problemático atual
-- (Execute este primeiro)
DROP TRIGGER IF EXISTS media_conversion_trigger ON media_cache;

-- PASSO 2: Remover função problemática atual
-- (Execute após o passo 1)
DROP FUNCTION IF EXISTS trigger_media_conversion();

-- PASSO 3: Criar nova função corrigida para o trigger
-- (Execute após o passo 2)
CREATE OR REPLACE FUNCTION trigger_media_conversion()
RETURNS TRIGGER AS $$
BEGIN
  -- Só processar se:
  -- - É mídia (não text)
  -- - Não tem base64_data
  -- - Tem original_url válida (Storage ou HTTP)
  IF NEW.media_type != 'text' 
     AND NEW.base64_data IS NULL 
     AND NEW.original_url IS NOT NULL
     AND (NEW.original_url LIKE '%supabase.co/storage%' OR NEW.original_url LIKE 'http%') THEN
    
    -- Log do trigger
    RAISE NOTICE 'Trigger: Mídia % inserida sem base64, agendando conversão', NEW.id;
    
    -- Agendar conversão via HTTP request para a edge function
    -- Usando pg_net para fazer chamada HTTP assíncrona
    PERFORM
      net.http_post(
        url := 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/convert_media_to_base64',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTQ4MTM1OSwiZXhwIjoyMDUxMDU3MzU5fQ.xvJDW0TBf8cEwZB_tOZYKnZWWCOsOGh0n6u6MKJLl8w'
        ),
        body := jsonb_build_object(
          'cache_id', NEW.id,
          'message_id', NEW.message_id,
          'external_message_id', NEW.external_message_id,
          'trigger_source', 'auto_conversion'
        )
      );
    
    RAISE NOTICE 'Trigger: Conversão agendada para mídia % via edge function', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASSO 4: Recriar trigger com função corrigida
-- (Execute após o passo 3)
CREATE TRIGGER media_conversion_trigger
  AFTER INSERT ON media_cache
  FOR EACH ROW
  EXECUTE FUNCTION trigger_media_conversion();

-- PASSO 5: Verificar se trigger foi criado corretamente
-- (Execute para validar)
SELECT 
  t.tgname as trigger_name,
  t.tgenabled as enabled,
  p.proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'media_cache'::regclass;

-- =====================================================
-- COMANDOS PARA PROCESSAR MÍDIAS PENDENTES
-- Execute após corrigir o trigger
-- =====================================================

-- PASSO 6: Inserir mídias que falharam para reprocessar
-- (Execute após trigger estar funcionando)
INSERT INTO media_cache (
  message_id,
  external_message_id,
  original_url,
  file_name,
  file_size,
  media_type,
  created_at
) VALUES 
-- Imagem do teste
(
  'fa98a478-cc6b-4bb5-b9c2-ad473977861c',
  '3F28B1773629F89852A3',
  'https://mmg.whatsapp.net/o1/v/t24/f2/m239/AQPPxUStq17xgiROOZPOYVIfSl1kCUp_KInWAsXJ_NsPpNnsSn-FoX4yxPtntVo2_GdTnOzHdr2B8f1DiKOk7LsGxdBmaqXHhmABGvRXkw?ccb=9-4&oh=01_Q5Aa2AEPzQGzoykWNoUfzl9wBTBOOFugNlgp87tcnbe7GMCL-g&oe=68A85265&_nc_sid=e6ed6c&mms3=true',
  '3F28B1773629F89852A3_image',
  132042,
  'image',
  NOW()
),
-- Vídeo do teste  
(
  '4e86fb02-2daf-40b1-af29-2d54036b29cc',
  '3F526B0A71E135F58CE2',
  'https://mmg.whatsapp.net/v/t62.7161-24/21426985_1162075525727772_5730359658516797203_n.enc?ccb=11-4&oh=01_Q5Aa2AFVTtNIaQjcpLLgT5f33qzIxAmhluZhF4TuqTVvhQVUfQ&oe=68A84838&_nc_sid=5e03e0&mms3=true',
  '3F526B0A71E135F58CE2_video',
  1330634,
  'video',
  NOW()
)
ON CONFLICT (message_id) DO NOTHING
RETURNING id, message_id, external_message_id, media_type;

-- PASSO 7: Verificar se as mídias foram processadas
-- (Execute após alguns segundos do passo 6)
SELECT 
  mc.id,
  mc.message_id,
  mc.external_message_id,
  mc.media_type,
  mc.base64_data IS NOT NULL as has_base64,
  LENGTH(mc.base64_data) as base64_length,
  mc.file_size,
  mc.created_at
FROM media_cache mc
WHERE mc.external_message_id IN ('3F28B1773629F89852A3', '3F526B0A71E135F58CE2')
ORDER BY mc.created_at DESC;

-- =====================================================
-- COMANDOS DE VALIDAÇÃO FINAL
-- =====================================================

-- PASSO 8: Verificar se tudo está funcionando
-- (Execute para validar resultado final)
SELECT 
  'RESUMO FINAL' as status,
  COUNT(*) as total_midias,
  COUNT(CASE WHEN base64_data IS NOT NULL THEN 1 END) as com_base64,
  COUNT(CASE WHEN base64_data IS NULL THEN 1 END) as sem_base64
FROM media_cache
WHERE created_at >= NOW() - INTERVAL '1 hour';

-- PASSO 9: Verificar relação com mensagens
-- (Execute para validar integração)
SELECT 
  m.id as message_id,
  m.external_message_id,
  m.media_type as msg_type,
  m.media_url,
  mc.id as cache_id,
  mc.media_type as cache_type,
  mc.base64_data IS NOT NULL as has_base64
FROM messages m
LEFT JOIN media_cache mc ON (m.id = mc.message_id OR m.external_message_id = mc.external_message_id)
WHERE m.external_message_id IN ('3F28B1773629F89852A3', '3F526B0A71E135F58CE2')
ORDER BY m.created_at DESC; 