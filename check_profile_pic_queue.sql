-- 🔍 DIAGNOSTICAR SISTEMA DE PROFILE PIC

-- 1. Verificar se a fila existe e tem mensagens
SELECT 
  'profile_pic_download_queue' as queue_name,
  COUNT(*) as messages_in_queue
FROM pgmq.q_profile_pic_download_queue;

-- 2. Ver mensagens na fila (últimas 10)
SELECT 
  msg_id,
  read_ct,
  enqueued_at,
  vt,
  message
FROM pgmq.q_profile_pic_download_queue 
ORDER BY enqueued_at DESC 
LIMIT 10;

-- 3. Testar processamento manual da fila
SELECT * FROM process_profile_pic_download_queue();

-- 4. Verificar leads sem profile pic
SELECT 
  id,
  name,
  phone,
  profile_pic_url,
  created_at
FROM leads 
WHERE profile_pic_url IS NULL 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Ver últimas mensagens processadas
SELECT 
  lead_id,
  text,
  timestamp,
  import_source
FROM messages 
ORDER BY timestamp DESC 
LIMIT 5;