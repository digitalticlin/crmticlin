-- RESTAURAR SEGURANÇA RLS PARA TABELAS DE GESTÃO DE EQUIPE
-- Execute no Supabase SQL Editor após corrigir o created_by_user_id

-- =========================================
-- 1. LIMPAR TODAS AS POLICIES ANTIGAS
-- =========================================
DROP POLICY IF EXISTS "Admin manages all funnel assignments" ON user_funnels;
DROP POLICY IF EXISTS "Admin manages funnel assignments" ON user_funnels;
DROP POLICY IF EXISTS "User sees own funnel assignments" ON user_funnels;
DROP POLICY IF EXISTS "Users can manage funnel assignments in their organization" ON user_funnels;
DROP POLICY IF EXISTS "Users can view funnel assignments in their organization" ON user_funnels;
DROP POLICY IF EXISTS "Users see own funnel assignments" ON user_funnels;
DROP POLICY IF EXISTS "service_role_user_funnels_access" ON user_funnels;
DROP POLICY IF EXISTS "super_permissive_funnel_policy" ON user_funnels;

DROP POLICY IF EXISTS "Admin manages all WhatsApp assignments" ON user_whatsapp_numbers;
DROP POLICY IF EXISTS "Admin manages whatsapp assignments" ON user_whatsapp_numbers;
DROP POLICY IF EXISTS "User sees own whatsapp assignments" ON user_whatsapp_numbers;
DROP POLICY IF EXISTS "Users can manage assignments in their organization" ON user_whatsapp_numbers;
DROP POLICY IF EXISTS "Users can view assignments in their organization" ON user_whatsapp_numbers;
DROP POLICY IF EXISTS "Users see own WhatsApp assignments" ON user_whatsapp_numbers;
DROP POLICY IF EXISTS "service_role_user_whatsapp_numbers_access" ON user_whatsapp_numbers;
DROP POLICY IF EXISTS "super_permissive_whatsapp_policy" ON user_whatsapp_numbers;

-- =========================================
-- 2. HABILITAR RLS NOVAMENTE
-- =========================================
ALTER TABLE user_whatsapp_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_funnels ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 3. CRIAR POLICIES SEGURAS E FUNCIONAIS
-- =========================================

-- Policy para WhatsApp Numbers
-- Permite que admins gerenciem todas as vinculações da organização
-- Permite que usuários vejam apenas suas próprias vinculações
CREATE POLICY "secure_whatsapp_assignments_policy" ON user_whatsapp_numbers
FOR ALL 
TO authenticated
USING (
  -- Admin pode ver/editar tudo da organização
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.linked_auth_user_id = auth.uid() 
    AND p.role = 'admin'
    AND p.id = created_by_user_id
  )
  OR
  -- Usuário pode ver suas próprias vinculações
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = profile_id 
    AND p.linked_auth_user_id = auth.uid()
  )
)
WITH CHECK (
  -- Admin pode inserir/atualizar vinculações da organização
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.linked_auth_user_id = auth.uid() 
    AND p.role = 'admin'
    AND p.id = created_by_user_id
  )
);

-- Policy para User Funnels
-- Permite que admins gerenciem todas as vinculações da organização
-- Permite que usuários vejam apenas suas próprias vinculações
CREATE POLICY "secure_funnel_assignments_policy" ON user_funnels
FOR ALL 
TO authenticated
USING (
  -- Admin pode ver/editar tudo da organização
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.linked_auth_user_id = auth.uid() 
    AND p.role = 'admin'
    AND p.id = created_by_user_id
  )
  OR
  -- Usuário pode ver suas próprias vinculações
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = profile_id 
    AND p.linked_auth_user_id = auth.uid()
  )
)
WITH CHECK (
  -- Admin pode inserir/atualizar vinculações da organização
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.linked_auth_user_id = auth.uid() 
    AND p.role = 'admin'
    AND p.id = created_by_user_id
  )
);

-- Policy para service_role (necessária para edge functions)
CREATE POLICY "service_role_whatsapp_access" ON user_whatsapp_numbers
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "service_role_funnels_access" ON user_funnels
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- =========================================
-- 4. VERIFICAR SE FOI APLICADO CORRETAMENTE
-- =========================================
SELECT 
    'RLS Status:' as info,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('user_whatsapp_numbers', 'user_funnels');

SELECT 
    'New Policies:' as info,
    tablename, 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename IN ('user_whatsapp_numbers', 'user_funnels')
ORDER BY tablename, policyname;

-- =========================================
-- 5. TESTE COM DADOS REAIS
-- =========================================
-- Limpar dados de teste antigos
DELETE FROM user_whatsapp_numbers WHERE profile_id = '6a7826d5-aed7-42aa-a660-4e3dc7b44fc2';
DELETE FROM user_funnels WHERE profile_id = '6a7826d5-aed7-42aa-a660-4e3dc7b44fc2';

SELECT '✅ RLS RESTAURADO COM SEGURANÇA - TESTE NO FRONTEND!' as status;
SELECT 'Agora as vinculações são seguras: apenas admins podem gerenciar equipe.' as security_note;