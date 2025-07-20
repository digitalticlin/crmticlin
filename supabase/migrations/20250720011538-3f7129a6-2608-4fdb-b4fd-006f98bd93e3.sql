
-- ========================================
-- SCRIPT: Limpeza de Leads Inválidos (Grupos e Broadcasts)
-- ========================================
-- OBJETIVO:
-- 1. Identificar e remover leads que são grupos do WhatsApp (@g.us)
-- 2. Identificar e remover leads que são status@broadcast
-- 3. Remover todas as mensagens associadas a esses leads
-- 4. Manter apenas leads de contatos diretos/reais
-- ========================================

-- VERIFICAÇÃO ANTES DA EXECUÇÃO
SELECT 'ESTADO ANTES:' as info;

-- Verificar leads com grupos (@g.us)
SELECT 
  'Leads com grupos (@g.us):' as tipo,
  COUNT(*) as quantidade
FROM leads 
WHERE phone LIKE '%@g.us%' OR phone LIKE '%g.us%';

-- Verificar leads com broadcast
SELECT 
  'Leads com broadcast:' as tipo,
  COUNT(*) as quantidade
FROM leads 
WHERE phone LIKE '%status@broadcast%' OR phone LIKE '%broadcast%';

-- Verificar mensagens vinculadas a esses leads inválidos
SELECT 
  'Mensagens de leads inválidos:' as tipo,
  COUNT(*) as quantidade
FROM messages m
JOIN leads l ON m.lead_id = l.id
WHERE l.phone LIKE '%@g.us%' 
   OR l.phone LIKE '%g.us%'
   OR l.phone LIKE '%status@broadcast%' 
   OR l.phone LIKE '%broadcast%';

-- Total geral antes
SELECT 
  'Total leads antes:' as tipo,
  COUNT(*) as quantidade
FROM leads;

SELECT 
  'Total mensagens antes:' as tipo,
  COUNT(*) as quantidade
FROM messages;

-- ========================================
-- FASE 1: REMOVER MENSAGENS DOS LEADS INVÁLIDOS
-- ========================================
-- Primeiro removemos as mensagens para evitar violação de foreign key

DELETE FROM messages 
WHERE lead_id IN (
  SELECT id 
  FROM leads 
  WHERE phone LIKE '%@g.us%' 
     OR phone LIKE '%g.us%'
     OR phone LIKE '%status@broadcast%' 
     OR phone LIKE '%broadcast%'
);

-- ========================================
-- FASE 2: REMOVER LEADS INVÁLIDOS
-- ========================================
-- Agora removemos os leads inválidos

DELETE FROM leads 
WHERE phone LIKE '%@g.us%' 
   OR phone LIKE '%g.us%'
   OR phone LIKE '%status@broadcast%' 
   OR phone LIKE '%broadcast%';

-- ========================================
-- VERIFICAÇÃO APÓS EXECUÇÃO
-- ========================================
SELECT 'ESTADO APÓS:' as info;

-- Verificar se ainda existem leads inválidos
SELECT 
  'Leads com grupos restantes:' as tipo,
  COUNT(*) as quantidade
FROM leads 
WHERE phone LIKE '%@g.us%' OR phone LIKE '%g.us%';

SELECT 
  'Leads com broadcast restantes:' as tipo,
  COUNT(*) as quantidade
FROM leads 
WHERE phone LIKE '%status@broadcast%' OR phone LIKE '%broadcast%';

-- Total geral após
SELECT 
  'Total leads após:' as tipo,
  COUNT(*) as quantidade
FROM leads;

SELECT 
  'Total mensagens após:' as tipo,
  COUNT(*) as quantidade
FROM messages;

-- Relatório de leads removidos
SELECT 
  'RESUMO DA LIMPEZA:' as relatorio,
  'Operação concluída - apenas leads diretos mantidos' as status;

-- Verificar alguns exemplos de leads válidos restantes
SELECT 
  'AMOSTRA DE LEADS VÁLIDOS:' as info,
  phone,
  name,
  created_at
FROM leads 
WHERE phone NOT LIKE '%@g.us%' 
  AND phone NOT LIKE '%g.us%'
  AND phone NOT LIKE '%status@broadcast%' 
  AND phone NOT LIKE '%broadcast%'
ORDER BY created_at DESC
LIMIT 5;
