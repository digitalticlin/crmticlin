-- =====================================================
-- CORREÇÃO DA POLÍTICA OPERACIONAL
-- Garantir que operacionais vejam leads das instâncias vinculadas
-- =====================================================

-- 1. Verificar a política atual para operacionais
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'leads' 
AND policyname LIKE '%visibility%';

-- 2. Recriar a política de visibilidade com lógica mais robusta
DROP POLICY IF EXISTS "leads_visibility" ON public.leads;

CREATE POLICY "leads_visibility" ON public.leads
FOR SELECT
USING (
  -- ADMIN: vê todos os leads onde created_by_user_id = auth.uid()
  (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.linked_auth_user_id = auth.uid() 
      AND p.role = 'admin'
    ) 
    AND created_by_user_id = auth.uid()
  )
  OR
  -- OPERACIONAL: vê leads das instâncias WhatsApp vinculadas a ele
  (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.linked_auth_user_id = auth.uid() 
      AND p.role = 'operational'
    ) 
    AND EXISTS (
      SELECT 1 
      FROM user_whatsapp_numbers uwn
      JOIN profiles p ON uwn.profile_id = p.id
      WHERE p.linked_auth_user_id = auth.uid()
      AND uwn.whatsapp_number_id = leads.whatsapp_number_id
    )
  )
);

-- 3. Verificar se a política foi criada corretamente
SELECT 
    'Política atualizada' as info,
    policyname,
    cmd,
    LEFT(qual, 200) as condicao_resumida
FROM pg_policies
WHERE tablename = 'leads' 
AND policyname = 'leads_visibility';

-- 4. ALTERNATIVA: Se operacionais devem ver por owner_id também
-- Descomente se necessário
/*
DROP POLICY IF EXISTS "leads_visibility" ON public.leads;

CREATE POLICY "leads_visibility" ON public.leads
FOR SELECT
USING (
  -- ADMIN: vê todos os leads onde created_by_user_id = auth.uid()
  (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.linked_auth_user_id = auth.uid() 
      AND p.role = 'admin'
    ) 
    AND created_by_user_id = auth.uid()
  )
  OR
  -- OPERACIONAL: vê leads onde é owner_id OU das instâncias WhatsApp vinculadas
  (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.linked_auth_user_id = auth.uid() 
      AND p.role = 'operational'
    ) 
    AND (
      owner_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 
        FROM user_whatsapp_numbers uwn
        JOIN profiles p ON uwn.profile_id = p.id
        WHERE p.linked_auth_user_id = auth.uid()
        AND uwn.whatsapp_number_id = leads.whatsapp_number_id
      )
    )
  )
);
*/

-- 5. Log de resultado
DO $$
BEGIN
    RAISE NOTICE '✅ Política de operacionais atualizada';
    RAISE NOTICE 'Admin: vê leads onde created_by_user_id = auth.uid()';
    RAISE NOTICE 'Operacional: vê leads das instâncias WhatsApp vinculadas';
END $$;