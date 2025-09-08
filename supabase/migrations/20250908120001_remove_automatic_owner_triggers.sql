-- =====================================================
-- REMOVER TRIGGERS AUTOMÁTICOS DE OWNER_ID
-- E CONFIGURAR ESTRUTURA CORRETA DE VISIBILIDADE
-- =====================================================

-- ===============================
-- 1. DELETAR TODOS OS TRIGGERS AUTOMÁTICOS DE OWNER_ID
-- ===============================

-- Remover triggers de atualização de owner_id em funis
DROP TRIGGER IF EXISTS trigger_update_funnel_leads_owner_insert ON user_funnels;
DROP TRIGGER IF EXISTS trigger_update_funnel_leads_owner_delete ON user_funnels;

-- Remover triggers de atualização de owner_id em WhatsApp
DROP TRIGGER IF EXISTS trigger_update_whatsapp_leads_owner_insert ON user_whatsapp_numbers;
DROP TRIGGER IF EXISTS trigger_update_whatsapp_leads_owner_delete ON user_whatsapp_numbers;

-- Remover trigger de set_lead_owner_on_insert
DROP TRIGGER IF EXISTS trigger_set_lead_owner_on_insert ON leads;

-- Remover funções não utilizadas
DROP FUNCTION IF EXISTS update_leads_owner_on_funnel_change CASCADE;
DROP FUNCTION IF EXISTS update_leads_owner_on_whatsapp_change CASCADE;
DROP FUNCTION IF EXISTS update_leads_owner_on_assignment_change CASCADE;
DROP FUNCTION IF EXISTS set_lead_owner_on_insert CASCADE;
DROP FUNCTION IF EXISTS get_funnel_owner CASCADE;
DROP FUNCTION IF EXISTS get_whatsapp_owner CASCADE;

-- ===============================
-- 2. CRIAR ESTRUTURA CORRETA DE VISIBILIDADE
-- ===============================

-- Função auxiliar: Verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE linked_auth_user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar: Verificar se usuário é operacional
CREATE OR REPLACE FUNCTION public.is_operational()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE linked_auth_user_id = auth.uid() 
    AND role = 'operational'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================
-- 3. REMOVER TODAS AS POLÍTICAS RLS ANTIGAS DE LEADS
-- ===============================

DROP POLICY IF EXISTS "leads_select_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_update_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_policy" ON public.leads;
DROP POLICY IF EXISTS "service_role_full_access" ON public.leads;

-- ===============================
-- 4. CRIAR NOVAS POLÍTICAS RLS SIMPLIFICADAS
-- ===============================

-- Política para SELECT
CREATE POLICY "leads_visibility" ON public.leads
FOR SELECT
USING (
  -- Admin vê todos os leads onde é created_by_user_id
  (public.is_admin() AND created_by_user_id = auth.uid())
  OR
  -- Operacional vê leads vinculados às suas instâncias WhatsApp
  (public.is_operational() AND EXISTS (
    SELECT 1 FROM user_whatsapp_numbers uwn
    JOIN profiles p ON uwn.profile_id = p.id
    WHERE uwn.whatsapp_number_id = leads.whatsapp_instance_id
    AND p.linked_auth_user_id = auth.uid()
  ))
);

-- Política para INSERT (apenas admin pode criar)
CREATE POLICY "leads_insert" ON public.leads
FOR INSERT
WITH CHECK (
  public.is_admin() AND 
  created_by_user_id = auth.uid()
);

-- Política para UPDATE
CREATE POLICY "leads_update" ON public.leads
FOR UPDATE
USING (
  -- Admin pode editar seus leads
  (public.is_admin() AND created_by_user_id = auth.uid())
  OR
  -- Operacional pode editar leads das suas instâncias
  (public.is_operational() AND EXISTS (
    SELECT 1 FROM user_whatsapp_numbers uwn
    JOIN profiles p ON uwn.profile_id = p.id
    WHERE uwn.whatsapp_number_id = leads.whatsapp_instance_id
    AND p.linked_auth_user_id = auth.uid()
  ))
);

-- Política para DELETE (apenas admin)
CREATE POLICY "leads_delete" ON public.leads
FOR DELETE
USING (
  public.is_admin() AND 
  created_by_user_id = auth.uid()
);

-- Service role mantém acesso total
CREATE POLICY "service_role_bypass" ON public.leads
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ===============================
-- 5. POLÍTICAS RLS PARA FUNIS
-- ===============================

