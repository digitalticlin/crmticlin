
-- ========================================
-- SCRIPT: Limpeza e Organização de Leads - contatoluizantoniooliveira@gmail.com
-- ========================================
-- Usuário: contatoluizantoniooliveira@gmail.com (9936ae64-b78c-48fe-97e8-bf67623349c6)
-- Instância: d4752160-37c3-4243-887a-5419465d0cd3
-- 
-- OBJETIVO:
-- 1. Remover leads duplicados (mesmo phone) mantendo o mais recente
-- 2. Transferir mensagens dos leads duplicados para o lead principal
-- 3. Colocar todos os leads na etapa "Entrada de Leads"
-- 4. Vincular todos os leads à instância WhatsApp especificada
-- ========================================

-- VERIFICAÇÃO ANTES DA EXECUÇÃO
SELECT 'ESTADO ANTES:' as info;
SELECT 
  COUNT(*) as total_leads,
  COUNT(DISTINCT phone) as telefones_unicos,
  COUNT(*) - COUNT(DISTINCT phone) as leads_duplicados
FROM leads 
WHERE created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6';

SELECT 
  COUNT(*) as total_mensagens,
  COUNT(CASE WHEN lead_id IS NULL THEN 1 END) as mensagens_sem_lead
FROM messages 
WHERE created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6';

-- ========================================
-- FASE 1: TRANSFERIR MENSAGENS DOS LEADS DUPLICADOS
-- ========================================
-- Para cada telefone com múltiplos leads, transferir todas as mensagens
-- dos leads duplicados para o lead mais recente (que será mantido)

WITH leads_duplicados AS (
  SELECT 
    phone,
    ARRAY_AGG(id ORDER BY created_at DESC) as lead_ids,
    COUNT(*) as total_duplicados
  FROM leads 
  WHERE created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'
  GROUP BY phone
  HAVING COUNT(*) > 1
),
mensagens_para_transferir AS (
  SELECT 
    m.id as message_id,
    ld.lead_ids[1] as novo_lead_id,
    m.lead_id as lead_id_antigo
  FROM messages m
  JOIN leads l ON m.lead_id = l.id
  JOIN leads_duplicados ld ON l.phone = ld.phone
  WHERE m.created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'
    AND m.lead_id != ld.lead_ids[1] -- Não transferir mensagens do lead principal
)
UPDATE messages 
SET 
  lead_id = (SELECT novo_lead_id FROM mensagens_para_transferir WHERE message_id = messages.id),
  whatsapp_number_id = 'd4752160-37c3-4243-887a-5419465d0cd3',
  updated_at = NOW()
FROM mensagens_para_transferir
WHERE messages.id = mensagens_para_transferir.message_id;

-- ========================================
-- FASE 2: REMOVER LEADS DUPLICADOS
-- ========================================
-- Agora que todas as mensagens foram transferidas, podemos remover os leads duplicados
-- mantendo apenas o mais recente de cada telefone

WITH leads_duplicados AS (
  SELECT 
    phone,
    ARRAY_AGG(id ORDER BY created_at DESC) as lead_ids,
    COUNT(*) as total_duplicados
  FROM leads 
  WHERE created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'
  GROUP BY phone
  HAVING COUNT(*) > 1
)
DELETE FROM leads 
WHERE id IN (
  SELECT UNNEST(lead_ids[2:]) -- Remove todos exceto o primeiro (mais recente)
  FROM leads_duplicados
);

-- ========================================
-- FASE 3: ORGANIZAR LEADS - ETAPA E INSTÂNCIA
-- ========================================
-- Atualizar todos os leads restantes para:
-- 1. Etapa "Entrada de Leads" (a614e510-51e5-495a-b361-0c43a2e171dd)
-- 2. Instância WhatsApp (d4752160-37c3-4243-887a-5419465d0cd3)

UPDATE leads 
SET 
  kanban_stage_id = 'a614e510-51e5-495a-b361-0c43a2e171dd',
  whatsapp_number_id = 'd4752160-37c3-4243-887a-5419465d0cd3',
  updated_at = NOW()
WHERE created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6';

-- ========================================
-- FASE 4: ATUALIZAR MENSAGENS ÓRFÃS
-- ========================================
-- Garantir que todas as mensagens do usuário estejam vinculadas à instância correta

UPDATE messages 
SET 
  whatsapp_number_id = 'd4752160-37c3-4243-887a-5419465d0cd3',
  updated_at = NOW()
WHERE created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'
  AND (whatsapp_number_id IS NULL OR whatsapp_number_id != 'd4752160-37c3-4243-887a-5419465d0cd3');

-- ========================================
-- VERIFICAÇÃO APÓS EXECUÇÃO
-- ========================================
SELECT 'ESTADO APÓS:' as info;

-- Verificar leads
SELECT 
  COUNT(*) as total_leads_final,
  COUNT(DISTINCT phone) as telefones_unicos_final,
  COUNT(*) - COUNT(DISTINCT phone) as duplicados_restantes,
  COUNT(CASE WHEN kanban_stage_id = 'a614e510-51e5-495a-b361-0c43a2e171dd' THEN 1 END) as leads_na_entrada,
  COUNT(CASE WHEN whatsapp_number_id = 'd4752160-37c3-4243-887a-5419465d0cd3' THEN 1 END) as leads_vinculados_instancia
FROM leads 
WHERE created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6';

-- Verificar mensagens
SELECT 
  COUNT(*) as total_mensagens_final,
  COUNT(CASE WHEN lead_id IS NULL THEN 1 END) as mensagens_sem_lead_final,
  COUNT(CASE WHEN whatsapp_number_id = 'd4752160-37c3-4243-887a-5419465d0cd3' THEN 1 END) as mensagens_vinculadas_instancia
FROM messages 
WHERE created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6';

-- Verificar se ainda existem duplicações
SELECT 
  phone, 
  COUNT(*) as quantidade_leads
FROM leads 
WHERE created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'
GROUP BY phone
HAVING COUNT(*) > 1
ORDER BY quantidade_leads DESC
LIMIT 10;

-- Relatório final
SELECT 
  'RESUMO FINAL:' as relatorio,
  'Leads únicos por telefone' as descricao,
  COUNT(DISTINCT phone) as valor
FROM leads 
WHERE created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'
UNION ALL
SELECT 
  'RESUMO FINAL:' as relatorio,
  'Total de mensagens preservadas' as descricao,
  COUNT(*) as valor
FROM messages 
WHERE created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'
UNION ALL
SELECT 
  'RESUMO FINAL:' as relatorio,
  'Leads na etapa Entrada de Leads' as descricao,
  COUNT(*) as valor
FROM leads 
WHERE created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'
  AND kanban_stage_id = 'a614e510-51e5-495a-b361-0c43a2e171dd';
