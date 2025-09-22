-- ============================================
-- SISTEMA DE DELEÇÃO ASSÍNCRONA - ANTI TIMEOUT
-- ============================================
-- Solução definitiva para usuários com muitos dados usando queue assíncrona

-- Tabela para controlar o progresso da deleção
CREATE TABLE IF NOT EXISTS account_deletion_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  progress JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Função ultra-rápida que apenas marca para deleção
CREATE OR REPLACE FUNCTION delete_user_account_async(p_user_id UUID)
RETURNS json AS $$
DECLARE
  v_queue_id UUID;
BEGIN
  -- Verificar se o usuário existe
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Verificar se já não está na fila
  IF EXISTS (SELECT 1 FROM account_deletion_queue WHERE user_id = p_user_id AND status IN ('pending', 'processing')) THEN
    RETURN json_build_object('success', false, 'error', 'Deletion already in progress');
  END IF;

  -- Adicionar à fila de deleção
  INSERT INTO account_deletion_queue (user_id, status)
  VALUES (p_user_id, 'pending')
  RETURNING id INTO v_queue_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Account deletion queued successfully',
    'queue_id', v_queue_id,
    'note', 'The deletion will be processed asynchronously. Use check_deletion_status() to monitor progress.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para processar a fila (micro lotes)
CREATE OR REPLACE FUNCTION process_deletion_queue_item(p_queue_id UUID)
RETURNS json AS $$
DECLARE
  v_queue_record RECORD;
  v_user_id UUID;
  v_created_by_user_id UUID;
  v_batch_size INTEGER := 100; -- Lotes MUITO pequenos
  v_deleted_count INTEGER;
  v_progress JSONB;
  v_total_messages INTEGER;
  v_total_leads INTEGER;
  v_processed_messages INTEGER := 0;
  v_processed_leads INTEGER := 0;
