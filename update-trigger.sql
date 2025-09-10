-- Atualizar apenas a função do trigger para incluir userId
CREATE OR REPLACE FUNCTION trigger_delete_whatsapp_instance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_url text;
  auth_header text;
  response_data jsonb;
BEGIN
  -- Log da operação
  RAISE NOTICE 'Trigger: Deletando instância % (%) da VPS', OLD.instance_name, OLD.id;
  
  -- URL da edge function
  request_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/whatsapp_instance_delete';
  
  -- Header de autorização com service role key
  auth_header := 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxMzEwMCwiZXhwIjoyMDY2MDg5MTAwfQ.48XYhDq4XdVTqNhIHdskd6iMcJem38aHzk6U1psfRRM';
  
  -- Chamar edge function via HTTP POST (apenas se tiver vps_instance_id)
  IF OLD.vps_instance_id IS NOT NULL AND OLD.vps_instance_id != '' THEN
    BEGIN
      SELECT 
        content::jsonb INTO response_data
      FROM 
        http((
          'POST',
          request_url,
          ARRAY[
            http_header('Content-Type', 'application/json'),
            http_header('Authorization', auth_header),
            http_header('apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxMzEwMCwiZXhwIjoyMDY2MDg5MTAwfQ.48XYhDq4XdVTqNhIHdskd6iMcJem38aHzk6U1psfRRM')
          ],
          'application/json',
          jsonb_build_object(
            'instanceId', OLD.id,
            'vps_instance_id', OLD.vps_instance_id,
            'instance_name', OLD.instance_name,
            'userId', OLD.created_by_user_id,
            'trigger_source', 'database_delete_trigger'
          )::text
        ));
      
      RAISE NOTICE 'Edge function chamada com sucesso: %', response_data;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Erro ao chamar edge function: %', SQLERRM;
      -- Continuar mesmo se der erro - não bloquear deleção no banco
    END;
  ELSE
    RAISE NOTICE 'Instância % não tem vps_instance_id, pulando chamada da edge function', OLD.instance_name;
  END IF;
  
  RETURN OLD;
END;
$$;