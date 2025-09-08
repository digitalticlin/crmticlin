-- 🚨 CORREÇÃO EMERGENCIAL: Limpar policies conflitantes e fixar auth context
-- Problema: auth.uid() retorna null porque execução está fora de sessão autenticada

-- ========================================
-- 1. REMOVER TODAS AS POLICIES CONFLITANTES
-- ========================================

-- Remover todas as policies de leads (limpar bagunça)
DROP POLICY IF EXISTS "Service role full access leads" ON leads;
DROP POLICY IF EXISTS "Webhook lead creation" ON leads;
DROP POLICY IF EXISTS "leads_delete" ON leads;
DROP POLICY IF EXISTS "leads_delete_multitenant" ON leads;
DROP POLICY IF EXISTS "leads_insert" ON leads;
DROP POLICY IF EXISTS "leads_insert_multitenant" ON leads;
DROP POLICY IF EXISTS "leads_select_multitenant" ON leads;
DROP POLICY IF EXISTS "leads_update" ON leads;
DROP POLICY IF EXISTS "leads_update_multitenant" ON leads;
DROP POLICY IF EXISTS "leads_visibility" ON leads;
DROP POLICY IF EXISTS "multitenant_leads_delete" ON leads;
DROP POLICY IF EXISTS "multitenant_leads_insert" ON leads;
DROP POLICY IF EXISTS "multitenant_leads_select" ON leads;
DROP POLICY IF EXISTS "multitenant_leads_update" ON leads;
DROP POLICY IF EXISTS "service_role_bypass" ON leads;

-- Remover policies problemáticas de profiles
DROP POLICY IF EXISTS "Admins can manage profiles in their organization" ON profiles;
DROP POLICY IF EXISTS "Allow access to own invite data" ON profiles;
DROP POLICY IF EXISTS "Allow admins to create team profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admins to update team profiles" ON profiles;
DROP POLICY IF EXISTS "Allow public access to invite data by token" ON profiles;
DROP POLICY IF EXISTS "Prevent admin creation by non-admin" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON profiles;
DROP POLICY IF EXISTS "multitenant_profiles_select" ON profiles;
DROP POLICY IF EXISTS "multitenant_profiles_update" ON profiles;

-- ========================================
-- 2. CRIAR UMA ÚNICA POLICY SIMPLES POR OPERAÇÃO
-- ========================================

-- LEADS: Policy única e simples para cada operação
CREATE POLICY "leads_multitenant_select_final" ON leads
    FOR SELECT
    USING (
        -- Se é service_role ou anon (webhooks), pode tudo
        current_setting('role') IN ('service_role', 'anon')
        OR
        -- Para usuários autenticados: só vê leads da própria empresa
        (
            current_setting('role') = 'authenticated' 
            AND created_by_user_id IN (
                SELECT p.id FROM profiles p 
                WHERE p.linked_auth_user_id = auth.uid()
                LIMIT 1  -- Performance: limitar a 1 resultado
            )
        )
    );

CREATE POLICY "leads_multitenant_insert_final" ON leads
    FOR INSERT
    WITH CHECK (
        current_setting('role') IN ('service_role', 'anon')
        OR
        (
            current_setting('role') = 'authenticated'
            AND (
                created_by_user_id IN (
                    SELECT p.id FROM profiles p 
                    WHERE p.linked_auth_user_id = auth.uid()
                    LIMIT 1
                )
                OR created_by_user_id IS NULL  -- Permitir insert inicial
            )
        )
    );

CREATE POLICY "leads_multitenant_update_final" ON leads
    FOR UPDATE
    USING (
        current_setting('role') IN ('service_role', 'anon')
        OR
        (
            current_setting('role') = 'authenticated'
            AND created_by_user_id IN (
                SELECT p.id FROM profiles p 
                WHERE p.linked_auth_user_id = auth.uid()
                LIMIT 1
            )
        )
    );

CREATE POLICY "leads_multitenant_delete_final" ON leads
    FOR DELETE
    USING (
        current_setting('role') IN ('service_role', 'anon')
        OR
        (
            current_setting('role') = 'authenticated'
            AND created_by_user_id IN (
                SELECT p.id FROM profiles p 
                WHERE p.linked_auth_user_id = auth.uid()
                LIMIT 1
            )
        )
    );

-- PROFILES: Policy simples
CREATE POLICY "profiles_multitenant_select_final" ON profiles
    FOR SELECT
    USING (
        current_setting('role') IN ('service_role', 'anon')
        OR
        (
            current_setting('role') = 'authenticated'
            AND (
                linked_auth_user_id = auth.uid()  -- Próprio perfil
                OR
                created_by_user_id IN (
                    SELECT p.id FROM profiles p 
                    WHERE p.linked_auth_user_id = auth.uid()
                    LIMIT 1
                )  -- Perfis da equipe
                OR
                invite_token IS NOT NULL  -- Dados de convite público
            )
        )
    );

CREATE POLICY "profiles_multitenant_insert_final" ON profiles
    FOR INSERT
    WITH CHECK (
        current_setting('role') IN ('service_role', 'anon')
        OR current_setting('role') = 'authenticated'
    );

CREATE POLICY "profiles_multitenant_update_final" ON profiles
    FOR UPDATE
    USING (
        current_setting('role') IN ('service_role', 'anon')
        OR
        (
            current_setting('role') = 'authenticated'
            AND (
                linked_auth_user_id = auth.uid()
                OR
                created_by_user_id IN (
                    SELECT p.id FROM profiles p 
                    WHERE p.linked_auth_user_id = auth.uid()
                    LIMIT 1
                )
            )
        )
    );

-- ========================================
-- 3. GARANTIR QUE RLS ESTÁ ATIVO
-- ========================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 4. FUNÇÃO DE DIAGNÓSTICO MELHORADA
-- ========================================

CREATE OR REPLACE FUNCTION test_auth_context_detailed()
RETURNS TABLE (
    test_name text,
    auth_uid_result uuid,
    current_role text,
    profile_found boolean,
    leads_visible bigint,
    status text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_exists boolean;
    visible_leads bigint;
BEGIN
    -- Verificar se auth.uid() funciona
    SELECT EXISTS(
        SELECT 1 FROM profiles p 
        WHERE p.linked_auth_user_id = auth.uid()
    ) INTO profile_exists;
    
    -- Contar leads visíveis
    SELECT count(*) FROM leads INTO visible_leads;
    
    RETURN QUERY
    SELECT 
        'Context Test'::text as test_name,
        auth.uid() as auth_uid_result,
        current_setting('role')::text as current_role,
        profile_exists as profile_found,
        visible_leads as leads_visible,
        CASE 
            WHEN auth.uid() IS NULL THEN 'AUTH CONTEXT BROKEN'
            WHEN visible_leads > 1000 THEN 'RLS NOT WORKING - TOO MANY LEADS'
            WHEN visible_leads < 100 THEN 'RLS WORKING - FILTERED'
            ELSE 'UNKNOWN STATE'
        END::text as status;
END;
$$;

-- Comentário
COMMENT ON FUNCTION test_auth_context_detailed() IS 'Diagnóstico completo do contexto de autenticação e RLS';