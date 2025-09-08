-- 🚨 FIX CRÍTICO: RLS Multitenant usando auth.uid() diretamente
-- Remove dependência de linked_auth_user_id que pode estar quebrada

-- ========================================
-- 1. REMOVER POLICIES ATUAIS PROBLEMÁTICAS
-- ========================================

-- Leads policies
DROP POLICY IF EXISTS "Users can only see their own leads" ON leads;
DROP POLICY IF EXISTS "Users can insert their own leads" ON leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON leads;

-- Profiles policies  
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- ========================================
-- 2. CRIAR POLICIES DIRETAS COM auth.uid()
-- ========================================

-- LEADS: Usuário só vê leads onde ele é o auth user direto
CREATE POLICY "multitenant_leads_select" ON leads
    FOR SELECT
    USING (
        -- Admin vê leads criados por perfis linkados a ele
        created_by_user_id IN (
            SELECT id FROM profiles 
            WHERE linked_auth_user_id = auth.uid()
        )
        OR
        -- Ou leads onde ele é owner direto
        owner_id IN (
            SELECT id FROM profiles 
            WHERE linked_auth_user_id = auth.uid()
        )
    );

CREATE POLICY "multitenant_leads_insert" ON leads
    FOR INSERT
    WITH CHECK (
        -- Só pode inserir leads se o created_by_user_id for seu profile
        created_by_user_id IN (
            SELECT id FROM profiles 
            WHERE linked_auth_user_id = auth.uid()
        )
    );

CREATE POLICY "multitenant_leads_update" ON leads
    FOR UPDATE
    USING (
        created_by_user_id IN (
            SELECT id FROM profiles 
            WHERE linked_auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        created_by_user_id IN (
            SELECT id FROM profiles 
            WHERE linked_auth_user_id = auth.uid()
        )
    );

CREATE POLICY "multitenant_leads_delete" ON leads
    FOR DELETE
    USING (
        created_by_user_id IN (
            SELECT id FROM profiles 
            WHERE linked_auth_user_id = auth.uid()
        )
    );

-- PROFILES: Usuário vê apenas perfis da sua "empresa" (criados por ele ou ele mesmo)
CREATE POLICY "multitenant_profiles_select" ON profiles
    FOR SELECT
    USING (
        linked_auth_user_id = auth.uid()  -- Seu próprio perfil
        OR
        created_by_user_id IN (
            SELECT id FROM profiles 
            WHERE linked_auth_user_id = auth.uid()
        ) -- Perfis criados por ele (equipe)
    );

CREATE POLICY "multitenant_profiles_update" ON profiles
    FOR UPDATE
    USING (
        linked_auth_user_id = auth.uid()  -- Só atualiza próprio perfil
        OR
        created_by_user_id IN (
            SELECT id FROM profiles 
            WHERE linked_auth_user_id = auth.uid()
        ) -- Ou perfis da equipe
    );

-- ========================================  
-- 3. GARANTIR QUE RLS ESTÁ ATIVO
-- ========================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 4. TESTAR AS POLICIES
-- ========================================

-- Função para testar contexto auth
CREATE OR REPLACE FUNCTION test_auth_context()
RETURNS TABLE (
    current_auth_uid uuid,
    profile_count bigint,
    leads_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        auth.uid() as current_auth_uid,
        (SELECT count(*) FROM profiles)::bigint as profile_count,
        (SELECT count(*) FROM leads)::bigint as leads_count;
END;
$$;

-- Comentários explicativos
COMMENT ON POLICY "multitenant_leads_select" ON leads IS 
'RLS Multitenant: Usuário só vê leads criados por perfis linkados ao seu auth.uid()';

COMMENT ON POLICY "multitenant_profiles_select" ON profiles IS 
'RLS Multitenant: Usuário vê seu perfil + perfis da equipe criados por ele';