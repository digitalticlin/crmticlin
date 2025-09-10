-- 🔍 DEBUG RLS MULTITENANT - Verificar políticas atuais
-- Execute este script no Supabase SQL Editor

-- ========================================
-- 1. VERIFICAR POLÍTICAS RLS EXISTENTES
-- ========================================

SELECT '=== POLÍTICAS RLS ATUAIS ===' as info;

-- Ver todas as políticas da tabela leads
SELECT 
  schemaname,
  tablename, 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'leads'
ORDER BY policyname;

-- Ver se RLS está ativado na tabela
SELECT '=== STATUS RLS ===' as info;
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'leads';

-- ========================================
-- 2. TESTAR ACESSO DO ADMIN ATUAL
-- ========================================

SELECT '=== TESTE ACESSO ADMIN ===' as info;

-- Ver profile do admin
SELECT 
  'PROFILE ADMIN:' as tipo,
  id, 
  email, 
  full_name,
  role,
  auth_user_id,
  created_by_user_id
FROM profiles 
WHERE id = '7c197601-01cc-4f71-a4d8-7c1357cac113';

-- Ver leads que DEVERIAM aparecer para este admin
SELECT 
  'LEADS ADMIN (SEM RLS):' as tipo,
  COUNT(*) as total_leads
FROM leads 
WHERE created_by_user_id = '7c197601-01cc-4f71-a4d8-7c1357cac113';

-- Ver alguns leads de exemplo
SELECT 
  'SAMPLE LEADS:' as tipo,
  id,
  name,
  created_by_user_id,
  funnel_id,
  kanban_stage_id,
  conversation_status
FROM leads 
WHERE created_by_user_id = '7c197601-01cc-4f71-a4d8-7c1357cac113'
LIMIT 3;

-- ========================================
-- 3. VERIFICAR LIGAÇÃO AUTH
-- ========================================

SELECT '=== VERIFICAÇÃO AUTH LINKAGE ===' as info;

-- Verificar se auth.uid() está funcionando corretamente
-- (Isto só funciona quando executado com o contexto do usuário autenticado)
SELECT 
  'AUTH CONTEXT:' as tipo,
  current_user,
  session_user;

-- Verificar outras tabelas multitenant
SELECT '=== OUTRAS TABELAS MULTITENANT ===' as info;

-- Funis do admin
SELECT 
  'FUNNELS ADMIN:' as tipo,
  COUNT(*) as total_funnels
FROM funnels 
WHERE created_by_user_id = '7c197601-01cc-4f71-a4d8-7c1357cac113';

-- WhatsApp instances do admin
SELECT 
  'WHATSAPP INSTANCES:' as tipo,
  COUNT(*) as total_instances
FROM whatsapp_instances 
WHERE created_by_user_id = '7c197601-01cc-4f71-a4d8-7c1357cac113';