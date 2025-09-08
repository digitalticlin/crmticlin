-- 🔐 DEBUG: Verificar políticas RLS da tabela leads

-- 1. Ver todas as políticas ativas na tabela leads
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
WHERE schemaname = 'public' AND tablename = 'leads';

-- 2. Verificar se RLS está ativado
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'leads';

