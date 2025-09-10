-- 🔧 CORRIGIR RLS COM CAMPOS CORRETOS DA TABELA PROFILES
-- Usar linked_auth_user_id ao invés de auth_user_id

-- ========================================
-- 1. REMOVER FUNCTIONS ANTIGAS
-- ========================================

DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS current_profile_id();
DROP FUNCTION IF EXISTS has_operational_access_to_lead(leads);

-- ========================================
-- 2. CRIAR FUNCTIONS CORRETAS COM linked_auth_user_id
-- ========================================

-- Function para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role text;
BEGIN
    -- 🔧 FIX: Usar linked_auth_user_id ao invés de auth_user_id
    SELECT role INTO user_role
    FROM profiles
    WHERE linked_auth_user_id = auth.uid()
    LIMIT 1;
    
    RETURN COALESCE(user_role = 'admin', false);
END;
$$;

-- Function para pegar profile_id do usuário atual
CREATE OR REPLACE FUNCTION current_profile_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_id uuid;
BEGIN
    -- 🔧 FIX: Usar linked_auth_user_id ao invés de auth_user_id
    SELECT id INTO profile_id
    FROM profiles
    WHERE linked_auth_user_id = auth.uid()
    LIMIT 1;
    
    RETURN profile_id;
END;
$$;

-- Function para verificar acesso operacional
CREATE OR REPLACE FUNCTION has_operational_access_to_lead(lead_row leads)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_id uuid;
    has_whatsapp_access boolean := false;
    has_funnel_access boolean := false;
BEGIN
    -- Pegar ID do profile atual
    profile_id := current_profile_id();
    
    IF profile_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Verificar se tem acesso ao WhatsApp da conversa
    SELECT EXISTS (
        SELECT 1 FROM user_whatsapp_numbers 
        WHERE profile_id = current_profile_id()
        AND whatsapp_number_id = lead_row.whatsapp_number_id
    ) INTO has_whatsapp_access;
    
    -- Verificar se tem acesso ao funil
    SELECT EXISTS (
        SELECT 1 FROM user_funnels 
        WHERE profile_id = current_profile_id()
        AND funnel_id = lead_row.funnel_id
    ) INTO has_funnel_access;
    
    -- Operacional precisa de ambos os acessos
    RETURN has_whatsapp_access AND has_funnel_access;
END;
$$;

-- ========================================
-- 3. REMOVER E RECRIAR POLÍTICAS LEADS
-- ========================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "leads_select_multitenant" ON leads;
DROP POLICY IF EXISTS "leads_insert_multitenant" ON leads;
DROP POLICY IF EXISTS "leads_update_multitenant" ON leads;
DROP POLICY IF EXISTS "leads_delete_multitenant" ON leads;

-- POLÍTICA SELECT: Admin vê seus dados, Operacional vê dados atribuídos
CREATE POLICY "leads_select_multitenant" ON leads
FOR SELECT
TO authenticated
USING (
    -- ADMIN: Vê todos os leads criados sob sua organização
    (is_admin() AND created_by_user_id = current_profile_id())
    OR 
    -- OPERACIONAL: Vê apenas leads das instâncias/funis que tem acesso
    (NOT is_admin() AND has_operational_access_to_lead(leads))
);

-- POLÍTICA INSERT: Apenas admin pode criar leads
CREATE POLICY "leads_insert_multitenant" ON leads
FOR INSERT
TO authenticated
WITH CHECK (
    is_admin() AND created_by_user_id = current_profile_id()
);

-- POLÍTICA UPDATE: Admin atualiza seus leads, Operacional atualiza leads que tem acesso
CREATE POLICY "leads_update_multitenant" ON leads
FOR UPDATE
TO authenticated
USING (
    (is_admin() AND created_by_user_id = current_profile_id())
    OR 
    (NOT is_admin() AND has_operational_access_to_lead(leads))
)
WITH CHECK (
    (is_admin() AND created_by_user_id = current_profile_id())
    OR 
    (NOT is_admin() AND has_operational_access_to_lead(leads))
);

-- POLÍTICA DELETE: Apenas admin pode deletar leads
CREATE POLICY "leads_delete_multitenant" ON leads
FOR DELETE
TO authenticated
USING (
    is_admin() AND created_by_user_id = current_profile_id()
);

-- ========================================
-- 4. TESTAR FUNCTIONS CORRIGIDAS
-- ========================================

SELECT '=== TESTE FUNCTIONS CORRETAS ===' as info;

SELECT 
    'is_admin()' as function_name,
    is_admin() as result;

SELECT 
    'current_profile_id()' as function_name,
    current_profile_id() as result;

-- ========================================
-- 5. TESTAR ACESSO A LEADS COM RLS
-- ========================================

SELECT '=== TESTE RLS LEADS ===' as info;

-- Esta query deve retornar apenas leads do admin atual
SELECT 
    COUNT(*) as total_leads_visible_with_rls,
    'Admin deve ver apenas seus leads' as explanation
FROM leads;