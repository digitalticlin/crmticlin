-- 📸 SETUP COMPLETO - PGMQ Profile Pic Queue
-- Execute no Supabase SQL Editor

-- 1. 🚀 CRIAR FILA PARA FOTOS DE PERFIL
SELECT pgmq.create('profile_pic_queue');

-- 2. 📋 VERIFICAR SE A FILA FOI CRIADA
SELECT 
  queue_name,
  created_at,
  is_partitioned,
  is_unlogged
FROM pgmq.meta 
WHERE queue_name = 'profile_pic_queue';

-- 3. 🔧 FUNÇÃO PARA PROCESSAR FILA DE FOTOS (Worker Function)
CREATE OR REPLACE FUNCTION process_profile_pic_queue()
RETURNS TABLE(
  processed_count INTEGER,
  failed_count INTEGER,
  queue_size INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  msg_record RECORD;
  processed INTEGER := 0;
  failed INTEGER := 0;
  current_queue_size INTEGER;
BEGIN
  -- Obter tamanho atual da fila
  SELECT COUNT(*) INTO current_queue_size 
  FROM pgmq.q_profile_pic_queue;

  -- Processar mensagens da fila (máximo 50 por execução para não sobrecarregar)
  FOR msg_record IN 
    SELECT * FROM pgmq.read('profile_pic_queue', 10, 50)
  LOOP
    BEGIN
      -- Atualizar foto de perfil na tabela leads
      UPDATE leads 
      SET 
        profile_pic_url = (msg_record.message->>'profile_pic_url'),
        updated_at = NOW()
      WHERE 
        id = (msg_record.message->>'lead_id')::UUID
        AND phone = (msg_record.message->>'phone');
      
      -- Se atualizou alguma linha, marcar como processado
      IF FOUND THEN
        -- Deletar mensagem da fila (processada com sucesso)
        PERFORM pgmq.delete('profile_pic_queue', msg_record.msg_id);
        processed := processed + 1;
        
        -- Log de sucesso
        RAISE NOTICE 'Profile pic processado com sucesso - Lead: %, Phone: %', 
          (msg_record.message->>'lead_id'), 
          (msg_record.message->>'phone');
      ELSE
        -- Lead não encontrado, mas remover da fila para evitar loop
        PERFORM pgmq.delete('profile_pic_queue', msg_record.msg_id);
        RAISE WARNING 'Lead não encontrado para profile pic - Lead: %, Phone: %', 
          (msg_record.message->>'lead_id'), 
          (msg_record.message->>'phone');
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Em caso de erro, incrementar retry_count
      DECLARE
        retry_count INTEGER := COALESCE((msg_record.message->>'retry_count')::INTEGER, 0) + 1;
        max_retries INTEGER := 3;
      BEGIN
        IF retry_count >= max_retries THEN
          -- Máximo de tentativas atingido, remover da fila
          PERFORM pgmq.delete('profile_pic_queue', msg_record.msg_id);
          RAISE WARNING 'Max retries atingido para profile pic - Lead: %, Error: %', 
            (msg_record.message->>'lead_id'), SQLERRM;
        ELSE
          -- Reenviar com retry_count incrementado
          PERFORM pgmq.send('profile_pic_queue', 
            jsonb_set(msg_record.message, '{retry_count}', retry_count::text::jsonb)
          );
          PERFORM pgmq.delete('profile_pic_queue', msg_record.msg_id);
        END IF;
        
        failed := failed + 1;
      END;
    END;
  END LOOP;

  -- Retornar estatísticas
  RETURN QUERY SELECT processed, failed, current_queue_size;
END;
$$;

-- 4. 🔒 PERMISSÕES PARA SERVICE ROLE
GRANT EXECUTE ON FUNCTION process_profile_pic_queue() TO service_role;

-- 5. 📊 FUNÇÃO PARA MONITORAR FILA
CREATE OR REPLACE FUNCTION get_profile_pic_queue_stats()
RETURNS TABLE(
  queue_name TEXT,
  queue_size BIGINT,
  oldest_message TIMESTAMP,
  newest_message TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'profile_pic_queue'::TEXT as queue_name,
    COUNT(*) as queue_size,
    MIN(enqueued_at) as oldest_message,
    MAX(enqueued_at) as newest_message
  FROM pgmq.q_profile_pic_queue;
END;
$$;

-- 6. 🔒 PERMISSÕES PARA MONITORING
GRANT EXECUTE ON FUNCTION get_profile_pic_queue_stats() TO service_role;

-- 7. 🧪 TESTE DA FILA (OPCIONAL - remover em produção)
-- Adicionar mensagem de teste
SELECT pgmq.send('profile_pic_queue', jsonb_build_object(
  'lead_id', '00000000-0000-0000-0000-000000000000',
  'phone', '+5500000000000',
  'profile_pic_url', 'https://example.com/test.jpg',
  'instance_id', 'test_instance',
  'timestamp', NOW()::TEXT,
  'retry_count', 0
));

-- 8. 📋 VERIFICAR TESTE
SELECT 
  msg_id,
  enqueued_at,
  message->>'lead_id' as lead_id,
  message->>'phone' as phone,
  message->>'profile_pic_url' as profile_pic_url
FROM pgmq.q_profile_pic_queue;

-- 9. 🧹 LIMPAR TESTE (OPCIONAL)
-- SELECT pgmq.purge_queue('profile_pic_queue');

-- 10. ✅ VERIFICAÇÃO FINAL
SELECT 
  'profile_pic_queue created successfully' as status,
  COUNT(*) as test_messages
FROM pgmq.q_profile_pic_queue;

-- 📊 COMANDOS ÚTEIS PARA MONITORAMENTO:

-- Ver tamanho da fila:
-- SELECT COUNT(*) FROM pgmq.q_profile_pic_queue;

-- Ver mensagens na fila:
-- SELECT * FROM pgmq.q_profile_pic_queue ORDER BY enqueued_at DESC LIMIT 10;

-- Processar fila manualmente:
-- SELECT * FROM process_profile_pic_queue();

-- Estatísticas da fila:
-- SELECT * FROM get_profile_pic_queue_stats();

-- Limpar fila (CUIDADO!):
-- SELECT pgmq.purge_queue('profile_pic_queue');