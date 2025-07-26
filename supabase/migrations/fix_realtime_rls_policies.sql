-- ✅ CORREÇÃO CRÍTICA: Garantir que RLS não interfira no realtime
-- Data: 2025-01-28
-- Problema: Políticas RLS muito restritivas podem bloquear eventos de realtime

-- Remover políticas conflitantes
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
DROP POLICY IF EXISTS "messages_update_policy" ON messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON messages;
DROP POLICY IF EXISTS "authenticated_users_messages_access" ON messages;
DROP POLICY IF EXISTS "service_role_messages_access" ON messages;

-- ✅ POLÍTICA OTIMIZADA PARA REALTIME
-- Permite acesso total para service_role (webhooks)
CREATE POLICY "service_role_messages_all_access" ON messages
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ✅ POLÍTICA OTIMIZADA PARA USUÁRIOS AUTENTICADOS  
-- Permite acesso via múltiplos caminhos para garantir que realtime funcione
CREATE POLICY "authenticated_messages_realtime_access" ON messages
  FOR ALL TO authenticated
  USING (
    -- Acesso direto por created_by_user_id
    created_by_user_id = auth.uid()
    OR
    -- Acesso via instância WhatsApp
    EXISTS (
      SELECT 1 FROM whatsapp_instances wi 
      WHERE wi.id = messages.whatsapp_number_id 
      AND wi.created_by_user_id = auth.uid()
    )
    OR
    -- Acesso via lead/contato
    EXISTS (
      SELECT 1 FROM leads l 
      WHERE l.id = messages.lead_id 
      AND l.created_by_user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Check para INSERT/UPDATE - mesma lógica
    created_by_user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM whatsapp_instances wi 
      WHERE wi.id = messages.whatsapp_number_id 
      AND wi.created_by_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM leads l 
      WHERE l.id = messages.lead_id 
      AND l.created_by_user_id = auth.uid()
    )
  );

-- ✅ GARANTIR QUE REALTIME ESTÁ HABILITADO NA TABELA MESSAGES
ALTER TABLE messages REPLICA IDENTITY FULL;

-- ✅ VERIFICAR SE PUBLICAÇÃO REALTIME ESTÁ ATIVA
-- Isso garante que os eventos de realtime sejam enviados
DO $$
DECLARE
    publication_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'messages'
    ) INTO publication_exists;
    
    IF NOT publication_exists THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE messages;
        RAISE NOTICE '✅ Tabela messages adicionada à publicação realtime';
    ELSE
        RAISE NOTICE '✅ Tabela messages já está na publicação realtime';
    END IF;
END $$;

-- ✅ GRANT EXPLÍCITO PARA AUTHENTICATED ROLE
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO authenticated;

-- ✅ LOGS DE VERIFICAÇÃO
DO $$
BEGIN
    RAISE NOTICE '✅ Políticas RLS otimizadas para realtime aplicadas';
    RAISE NOTICE '✅ REPLICA IDENTITY configurado como FULL';
    RAISE NOTICE '✅ Permissões explícitas concedidas';
    RAISE NOTICE '✅ Publicação realtime verificada';
END $$; 