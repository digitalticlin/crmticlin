
-- CORREÇÃO DAS POLÍTICAS RLS DA TABELA MESSAGES
-- Remover políticas existentes que causam problemas
DROP POLICY IF EXISTS "messages_authenticated_select" ON messages;
DROP POLICY IF EXISTS "messages_authenticated_insert" ON messages;
DROP POLICY IF EXISTS "messages_authenticated_update" ON messages;
DROP POLICY IF EXISTS "messages_authenticated_delete" ON messages;

-- CRIAR POLÍTICAS RLS CORRETAS COM DUPLA VALIDAÇÃO
-- Permitir acesso via whatsapp_instances OU via leads (multitenant mantido)

-- Política SELECT: usuário pode ver mensagens das suas instâncias OU dos seus leads
CREATE POLICY "messages_select_policy" ON messages
  FOR SELECT TO authenticated
  USING (
    created_by_user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM whatsapp_instances wi 
      WHERE wi.id = messages.whatsapp_number_id 
      AND wi.created_by_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM leads l 
      WHERE l.id = messages.lead_id 
      AND l.created_by_user_id = auth.uid()
    )
  );

-- Política INSERT: usuário pode inserir mensagens nas suas instâncias OU nos seus leads
CREATE POLICY "messages_insert_policy" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by_user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM whatsapp_instances wi 
      WHERE wi.id = messages.whatsapp_number_id 
      AND wi.created_by_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM leads l 
      WHERE l.id = messages.lead_id 
      AND l.created_by_user_id = auth.uid()
    )
  );

-- Política UPDATE: usuário pode atualizar mensagens das suas instâncias OU dos seus leads
CREATE POLICY "messages_update_policy" ON messages
  FOR UPDATE TO authenticated
  USING (
    created_by_user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM whatsapp_instances wi 
      WHERE wi.id = messages.whatsapp_number_id 
      AND wi.created_by_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM leads l 
      WHERE l.id = messages.lead_id 
      AND l.created_by_user_id = auth.uid()
    )
  )
  WITH CHECK (
    created_by_user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM whatsapp_instances wi 
      WHERE wi.id = messages.whatsapp_number_id 
      AND wi.created_by_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM leads l 
      WHERE l.id = messages.lead_id 
      AND l.created_by_user_id = auth.uid()
    )
  );

-- Política DELETE: usuário pode deletar mensagens das suas instâncias OU dos seus leads
CREATE POLICY "messages_delete_policy" ON messages
  FOR DELETE TO authenticated
  USING (
    created_by_user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM whatsapp_instances wi 
      WHERE wi.id = messages.whatsapp_number_id 
      AND wi.created_by_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM leads l 
      WHERE l.id = messages.lead_id 
      AND l.created_by_user_id = auth.uid()
    )
  );
