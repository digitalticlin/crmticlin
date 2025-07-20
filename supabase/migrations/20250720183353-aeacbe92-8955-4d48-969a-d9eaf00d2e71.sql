
-- Desativar temporariamente RLS para teste de inserção
-- ATENÇÃO: Isso é apenas para diagnóstico - não deixar em produção!

-- Desativar RLS na tabela messages
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Desativar RLS na tabela leads  
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;

-- Log para confirmar que RLS foi desabilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE tablename IN ('messages', 'leads') 
  AND schemaname = 'public';
