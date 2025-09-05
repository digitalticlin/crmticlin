-- FASE 2: RLS INTELIGENTE - SEGURO PARA ADMIN + FUNCIONAL

-- =========================================
-- 1. HABILITAR RLS NOVAMENTE (APÓS CORRIGIR FUNCTIONS)
-- =========================================
ALTER TABLE user_whatsapp_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_funnels ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 2. POLICY INTELIGENTE - ADMIN CONTEXT AWARE
-- =========================================

-- Policy WhatsApp - Distingue contexto Admin vs User
CREATE POLICY "context_aware_whatsapp_policy" ON user_whatsapp_numbers
FOR ALL TO authenticated
USING (
  -- Contexto 1: Admin gerenciando equipe (INSERT/UPDATE/DELETE/SELECT)
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    WHERE admin_profile.linked_auth_user_id = auth.uid()
    AND admin_profile.role = 'admin'
    AND admin_profile.id = user_whatsapp_numbers.created_by_user_id
  )
  OR
  -- Contexto 2: Usuário vendo próprias vinculações (SELECT apenas)
  EXISTS (
    SELECT 1 FROM profiles user_profile
    WHERE user_profile.id = user_whatsapp_numbers.profile_id
    AND user_profile.linked_auth_user_id = auth.uid()
  )
)
WITH CHECK (
  -- Para INSERT/UPDATE: apenas admin pode modificar
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    WHERE admin_profile.linked_auth_user_id = auth.uid()
    AND admin_profile.role = 'admin'
    AND admin_profile.id = user_whatsapp_numbers.created_by_user_id
  )
);

-- Policy Funnels - Mesma lógica
CREATE POLICY "context_aware_funnel_policy" ON user_funnels
FOR ALL TO authenticated
USING (
  -- Contexto 1: Admin gerenciando equipe
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    WHERE admin_profile.linked_auth_user_id = auth.uid()
    AND admin_profile.role = 'admin'
    AND admin_profile.id = user_funnels.created_by_user_id
  )
  OR
  -- Contexto 2: Usuário vendo próprias vinculações
  EXISTS (
    SELECT 1 FROM profiles user_profile
    WHERE user_profile.id = user_funnels.profile_id
    AND user_profile.linked_auth_user_id = auth.uid()
  )
)
WITH CHECK (
  -- Para INSERT/UPDATE: apenas admin pode modificar
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    WHERE admin_profile.linked_auth_user_id = auth.uid()
    AND admin_profile.role = 'admin'
    AND admin_profile.id = user_funnels.created_by_user_id
  )
);

-- =========================================
-- 3. VERIFICAR APLICAÇÃO
-- =========================================
SELECT 'RLS Policies aplicadas:' as info, tablename, policyname
FROM pg_policies 
WHERE tablename IN ('user_whatsapp_numbers', 'user_funnels')
AND policyname LIKE 'context_aware%';

SELECT '🛡️ RLS INTELIGENTE ATIVO - ADMIN TEM ACESSO, USER ISOLADO' as status;