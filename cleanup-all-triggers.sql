-- LIMPEZA COMPLETA DE TODOS OS TRIGGERS RELACIONADOS A WHATSAPP DELETE

-- 1. Remover TODOS os triggers da tabela whatsapp_instances
DROP TRIGGER IF EXISTS after_delete_whatsapp_instance ON whatsapp_instances CASCADE;
DROP TRIGGER IF EXISTS new_after_delete_whatsapp_v2 ON whatsapp_instances CASCADE;
DROP TRIGGER IF EXISTS whatsapp_instance_delete_trigger ON whatsapp_instances CASCADE;
DROP TRIGGER IF EXISTS delete_whatsapp_instance_trigger ON whatsapp_instances CASCADE;

-- 2. Remover TODAS as funções relacionadas
DROP FUNCTION IF EXISTS trigger_delete_whatsapp_instance() CASCADE;
DROP FUNCTION IF EXISTS new_trigger_delete_whatsapp_v2() CASCADE;
DROP FUNCTION IF EXISTS delete_whatsapp_instance_trigger() CASCADE;
DROP FUNCTION IF EXISTS whatsapp_instance_delete_trigger() CASCADE;

-- 3. Verificar se ainda há triggers ativos
SELECT 
    'LIMPEZA: Triggers restantes na tabela whatsapp_instances:' as status,
    COUNT(*) as total_triggers
FROM information_schema.triggers 
WHERE event_object_table = 'whatsapp_instances';

-- 4. Aguardar limpeza completa
SELECT pg_sleep(2);

-- 5. CRIAR TRIGGER ÚNICO E DEFINITIVO
CREATE OR REPLACE FUNCTION final_trigger_delete_whatsapp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_url text;
  auth_header text;
  response_data jsonb;
BEGIN
  -- Log único para identificar
  RAISE NOTICE '🔥 TRIGGER ÚNICO: Deletando instância % (%) da VPS, userId: %', OLD.instance_name, OLD.id, OLD.created_by_user_id;
  
  -- URL da edge function
  request_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/whatsapp_instance_delete';
  
  -- Header de autorização com service role key
  auth_header := 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxMzEwMCwiZXhwIjoyMDY2MDg5MTAwfQ.48XYhDq4XdVTqNhIHdskd6iMcJem38aHzk6U1psfRRM';
  
  -- Chamar edge function apenas se tiver vps_instance_id
  IF OLD.vps_instance_id IS NOT NULL AND OLD.vps_instance_id != '' THEN
    BEGIN
      RAISE NOTICE '🔥 TRIGGER ÚNICO: Enviando payload COMPLETO para instanceId: %, vps_instance_id: %', OLD.id, OLD.vps_instance_id;
      
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
      
      RAISE NOTICE '🔥 TRIGGER ÚNICO: Edge function SUCESSO: %', response_data;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '🔥 TRIGGER ÚNICO: ERRO ao chamar edge function: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE '🔥 TRIGGER ÚNICO: Instância % sem vps_instance_id, pulando edge function', OLD.instance_name;
  END IF;
  
  RETURN OLD;
END;
$$;

-- 6. CRIAR TRIGGER ÚNICO
CREATE TRIGGER final_after_delete_whatsapp
  AFTER DELETE ON whatsapp_instances
  FOR EACH ROW
  EXECUTE FUNCTION final_trigger_delete_whatsapp();

-- 7. Verificação final
SELECT 
    'SUCESSO: Trigger único criado' as status,
    t.trigger_name,
    p.proname as function_name
FROM information_schema.triggers t
JOIN pg_proc p ON p.proname = 'final_trigger_delete_whatsapp'
WHERE t.event_object_table = 'whatsapp_instances';