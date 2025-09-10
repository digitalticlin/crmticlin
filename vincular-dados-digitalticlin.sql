-- ========================================
-- SCRIPT: Vinculação de Dados Órfãos - digitalticlin
-- ========================================
-- Usuário: digitalticlin@gmail.com (712e7708-2299-4a00-9128-577c8f113ca4)
-- Instância: digitalticlin (1c55e683-60ec-4a68-a672-fd2b28303e0e)
-- 
-- DADOS ÓRFÃOS ENCONTRADOS:
-- - 175 leads órfãos (118 telefones únicos = 57 duplicações)
-- - 5.152 mensagens órfãs
-- ========================================

-- VERIFICAÇÃO ANTES DA EXECUÇÃO
SELECT 'ESTADO ANTES:' as info;
SELECT 
  COUNT(*) as total_leads_orfaos,
  COUNT(CASE WHEN whatsapp_number_id IS NULL THEN 1 END) as leads_sem_whatsapp_id
FROM leads 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4';

SELECT 
  COUNT(*) as total_mensagens_orfaos,
  COUNT(CASE WHEN whatsapp_number_id IS NULL THEN 1 END) as mensagens_sem_whatsapp_id
FROM messages 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4';

-- ========================================
-- ETAPA 1: VINCULAR LEADS ÓRFÃOS
-- ========================================
UPDATE leads 
SET whatsapp_number_id = '1c55e683-60ec-4a68-a672-fd2b28303e0e'
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'
  AND whatsapp_number_id IS NULL;

-- ========================================
-- ETAPA 2: VINCULAR MENSAGENS ÓRFÃS
-- ========================================
UPDATE messages 
SET whatsapp_number_id = '1c55e683-60ec-4a68-a672-fd2b28303e0e'
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'
  AND whatsapp_number_id IS NULL;

-- ========================================
-- ETAPA 3: REMOVER DUPLICAÇÕES DE LEADS
-- ========================================
-- Manter apenas o lead mais recente para cada telefone único

-- Primeiro, transferir mensagens dos leads duplicados para o lead principal
WITH leads_duplicados AS (
  SELECT phone, 
         ARRAY_AGG(id ORDER BY created_at DESC) as lead_ids,
         COUNT(*) as total
  FROM leads 
  WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'
    AND whatsapp_number_id = '1c55e683-60ec-4a68-a672-fd2b28303e0e'
  GROUP BY phone
  HAVING COUNT(*) > 1
)
UPDATE messages 
SET lead_id = (
  SELECT lead_ids[1] 
  FROM leads_duplicados 
  WHERE phone = (SELECT phone FROM leads WHERE id = messages.lead_id)
)
WHERE lead_id IN (
  SELECT UNNEST(lead_ids[2:]) 
  FROM leads_duplicados
);

-- Depois, deletar os leads duplicados
WITH leads_duplicados AS (
  SELECT phone, 
         ARRAY_AGG(id ORDER BY created_at DESC) as lead_ids,
         COUNT(*) as total
  FROM leads 
  WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'
    AND whatsapp_number_id = '1c55e683-60ec-4a68-a672-fd2b28303e0e'
  GROUP BY phone
  HAVING COUNT(*) > 1
)
DELETE FROM leads 
WHERE id IN (
  SELECT UNNEST(lead_ids[2:]) 
  FROM leads_duplicados
);

-- ========================================
-- VERIFICAÇÃO APÓS EXECUÇÃO
-- ========================================
SELECT 'ESTADO APÓS:' as info;
SELECT 
  COUNT(*) as total_leads,
  COUNT(CASE WHEN whatsapp_number_id IS NULL THEN 1 END) as leads_sem_whatsapp_id,
  COUNT(CASE WHEN whatsapp_number_id = '1c55e683-60ec-4a68-a672-fd2b28303e0e' THEN 1 END) as leads_vinculados_digitalticlin
FROM leads 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4';

SELECT 
  COUNT(*) as total_mensagens,
  COUNT(CASE WHEN whatsapp_number_id IS NULL THEN 1 END) as mensagens_sem_whatsapp_id,
  COUNT(CASE WHEN whatsapp_number_id = '1c55e683-60ec-4a68-a672-fd2b28303e0e' THEN 1 END) as mensagens_vinculadas_digitalticlin
FROM messages 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4';

-- Verificar duplicações restantes
SELECT phone, COUNT(*) as quantidade
FROM leads 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'
GROUP BY phone
HAVING COUNT(*) > 1
ORDER BY quantidade DESC; 