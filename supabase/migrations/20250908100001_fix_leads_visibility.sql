-- =====================================================
-- FIX: Correção definitiva de visibilidade de leads
-- =====================================================

-- 1. Primeiro, remover TODAS as políticas existentes de leads
DROP POLICY IF EXISTS "Users can view accessible leads" ON public.leads;
DROP POLICY IF EXISTS "Users can create leads for their WhatsApp numbers" ON public.leads;
DROP POLICY IF EXISTS "Users can update accessible leads" ON public.leads;
DROP POLICY IF EXISTS "Admin sees all organization leads" ON public.leads;
DROP POLICY IF EXISTS "Operational sees only assigned leads" ON public.leads;
DROP POLICY IF EXISTS "service_role_leads_access" ON public.leads;
DROP POLICY IF EXISTS "authenticated_users_leads_access" ON public.leads;

-- 2. Criar funções auxiliares se não existirem
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE linked_auth_user_id = auth.uid()
  LIMIT 1;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID AS $$
DECLARE
  org_id UUID;
  user_role TEXT;
BEGIN
  -- Pegar o role do usuário
  SELECT role INTO user_role
  FROM public.profiles
  WHERE linked_auth_user_id = auth.uid()
  LIMIT 1;
  
  IF user_role = 'admin' THEN
    -- Admin: organização é ele mesmo
    RETURN auth.uid();
  ELSE
    -- Operacional: organização é o admin que o criou
    SELECT created_by_user_id INTO org_id
    FROM public.profiles
    WHERE linked_auth_user_id = auth.uid()
    LIMIT 1;
    
    RETURN org_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar políticas RLS corrigidas

-- Política para SELECT: Admin vê todos os leads da organização, Operacional vê apenas onde é owner
CREATE POLICY "leads_select_policy" ON public.leads
FOR SELECT
USING (
  CASE 
    WHEN public.get_user_role() = 'admin' THEN
      -- Admin vê todos os leads onde ele é o created_by_user_id
      created_by_user_id = auth.uid()
    WHEN public.get_user_role() = 'operational' THEN
      -- Operacional vê apenas leads onde é owner E que pertencem à sua organização
      owner_id = auth.uid() AND created_by_user_id = public.get_user_organization_id()
    ELSE
      FALSE
  END
);

-- Política para INSERT: Apenas admin pode criar leads
CREATE POLICY "leads_insert_policy" ON public.leads
FOR INSERT
WITH CHECK (
  public.get_user_role() = 'admin' AND
  created_by_user_id = auth.uid()
);

-- Política para UPDATE: Admin pode editar todos da organização, Operacional apenas os atribuídos
CREATE POLICY "leads_update_policy" ON public.leads
FOR UPDATE
USING (
  CASE 
    WHEN public.get_user_role() = 'admin' THEN
      created_by_user_id = auth.uid()
    WHEN public.get_user_role() = 'operational' THEN
      owner_id = auth.uid() AND created_by_user_id = public.get_user_organization_id()
    ELSE
      FALSE
  END
);

-- Política para DELETE: Apenas admin pode deletar
CREATE POLICY "leads_delete_policy" ON public.leads
FOR DELETE
USING (
  public.get_user_role() = 'admin' AND
  created_by_user_id = auth.uid()
);

-- 4. Garantir que service_role tem acesso total (para webhooks e funções edge)
CREATE POLICY "service_role_full_access" ON public.leads
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Adicionar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_leads_created_by_user_id ON public.leads(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON public.leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_profiles_linked_auth_user_id ON public.profiles(linked_auth_user_id);

-- 6. Garantir que RLS está habilitado
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Comentários para documentação
COMMENT ON POLICY "leads_select_policy" ON public.leads IS 
'Admin vê todos os leads onde é created_by_user_id. Operacional vê apenas onde é owner_id e pertence à sua organização.';

COMMENT ON POLICY "leads_insert_policy" ON public.leads IS 
'Apenas admin pode criar novos leads.';

COMMENT ON POLICY "leads_update_policy" ON public.leads IS 
'Admin pode editar todos os leads da organização. Operacional pode editar apenas os atribuídos a ele.';

COMMENT ON POLICY "leads_delete_policy" ON public.leads IS 
'Apenas admin pode deletar leads.';