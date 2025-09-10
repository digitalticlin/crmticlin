-- =====================================================
-- CORREÇÃO CRÍTICA: Permissões do service_role
-- =====================================================
-- Problema: A função save_whatsapp_message_service_role 
-- falha porque service_role não tem permissões nas tabelas
-- =====================================================

-- 1. Conceder permissões COMPLETAS ao service_role nas tabelas críticas
GRANT ALL PRIVILEGES ON public.leads TO service_role;
GRANT ALL PRIVILEGES ON public.messages TO service_role;
GRANT ALL PRIVILEGES ON public.whatsapp_instances TO service_role;
GRANT ALL PRIVILEGES ON public.funnels TO service_role;
GRANT ALL PRIVILEGES ON public.kanban_stages TO service_role;

-- 2. Conceder permissões nas sequences (para INSERTs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 3. Conceder permissões para usar os types customizados
GRANT USAGE ON TYPE message_status TO service_role;
GRANT USAGE ON TYPE media_type TO service_role;

-- 4. Garantir que service_role pode executar a função
GRANT EXECUTE ON FUNCTION public.save_whatsapp_message_service_role(text, text, text, boolean, text, text, text, text) TO service_role;

-- 5. Verificar as permissões concedidas
SELECT 
  table_name,
  grantee,
  privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name IN ('leads', 'messages', 'whatsapp_instances', 'funnels', 'kanban_stages')
AND grantee = 'service_role'
ORDER BY table_name, privilege_type;

-- 6. Testar a função após as permissões
SELECT save_whatsapp_message_service_role(
  'digitalticlin'::text,
  '556299212484'::text,
  'Teste após correção de permissões'::text,
  false::boolean,
  'text'::text,
  null::text,
  'test_after_fix'::text,
  'Teste Contato'::text
); 