-- Remover políticas antigas
DROP POLICY IF EXISTS "funnel_visibility" ON public.sales_funnels;
DROP POLICY IF EXISTS "funnel_insert" ON public.sales_funnels;
DROP POLICY IF EXISTS "funnel_update" ON public.sales_funnels;
DROP POLICY IF EXISTS "funnel_delete" ON public.sales_funnels;

-- Criar novas políticas
CREATE POLICY "funnel_visibility" ON public.sales_funnels
FOR SELECT
USING (
  -- Admin vê seus funis
  (public.is_admin() AND created_by_user_id = auth.uid())
  OR
  -- Operacional vê funis atribuídos a ele
  (public.is_operational() AND EXISTS (
    SELECT 1 FROM user_funnels uf
    JOIN profiles p ON uf.profile_id = p.id
    WHERE uf.funnel_id = sales_funnels.id
    AND p.linked_auth_user_id = auth.uid()
  ))
);

CREATE POLICY "funnel_insert" ON public.sales_funnels
FOR INSERT
WITH CHECK (
  public.is_admin() AND 
  created_by_user_id = auth.uid()
);

CREATE POLICY "funnel_update" ON public.sales_funnels
FOR UPDATE
USING (
  public.is_admin() AND 
  created_by_user_id = auth.uid()
);

CREATE POLICY "funnel_delete" ON public.sales_funnels
FOR DELETE
USING (
  public.is_admin() AND 
  created_by_user_id = auth.uid()
);

-- ===============================
-- 6. CRIAR PERFIS PARA ADMINS ÓRFÃOS
-- ===============================

-- Criar perfil para o usuário com 2.317 leads
INSERT INTO profiles (linked_auth_user_id, email, role, full_name, created_at, updated_at)
VALUES ('9936ae64-b78c-48fe-97e8-bf67623349c6', 'admin1@empresa.com.br', 'admin', 'Admin 1', NOW(), NOW())
ON CONFLICT (linked_auth_user_id) DO UPDATE SET role = 'admin';

-- Criar perfil para o usuário com 1.146 leads
INSERT INTO profiles (linked_auth_user_id, email, role, full_name, created_at, updated_at)
VALUES ('152f2390-ede4-4f46-89bc-da3d7f5da747', 'admin2@empresa.com.br', 'admin', 'Admin 2', NOW(), NOW())
ON CONFLICT (linked_auth_user_id) DO UPDATE SET role = 'admin';

-- Criar perfil para outros admins com muitos leads
INSERT INTO profiles (linked_auth_user_id, email, role, full_name, created_at, updated_at)
VALUES 
  ('8cf224c2-2bed-4687-89a9-8639e76acd47', 'admin3@empresa.com.br', 'admin', 'Admin 3', NOW(), NOW()),
  ('d08b159d-39ad-479a-9f21-d63c13f9e7ee', 'admin4@empresa.com.br', 'admin', 'Admin 4', NOW(), NOW()),
  ('02bb7449-ed24-4e9a-8eb2-5a758e4cf871', 'admin5@empresa.com.br', 'admin', 'Admin 5', NOW(), NOW()),
  ('7c197601-01cc-4f71-a4d8-7c1357cac113', 'admin6@empresa.com.br', 'admin', 'Admin 6', NOW(), NOW()),
  ('d973d018-d053-4a39-b023-765332152dac', 'admin7@empresa.com.br', 'admin', 'Admin 7', NOW(), NOW())
ON CONFLICT (linked_auth_user_id) DO UPDATE SET role = 'admin';

-- ===============================
-- 7. LIMPAR DADOS INCONSISTENTES
-- ===============================

-- Garantir que owner_id nunca seja NULL (usar created_by_user_id como padrão)
UPDATE leads 
SET owner_id = created_by_user_id 
WHERE owner_id IS NULL;

-- ===============================
-- 8. ADICIONAR COMENTÁRIOS
-- ===============================

COMMENT ON POLICY "leads_visibility" ON public.leads IS 
'Admin vê leads onde created_by_user_id = auth.uid(). Operacional vê leads das instâncias WhatsApp atribuídas.';

COMMENT ON POLICY "funnel_visibility" ON public.sales_funnels IS 
'Admin vê funis onde created_by_user_id = auth.uid(). Operacional vê funis atribuídos via user_funnels.';

COMMENT ON FUNCTION public.is_admin() IS 
'Verifica se o usuário atual é admin';

COMMENT ON FUNCTION public.is_operational() IS 
'Verifica se o usuário atual é operacional';