BEGIN
  -- Buscar item da fila
  SELECT * INTO v_queue_record
  FROM account_deletion_queue
  WHERE id = p_queue_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Queue item not found or already processed');
  END IF;

  v_user_id := v_queue_record.user_id;

  -- Marcar como processando
  UPDATE account_deletion_queue
  SET status = 'processing', started_at = now()
  WHERE id = p_queue_id;

  -- Buscar created_by_user_id
  SELECT COALESCE(created_by_user_id, id) INTO v_created_by_user_id
  FROM profiles WHERE id = v_user_id;

  -- Contar totais para progresso
  SELECT COUNT(*) INTO v_total_messages FROM messages WHERE created_by_user_id = v_created_by_user_id;
  SELECT COUNT(*) INTO v_total_leads FROM leads WHERE created_by_user_id = v_created_by_user_id;

  RAISE NOTICE 'Iniciando deleção de % mensagens e % leads para usuário %', v_total_messages, v_total_leads, v_user_id;

  -- FASE 1: Deletar mensagens em micro-lotes
  WHILE EXISTS (SELECT 1 FROM messages WHERE created_by_user_id = v_created_by_user_id LIMIT 1) LOOP
    DELETE FROM messages
    WHERE id IN (
      SELECT id FROM messages
      WHERE created_by_user_id = v_created_by_user_id
      LIMIT v_batch_size
    );

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    v_processed_messages := v_processed_messages + v_deleted_count;

    -- Atualizar progresso
    v_progress := json_build_object(
      'phase', 'deleting_messages',
      'total_messages', v_total_messages,
      'processed_messages', v_processed_messages,
      'total_leads', v_total_leads,
      'processed_leads', 0
    );

    UPDATE account_deletion_queue
    SET progress = v_progress
    WHERE id = p_queue_id;

    -- Commit parcial para evitar travamento
    COMMIT;
    PERFORM pg_sleep(0.05); -- Pausa muito pequena
  END LOOP;

  -- FASE 2: Deletar leads em micro-lotes
  WHILE EXISTS (SELECT 1 FROM leads WHERE created_by_user_id = v_created_by_user_id LIMIT 1) LOOP
    DELETE FROM leads
    WHERE id IN (
      SELECT id FROM leads
      WHERE created_by_user_id = v_created_by_user_id
      LIMIT v_batch_size
    );

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    v_processed_leads := v_processed_leads + v_deleted_count;

    -- Atualizar progresso
    v_progress := json_build_object(
      'phase', 'deleting_leads',
      'total_messages', v_total_messages,
      'processed_messages', v_processed_messages,
      'total_leads', v_total_leads,
      'processed_leads', v_processed_leads
    );

    UPDATE account_deletion_queue
    SET progress = v_progress
    WHERE id = p_queue_id;

    COMMIT;
    PERFORM pg_sleep(0.05);
  END LOOP;

  -- FASE 3: Deletar resto (rápido)
  DELETE FROM broadcast_campaigns WHERE created_by_user_id = v_created_by_user_id;
  DELETE FROM tags WHERE created_by_user_id = v_created_by_user_id;
  DELETE FROM whatsapp_instances WHERE created_by_user_id = v_created_by_user_id;
  DELETE FROM ai_agents WHERE created_by_user_id = v_created_by_user_id;
  DELETE FROM kanban_stages WHERE created_by_user_id = v_created_by_user_id;
  DELETE FROM funnels WHERE created_by_user_id = v_created_by_user_id;
  DELETE FROM deals WHERE created_by_user_id = v_created_by_user_id;
  DELETE FROM plan_subscriptions WHERE user_id = v_user_id;
  DELETE FROM message_usage_tracking WHERE user_id = v_user_id;
  DELETE FROM user_whatsapp_numbers WHERE profile_id = v_user_id;
  DELETE FROM user_funnels WHERE profile_id = v_user_id;

  -- FASE 4: Deletar profile
  DELETE FROM profiles WHERE id = v_user_id;

  -- Marcar como concluído
  UPDATE account_deletion_queue
  SET
    status = 'completed',
    completed_at = now(),
    progress = json_build_object(
      'phase', 'completed',
      'total_messages', v_total_messages,
      'processed_messages', v_processed_messages,
      'total_leads', v_total_leads,
      'processed_leads', v_processed_leads
    )
  WHERE id = p_queue_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Account deletion completed successfully',
    'stats', json_build_object(
      'messages_deleted', v_processed_messages,
      'leads_deleted', v_processed_leads
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Marcar como falhou
    UPDATE account_deletion_queue
    SET status = 'failed', error_message = SQLERRM
    WHERE id = p_queue_id;

    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- Função para verificar status da deleção
CREATE OR REPLACE FUNCTION check_deletion_status(p_user_id UUID)
RETURNS json AS $$
DECLARE
  v_queue_record RECORD;
BEGIN
  SELECT * INTO v_queue_record
  FROM account_deletion_queue
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('status', 'not_found');
  END IF;

  RETURN json_build_object(
    'status', v_queue_record.status,
    'progress', v_queue_record.progress,
    'started_at', v_queue_record.started_at,
    'completed_at', v_queue_record.completed_at,
    'error_message', v_queue_record.error_message
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC para iniciar deleção assíncrona
CREATE OR REPLACE FUNCTION rpc_delete_user_account_async(p_user_id UUID)
RETURNS json AS $$
DECLARE
  v_requesting_user_id UUID;
  v_requesting_user_role TEXT;
BEGIN
  v_requesting_user_id := auth.uid();

  SELECT role INTO v_requesting_user_role
  FROM profiles WHERE id = v_requesting_user_id;

  IF v_requesting_user_id = p_user_id OR v_requesting_user_role = 'admin' THEN
    RETURN delete_user_account_async(p_user_id);
  ELSE
    RETURN json_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grants
GRANT EXECUTE ON FUNCTION delete_user_account_async(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION process_deletion_queue_item(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_deletion_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_delete_user_account_async(UUID) TO authenticated;

-- Comments
COMMENT ON FUNCTION delete_user_account_async IS 'Queues account deletion for asynchronous processing';
COMMENT ON FUNCTION process_deletion_queue_item IS 'Processes a single deletion queue item in micro-batches';
COMMENT ON FUNCTION check_deletion_status IS 'Checks the status of an ongoing account deletion';