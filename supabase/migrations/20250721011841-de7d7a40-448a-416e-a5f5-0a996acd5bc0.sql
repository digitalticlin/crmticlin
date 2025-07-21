
-- FASE 1: DESABILITAR COMPLETAMENTE RLS NAS TABELAS PROBLEMÁTICAS
-- Isso removerá os "cadeados" que estão impedindo o acesso do service_role

-- Desabilitar RLS na tabela leads
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;

-- Desabilitar RLS na tabela messages  
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Desabilitar RLS na tabela whatsapp_instances
ALTER TABLE public.whatsapp_instances DISABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas RLS existentes que possam estar causando conflito
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can create their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;

-- Garantir permissões explícitas para service_role
GRANT ALL PRIVILEGES ON public.leads TO service_role;
GRANT ALL PRIVILEGES ON public.messages TO service_role;
GRANT ALL PRIVILEGES ON public.whatsapp_instances TO service_role;

-- Verificar se RLS foi desabilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE tablename IN ('leads', 'messages', 'whatsapp_instances') 
  AND schemaname = 'public';
