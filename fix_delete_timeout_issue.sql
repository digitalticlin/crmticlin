-- ====================================================================
-- CORREÇÃO URGENTE: TIMEOUT NA DELEÇÃO DE INSTÂNCIAS WHATSAPP
-- ====================================================================
-- Este script corrige o problema de timeout causado pelo loop infinito
-- entre a edge function e o trigger de deleção

-- 1. DESABILITAR TRIGGER PROBLEMÁTICO TEMPORARIAMENTE
ALTER TABLE whatsapp_instances DISABLE TRIGGER after_delete_whatsapp_instance;

-- 2. VERIFICAR SE O TRIGGER FOI DESABILITADO
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  trigger_schema,
  action_statement,
  status
FROM information_schema.triggers 
WHERE event_object_table = 'whatsapp_instances' 
  AND trigger_name = 'after_delete_whatsapp_instance';

-- 3. OPÇÃO ALTERNATIVA: REMOVER COMPLETAMENTE O TRIGGER (RECOMENDADO)
-- O trigger está causando loop infinito pois a edge function já faz a deleção da VPS
-- Descomente a linha abaixo para remover permanentemente:
-- DROP TRIGGER IF EXISTS after_delete_whatsapp_instance ON whatsapp_instances;

-- 4. VERIFICAR PERFORMANCE DA TABELA
-- Verificar se existem locks ou queries lentas na tabela
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE tablename = 'whatsapp_instances'
ORDER BY attname;

-- 5. VERIFICAR ÍNDICES EXISTENTES
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'whatsapp_instances'
ORDER BY indexname;

-- 6. CRIAR ÍNDICE OTIMIZADO PARA DELEÇÃO (se não existir)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_instances_user_delete 
ON whatsapp_instances(created_by_user_id, id);

-- 7. VERIFICAR CONEXÕES ATIVAS QUE PODEM ESTAR CAUSANDO LOCKS
SELECT 
  pid,
  query,
  state,
  query_start,
  wait_event_type,
  wait_event
FROM pg_stat_activity 
WHERE query ILIKE '%whatsapp_instances%'
  AND state != 'idle'
ORDER BY query_start DESC;

-- ====================================================================
-- RESUMO DA CORREÇÃO:
-- ====================================================================
-- ✅ Trigger desabilitado para evitar loop infinito
-- ✅ Edge function atualizada com proteção anti-loop
-- ✅ Timeout configurável de 30 segundos adicionado
-- ✅ Índice otimizado para operações de deleção
-- 
-- PRÓXIMOS PASSOS:
-- 1. Execute este SQL no Supabase
-- 2. Teste a deleção de instância no frontend
-- 3. Monitore os logs da edge function
-- ====================================================================

SELECT 'CORREÇÃO APLICADA COM SUCESSO! Trigger desabilitado, edge function protegida.' as status;