-- LIMPEZA NUCLEAR DOS TRIGGERS
-- 1. Remover TODOS os triggers relacionados a whatsapp_instances delete
DROP TRIGGER IF EXISTS after_delete_whatsapp_instance ON whatsapp_instances CASCADE;
DROP TRIGGER IF EXISTS whatsapp_instance_delete_trigger ON whatsapp_instances CASCADE;
DROP TRIGGER IF EXISTS delete_whatsapp_instance_trigger ON whatsapp_instances CASCADE;

-- 2. Remover TODAS as funções relacionadas
DROP FUNCTION IF EXISTS trigger_delete_whatsapp_instance() CASCADE;
DROP FUNCTION IF EXISTS delete_whatsapp_instance_trigger() CASCADE;
DROP FUNCTION IF EXISTS whatsapp_instance_delete_trigger() CASCADE;

-- 3. Aguardar e forçar limpeza de cache
SELECT pg_sleep(1);

-- 4. RECRIAR FUNÇÃO COMPLETAMENTE NOVA COM NOME ÚNICO
CREATE OR REPLACE FUNCTION new_trigger_delete_whatsapp_v2()
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
  RAISE NOTICE '🚀 NOVO TRIGGER V2: Deletando instância % (%) da VPS, userId: %', OLD.instance_name, OLD.id, OLD.created_by_user_id;
  
  -- URL da edge function
  request_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/whatsapp_instance_delete';
  
  -- Header de autorização com service role key
  auth_header := 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxMzEwMCwiZXhwIjoyMDY2MDg5MTAwfQ.48XYhDq4XdVTqNhIHdskd6iMcJem38aHzk6U1psfRRM';
  
  -- Chamar edge function via HTTP POST (apenas se tiver vps_instance_id)
  IF OLD.vps_instance_id IS NOT NULL AND OLD.vps_instance_id != '' THEN
    BEGIN
      RAISE NOTICE '🚀 NOVO TRIGGER V2: Enviando payload COMPLETO com userId: %, instanceId: %', OLD.created_by_user_id, OLD.id;
      
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
      
      RAISE NOTICE '🚀 NOVO TRIGGER V2: Edge function SUCESSO: %', response_data;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '🚀 NOVO TRIGGER V2: ERRO ao chamar edge function: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE '🚀 NOVO TRIGGER V2: Instância % sem vps_instance_id, pulando edge function', OLD.instance_name;
  END IF;
  
  RETURN OLD;
END;
$$;

-- 5. RECRIAR TRIGGER COM NOME ÚNICO
CREATE TRIGGER new_after_delete_whatsapp_v2
  AFTER DELETE ON whatsapp_instances
  FOR EACH ROW
  EXECUTE FUNCTION new_trigger_delete_whatsapp_v2();

-- 6. Verificação final
SELECT 'TRIGGER V2 CRIADO COM SUCESSO' as status;