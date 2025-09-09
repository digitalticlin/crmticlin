-- 🔍 DEBUG: Verificar mensagens from_me no banco
-- Executar no Supabase SQL Editor

-- 1. Contar mensagens por from_me
SELECT 
  from_me,
  COUNT(*) as total,
  COUNT(DISTINCT lead_id) as leads_distintos,
  MIN(created_at) as primeira_mensagem,
  MAX(created_at) as ultima_mensagem
FROM public.messages 
GROUP BY from_me
ORDER BY from_me;

-- 2. Verificar últimas 10 mensagens de cada tipo
SELECT 
  id,
  text,
  from_me,
  lead_id,
  created_at,
  status,
  media_type
FROM public.messages 
WHERE from_me = true
ORDER BY created_at DESC
LIMIT 10;

SELECT 
  id,
  text,
  from_me,
  lead_id,
  created_at,
  status,
  media_type
FROM public.messages 
WHERE from_me = false
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verificar lead específico (substitua o UUID pelo lead atual)
-- SELECT 
--   id,
--   text,
--   from_me,
--   created_at,
--   status
-- FROM public.messages 
-- WHERE lead_id = 'SEU_LEAD_ID_AQUI'
-- ORDER BY created_at ASC;