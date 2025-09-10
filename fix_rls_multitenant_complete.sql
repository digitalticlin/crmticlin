-- 🔧 CORRIGIR RLS MULTITENANT COMPLETO
-- Sistema escalável com separação ADMIN vs OPERACIONAL

-- ========================================
-- 1. REMOVER POLÍTICAS ANTIGAS (LIMPAR)
-- ========================================

-- Desabilitar RLS temporariamente para limpeza
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas antigas de leads
DROP POLICY IF EXISTS "leads_multitenant" ON leads;
DROP POLICY IF EXISTS "leads_select_policy" ON leads;
DROP POLICY IF EXISTS "leads_insert_policy" ON leads;
DROP POLICY IF EXISTS "leads_update_policy" ON leads;
DROP POLICY IF EXISTS "leads_delete_policy" ON leads;
DROP POLICY IF EXISTS "Users can access leads" ON leads;
DROP POLICY IF EXISTS "Enable read access for users" ON leads;
DROP POLICY IF EXISTS "Enable insert for users" ON leads;
DROP POLICY IF EXISTS "Enable update for users" ON leads;
DROP POLICY IF EXISTS "Enable delete for users" ON leads;

-- ========================================
-- 2. CRIAR FUNCTION HELPER PARA RLS
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
    -- Buscar role do profile vinculado ao auth.uid()
    SELECT role INTO user_role
    FROM profiles
    WHERE auth_user_id = auth.uid()
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
    SELECT id INTO profile_id
    FROM profiles
    WHERE auth_user_id = auth.uid()
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
-- 3. CRIAR POLÍTICAS RLS LEADS (PRINCIPAIS)
-- ========================================

-- Habilitar RLS na tabela leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

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
-- 4. APLICAR RLS EM OUTRAS TABELAS CRÍTICAS
-- ========================================

-- FUNNELS: Admin vê seus funis, Operacional vê funis atribuídos
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "funnels_select_multitenant" ON funnels;
CREATE POLICY "funnels_select_multitenant" ON funnels
FOR SELECT
TO authenticated
USING (
    (is_admin() AND created_by_user_id = current_profile_id())
    OR 
    (NOT is_admin() AND id IN (
        SELECT funnel_id FROM user_funnels 
        WHERE profile_id = current_profile_id()
    ))
);

-- WHATSAPP INSTANCES: Admin vê suas instâncias, Operacional vê atribuídas
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "whatsapp_instances_select_multitenant" ON whatsapp_instances;
CREATE POLICY "whatsapp_instances_select_multitenant" ON whatsapp_instances
FOR SELECT
TO authenticated
USING (
    (is_admin() AND created_by_user_id = current_profile_id())
    OR 
    (NOT is_admin() AND id IN (
        SELECT whatsapp_number_id FROM user_whatsapp_numbers 
        WHERE profile_id = current_profile_id()
    ))
);

-- PROFILES: Cada usuário vê apenas perfis de sua organização
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_multitenant" ON profiles;
CREATE POLICY "profiles_select_multitenant" ON profiles
FOR SELECT
TO authenticated
USING (
    -- Usuário vê seu próprio perfil
    auth_user_id = auth.uid()
    OR
    -- Admin vê perfis criados por ele (membros da equipe)
    (is_admin() AND created_by_user_id = current_profile_id())
);

-- ========================================
-- 5. TESTAR POLÍTICAS (EXECUTE COMO ADMIN)
-- ========================================

-- Verificar se políticas foram criadas
SELECT '=== POLÍTICAS CRIADAS ===' as info;
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'leads' AND schemaname = 'public';

-- Testar se functions estão funcionando
SELECT '=== TESTE FUNCTIONS ===' as info;
SELECT 
    'is_admin()' as function_name,
    is_admin() as result;

SELECT 
    'current_profile_id()' as function_name,
    current_profile_id() as result;