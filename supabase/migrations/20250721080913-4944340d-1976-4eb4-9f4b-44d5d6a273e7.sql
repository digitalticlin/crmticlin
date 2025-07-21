
-- Migração das last_message dos leads para a tabela messages
-- Evita duplicações verificando se o lead já tem mensagens

INSERT INTO messages (
  lead_id,
  whatsapp_number_id,
  created_by_user_id,
  text,
  timestamp,
  from_me,
  status,
  media_type,
  import_source,
  created_at
)
SELECT 
  l.id as lead_id,
  l.whatsapp_number_id,
  l.created_by_user_id,
  l.last_message as text,
  COALESCE(l.last_message_time, l.created_at) as timestamp,
  false as from_me,
  'received'::message_status as status,
  CASE 
    WHEN l.last_message LIKE '[Áudio]%' OR l.last_message LIKE '%[Áudio]%' THEN 'audio'::media_type
    WHEN l.last_message LIKE '[Sticker]%' OR l.last_message LIKE '%[Sticker]%' THEN 'sticker'::media_type
    WHEN l.last_message LIKE '[Imagem]%' OR l.last_message LIKE '%[Imagem]%' THEN 'image'::media_type
    WHEN l.last_message LIKE '[Vídeo]%' OR l.last_message LIKE '%[Vídeo]%' THEN 'video'::media_type
    WHEN l.last_message LIKE '[Documento]%' OR l.last_message LIKE '%[Documento]%' THEN 'document'::media_type
    WHEN l.last_message LIKE '[Mensagem não suportada]%' THEN 'text'::media_type
    ELSE 'text'::media_type
  END as media_type,
  'migration' as import_source,
  NOW() as created_at
FROM leads l
LEFT JOIN messages m ON l.id = m.lead_id
WHERE l.last_message IS NOT NULL 
  AND l.last_message != ''
  AND l.last_message != 'Conversa iniciada'
  AND m.id IS NULL;

-- Verificar quantas mensagens foram inseridas
SELECT COUNT(*) as mensagens_migradas FROM messages WHERE import_source = 'migration';

-- Verificar se todos os leads com last_message agora têm mensagens
SELECT 
  COUNT(DISTINCT l.id) as leads_com_last_message,
  COUNT(DISTINCT m.lead_id) as leads_com_mensagens
FROM leads l
LEFT JOIN messages m ON l.id = m.lead_id
WHERE l.last_message IS NOT NULL 
  AND l.last_message != ''
  AND l.last_message != 'Conversa iniciada';
