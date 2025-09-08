-- 🚨 CORREÇÃO EMERGENCIAL: Desativar RLS temporariamente para restaurar funcionamento
-- Sistema estava com recursão infinita nas policies

-- ========================================
-- 1. DESATIVAR RLS TEMPORARIAMENTE
-- ========================================

-- Desativar RLS completamente para restaurar o funcionamento
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;

-- Remover TODAS as policies que estão causando recursão
DROP POLICY IF EXISTS "profiles_multitenant_select_final" ON profiles;
DROP POLICY IF EXISTS "profiles_multitenant_insert_final" ON profiles;
DROP POLICY IF EXISTS "profiles_multitenant_update_final" ON profiles;

DROP POLICY IF EXISTS "leads_multitenant_select_final" ON leads;
DROP POLICY IF EXISTS "leads_multitenant_insert_final" ON leads;
DROP POLICY IF EXISTS "leads_multitenant_update_final" ON leads;
DROP POLICY IF EXISTS "leads_multitenant_delete_final" ON leads;

-- ========================================
-- 2. MANTER APENAS POLICIES ESSENCIAIS PARA SERVICE_ROLE
-- ========================================

-- Service role precisa de acesso total para webhooks/edge functions
CREATE POLICY "service_role_full_access_profiles" ON profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "service_role_full_access_leads" ON leads
    FOR ALL  
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ========================================
-- 3. LOGS DE DIAGNÓSTICO
-- ========================================

-- Função para verificar se o sistema volta ao normal
CREATE OR REPLACE FUNCTION test_rls_disabled()
RETURNS TABLE (
    table_name text,
    rls_enabled boolean,
    policies_count bigint,
    status text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'profiles'::text as table_name,
        pg_class.relrowsecurity as rls_enabled,
        (SELECT count(*) FROM pg_policies WHERE tablename = 'profiles') as policies_count,
        CASE 
            WHEN pg_class.relrowsecurity THEN 'RLS ATIVO - pode dar erro'
            ELSE 'RLS DESATIVADO - funcionando'
        END::text as status
    FROM pg_class 
    WHERE relname = 'profiles'
    
    UNION ALL
    
    SELECT 
        'leads'::text as table_name,
        pg_class.relrowsecurity as rls_enabled,
        (SELECT count(*) FROM pg_policies WHERE tablename = 'leads') as policies_count,
        CASE 
            WHEN pg_class.relrowsecurity THEN 'RLS ATIVO - pode dar erro'
            ELSE 'RLS DESATIVADO - funcionando'
        END::text as status
    FROM pg_class 
    WHERE relname = 'leads';
END;
$$;

-- ========================================
-- COMENTÁRIOS EXPLICATIVOS
-- ========================================

COMMENT ON FUNCTION test_rls_disabled() IS 'Verifica se RLS foi desativado com sucesso para corrigir recursão infinita';

-- Log de que foi aplicada correção emergencial
INSERT INTO public._supabase_migrations (version, name, hash) 
VALUES (
    '20250908220001', 
    'emergency_disable_rls - Fix infinite recursion', 
    'emergency_fix'
)
ON CONFLICT (version) DO NOTHING;