-- =====================================================
-- CORREÇÃO SIMPLES: REMOVER POLÍTICA PROBLEMÁTICA
-- A webhook funciona via RPC com service_role bypass, não precisa da política
-- =====================================================

-- 1. REMOVER A POLÍTICA PROBLEMÁTICA que permite acesso a todos os leads
DROP POLICY IF EXISTS "webhook_leads_access" ON public.leads;

-- 2. MANTER apenas as políticas necessárias para usuários normais
-- As outras políticas já existem e estão corretas:
-- - leads_visibility: admin vê created_by_user_id, operacional vê por WhatsApp
-- - leads_update: mesmo critério
-- - leads_delete: admin pode deletar
-- - service_role_bypass: webhook funciona

-- 3. Verificar se RLS está habilitado
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 4. LOG
DO $$
BEGIN
    RAISE NOTICE '✅ Política problemática removida';
    RAISE NOTICE 'Webhook continua funcionando via RPC com service_role';
    RAISE NOTICE 'Usuários agora verão apenas leads conforme permissão';
END $$;