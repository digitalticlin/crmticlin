-- ====================================================================
-- TRIGGER AUTOMÁTICO PARA DELETAR INSTÂNCIAS NA VPS
-- ====================================================================
-- Execute este SQL no Supabase SQL Editor para ativar a deleção automática

-- 1. HABILITAR EXTENSÃO HTTP (se não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS http;

-- 2. CRIAR FUNÇÃO QUE CHAMA A EDGE FUNCTION
CREATE OR REPLACE FUNCTION trigger_delete_whatsapp_instance()
RETURNS TRIGGER AS $$
DECLARE
  response_data jsonb;
  request_url text;
  auth_header text;
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
      -- Se falhar, apenas logar o erro mas não impedir a deleção
      RAISE WARNING 'Erro ao chamar edge function para deletar da VPS: % %', SQLSTATE, SQLERRM;
      RAISE NOTICE 'Instância % foi deletada do banco, mas pode ainda estar na VPS', OLD.instance_name;
    END;
  ELSE
    RAISE NOTICE 'Instância % não tem vps_instance_id, pulando chamada para VPS', OLD.instance_name;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. REMOVER TRIGGER EXISTENTE (se houver)
DROP TRIGGER IF EXISTS after_delete_whatsapp_instance ON whatsapp_instances;

-- 4. CRIAR TRIGGER QUE EXECUTA APÓS DELETAR
CREATE TRIGGER after_delete_whatsapp_instance
  AFTER DELETE ON whatsapp_instances
  FOR EACH ROW
  EXECUTE FUNCTION trigger_delete_whatsapp_instance();

-- 5. GRANT PERMISSÕES NECESSÁRIAS
GRANT EXECUTE ON FUNCTION trigger_delete_whatsapp_instance() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_delete_whatsapp_instance() TO service_role;
GRANT EXECUTE ON FUNCTION trigger_delete_whatsapp_instance() TO anon;

-- 6. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON FUNCTION trigger_delete_whatsapp_instance() IS 
'🗑️ Função trigger que chama automaticamente a edge function whatsapp_instance_delete quando uma instância é removida da tabela whatsapp_instances. Sincroniza deleção com a VPS.';

COMMENT ON TRIGGER after_delete_whatsapp_instance ON whatsapp_instances IS 
'🔄 Trigger automático que executa após deleção para sincronizar remoção na VPS via edge function whatsapp_instance_delete';

-- 7. TESTE DO TRIGGER (opcional - descomente para testar)
-- DO $$
-- DECLARE
--   test_id uuid;
-- BEGIN
--   -- Inserir instância de teste
--   INSERT INTO whatsapp_instances (instance_name, vps_instance_id, created_by_user_id)
--   VALUES ('test_trigger_delete', 'test_instance_123', '9936ae64-b78c-48fe-97e8-bf67623349c6')
--   RETURNING id INTO test_id;
--   
--   RAISE NOTICE 'Instância teste criada: %', test_id;
--   
--   -- Deletar para testar o trigger
--   DELETE FROM whatsapp_instances WHERE id = test_id;
--   
--   RAISE NOTICE 'Instância teste deletada - trigger deve ter sido executado';
-- END $$;

-- 8. VERIFICAR SE O TRIGGER FOI CRIADO
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'whatsapp_instances' 
  AND trigger_name = 'after_delete_whatsapp_instance';

-- ====================================================================
-- INSTRUÇÕES DE USO:
-- ====================================================================
-- 1. Execute este SQL no Supabase SQL Editor
-- 2. O trigger será ativado automaticamente
-- 3. Quando você deletar uma instância do frontend/tabela:
--    - A instância será removida da tabela whatsapp_instances
--    - O trigger chamará automaticamente a edge function
--    - A edge function deletará a instância da VPS
--    - A instância será completamente removida do sistema
-- ====================================================================

SELECT 'TRIGGER AUTOMÁTICO CONFIGURADO COM SUCESSO!' as status; 