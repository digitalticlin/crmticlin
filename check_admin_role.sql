-- Verificar roles dos usuários
SELECT
  id,
  email,
  role,
  created_at,
  updated_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- Verificar se há policies ativas bloqueando acesso
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
WHERE tablename IN ('profiles', 'funnels', 'whatsapp_instances', 'leads')
ORDER BY tablename, policyname;

-- Verificar se RLS está habilitado nas tabelas críticas
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('profiles', 'funnels', 'whatsapp_instances', 'leads', 'kanban_stages')
ORDER BY tablename;
