-- ✅ REMOVER TRIGGER QUE ATUALIZA LEADS EXISTENTES
-- Este script remove o trigger que causa conflitos ao criar vínculos WhatsApp/Funil
-- Mantém apenas a atribuição de novos leads (não retroativa)

-- 1. Remover trigger que atualiza leads existentes quando vínculos são criados
DROP TRIGGER IF EXISTS trigger_update_leads_owner_on_instance_change ON public.user_whatsapp_numbers;
DROP FUNCTION IF EXISTS public.update_leads_owner_on_instance_change();

-- 2. Remover trigger similar para funis (se existir)
DROP TRIGGER IF EXISTS trigger_update_leads_owner_on_funnel_change ON public.user_funnels;
DROP FUNCTION IF EXISTS public.update_leads_owner_on_funnel_change();

-- 3. Remover qualquer outro trigger relacionado a atualização retroativa
DROP TRIGGER IF EXISTS trigger_update_leads_owner_on_assignment_change ON public.user_whatsapp_numbers;
DROP TRIGGER IF EXISTS trigger_update_leads_owner_on_assignment_change ON public.user_funnels;
DROP FUNCTION IF EXISTS public.update_leads_owner_on_assignment_change();

-- 4. Verificar se as funções de criação de leads continuam funcionando
-- (Estas devem ser mantidas para atribuir NOVOS leads corretamente)
SELECT 
    routine_name,
    routine_type,
    routine_definition LIKE '%owner_id%' as usa_owner_id
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%save_whatsapp_message%'
ORDER BY routine_name;

-- 5. Listar triggers restantes (para verificação)
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    t.tgname as trigger_name,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND t.tgisinternal = false
AND (t.tgname LIKE '%owner%' OR pg_get_triggerdef(t.oid) LIKE '%owner_id%')
ORDER BY c.relname, t.tgname;

-- ✅ RESULTADO ESPERADO:
-- - Triggers retroativos removidos ✅
-- - Funções de save_whatsapp_message mantidas ✅ 
-- - Novos leads serão atribuídos corretamente ✅
-- - Leads antigos permanecem com admin (não alterados) ✅

-- 🎯 NOVA LÓGICA:
-- 1. Admin cria membro operacional
-- 2. Vincula WhatsApp/Funil ao operacional  
-- 3. NOVOS leads que chegarem serão do operacional
-- 4. Leads ANTIGOS permanecem do admin
-- 5. Sem conflitos de foreign key! ✅

COMMIT;