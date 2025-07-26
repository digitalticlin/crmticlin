-- 🔧 MIGRATION: Trigger para atualizar last_message automaticamente
-- Criado em: 2025-01-25
-- Objetivo: Manter last_message e unread_count sincronizados em tempo real

-- Função para atualizar lead quando nova mensagem é inserida
CREATE OR REPLACE FUNCTION update_lead_last_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar o lead com a última mensagem
  UPDATE leads 
  SET 
    last_message = NEW.text,
    last_message_time = NEW.created_at,
    unread_count = CASE 
      WHEN NEW.from_me = false THEN COALESCE(unread_count, 0) + 1
      ELSE unread_count
    END,
    updated_at = NOW()
  WHERE id = NEW.lead_id;
  
  -- Log da operação para debug
  RAISE NOTICE 'Lead % atualizado com mensagem % (from_me: %)', 
    NEW.lead_id, NEW.id, NEW.from_me;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_update_lead_last_message ON messages;

-- Criar o trigger para executar após INSERT de mensagem
CREATE TRIGGER trigger_update_lead_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_last_message();

-- Comentários para documentação
COMMENT ON FUNCTION update_lead_last_message() IS 'Atualiza automaticamente last_message e unread_count do lead quando nova mensagem é inserida';
COMMENT ON TRIGGER trigger_update_lead_last_message ON messages IS 'Trigger para manter last_message sincronizada em tempo real - criado para correção do realtime'; 