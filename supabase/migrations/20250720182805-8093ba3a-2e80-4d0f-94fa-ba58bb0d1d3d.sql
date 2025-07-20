
-- Criar política RLS mais liberal para mensagens - apenas para testes
-- Esta política permite inserir mensagens apenas com whatsapp_number_id válido

-- Remover políticas existentes mais restritivas
DROP POLICY IF EXISTS "messages_flexible_insert" ON messages;

-- Criar nova política mais liberal para INSERT
CREATE POLICY "messages_liberal_insert" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Usuário deve ser o criador OU
    created_by_user_id = auth.uid() 
    OR
    -- Service role pode inserir qualquer coisa
    current_user = 'service_role'
    OR
    -- Permitir inserção se apenas whatsapp_number_id for válido
    (whatsapp_number_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM whatsapp_instances wi 
      WHERE wi.id = messages.whatsapp_number_id
    ))
  );

-- Permitir que service_role faça qualquer operação sem restrições
CREATE POLICY "service_role_messages_full_liberal" ON messages
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
