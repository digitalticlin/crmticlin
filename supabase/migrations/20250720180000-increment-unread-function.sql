
-- Função para incrementar contador de mensagens não lidas
CREATE OR REPLACE FUNCTION increment_unread_count(lead_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE leads 
  SET unread_count = COALESCE(unread_count, 0) + 1
  WHERE id = lead_id;
  
  RETURN (SELECT unread_count FROM leads WHERE id = lead_id);
END;
$$;
