-- ============================================
-- SISTEMA DE DELEÇÃO EM LOTES PARA EVITAR TIMEOUT
-- ============================================
-- Esta migration cria funções para deletar usuários com muito conteúdo sem timeout

-- Função para deletar mensagens em lotes
CREATE OR REPLACE FUNCTION delete_messages_batch(p_user_id UUID, p_batch_size INTEGER DEFAULT 1000)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_total_deleted INTEGER := 0;
BEGIN
  LOOP
    -- Deletar um lote de mensagens
    DELETE FROM messages
    WHERE id IN (
      SELECT id FROM messages
      WHERE created_by_user_id = p_user_id
      LIMIT p_batch_size
    );

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    v_total_deleted := v_total_deleted + v_deleted_count;

    -- Sair do loop se não há mais registros para deletar
    EXIT WHEN v_deleted_count = 0;

    -- Log do progresso
    RAISE NOTICE 'Deletadas % mensagens (total: %)', v_deleted_count, v_total_deleted;

    -- Pequena pausa para evitar travamento
    PERFORM pg_sleep(0.1);
  END LOOP;

  RETURN v_total_deleted;
END;
$$ LANGUAGE plpgsql;

-- Função para deletar leads em lotes
CREATE OR REPLACE FUNCTION delete_leads_batch(p_user_id UUID, p_batch_size INTEGER DEFAULT 500)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_total_deleted INTEGER := 0;
BEGIN
  LOOP
    -- Deletar um lote de leads (mensagens e atividades serão deletadas por CASCADE)
    DELETE FROM leads
    WHERE id IN (
      SELECT id FROM leads
      WHERE created_by_user_id = p_user_id
      LIMIT p_batch_size
    );

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    v_total_deleted := v_total_deleted + v_deleted_count;

    EXIT WHEN v_deleted_count = 0;

    RAISE NOTICE 'Deletados % leads (total: %)', v_deleted_count, v_total_deleted;
    PERFORM pg_sleep(0.1);
  END LOOP;

  RETURN v_total_deleted;
END;
$$ LANGUAGE plpgsql;

-- Função principal para deletar usuário em lotes
CREATE OR REPLACE FUNCTION delete_user_account_batch(p_user_id UUID)
RETURNS json AS $$
DECLARE
  v_messages_deleted INTEGER;
  v_leads_deleted INTEGER;
  v_created_by_user_id UUID;
  v_result json;
  v_start_time TIMESTAMP;
BEGIN
  v_start_time := clock_timestamp();

  -- Buscar o created_by_user_id
  SELECT COALESCE(created_by_user_id, id) INTO v_created_by_user_id
  FROM profiles
  WHERE id = p_user_id;

  IF v_created_by_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  RAISE NOTICE 'Iniciando deleção em lotes para usuário %', p_user_id;

  -- 1. Deletar mensagens em lotes (maior volume)
  RAISE NOTICE 'Deletando mensagens em lotes...';
  SELECT delete_messages_batch(v_created_by_user_id) INTO v_messages_deleted;

  -- 2. Deletar broadcast_history em lotes
  DELETE FROM broadcast_history bh
  WHERE bh.lead_id IN (SELECT id FROM leads WHERE created_by_user_id = v_created_by_user_id);

  -- 3. Deletar broadcast_queue em lotes
  DELETE FROM broadcast_queue bq
  WHERE bq.lead_id IN (SELECT id FROM leads WHERE created_by_user_id = v_created_by_user_id);

  -- 4. Deletar lead_tags
  DELETE FROM lead_tags lt
  WHERE lt.lead_id IN (SELECT id FROM leads WHERE created_by_user_id = v_created_by_user_id);

  -- 5. Deletar leads em lotes
  RAISE NOTICE 'Deletando leads em lotes...';
  SELECT delete_leads_batch(v_created_by_user_id) INTO v_leads_deleted;

  -- 6. Deletar outras tabelas (menor volume)
  DELETE FROM broadcast_campaigns WHERE created_by_user_id = v_created_by_user_id;
  DELETE FROM tags WHERE created_by_user_id = v_created_by_user_id;
  DELETE FROM whatsapp_instances WHERE created_by_user_id = v_created_by_user_id;
  DELETE FROM ai_agents WHERE created_by_user_id = v_created_by_user_id;
  DELETE FROM kanban_stages WHERE created_by_user_id = v_created_by_user_id;
  DELETE FROM funnels WHERE created_by_user_id = v_created_by_user_id;
  DELETE FROM deals WHERE created_by_user_id = v_created_by_user_id;

  -- 7. Deletar dados de billing/usage
  DELETE FROM plan_subscriptions WHERE user_id = p_user_id;
  DELETE FROM message_usage_tracking WHERE user_id = p_user_id;

  -- Deletar tabelas condicionais
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'free_trial_usage') THEN
    DELETE FROM free_trial_usage WHERE user_id = p_user_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_history') THEN
    DELETE FROM payment_history WHERE user_id = p_user_id;
  END IF;

  -- 8. Deletar relações de usuário
  DELETE FROM user_whatsapp_numbers WHERE profile_id = p_user_id;
  DELETE FROM user_funnels WHERE profile_id = p_user_id;

  -- 9. Por último, deletar o profile
  DELETE FROM profiles WHERE id = p_user_id;

  v_result := json_build_object(
    'success', true,
    'message', format('Account deleted successfully for user %s', p_user_id),
    'details', json_build_object(
      'messages_deleted', v_messages_deleted,
      'leads_deleted', v_leads_deleted,
      'execution_time_seconds', EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time))
    )
  );

  RAISE NOTICE 'Deleção concluída em % segundos', EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time));
  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'execution_time_seconds', EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time))
    );
END;
$$ LANGUAGE plpgsql;

-- RPC seguro para deletar conta em lotes
CREATE OR REPLACE FUNCTION rpc_delete_user_account_batch(p_user_id UUID)
RETURNS json AS $$
DECLARE
  v_requesting_user_id UUID;
  v_requesting_user_role TEXT;
BEGIN
  -- Validar permissões
  v_requesting_user_id := auth.uid();

  SELECT role INTO v_requesting_user_role
  FROM profiles
  WHERE id = v_requesting_user_id;

  -- Verificar se é o próprio usuário ou admin
  IF v_requesting_user_id = p_user_id OR v_requesting_user_role = 'admin' THEN
    RETURN delete_user_account_batch(p_user_id);
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient permissions to delete this account'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION delete_messages_batch(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_leads_batch(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_account_batch(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_delete_user_account_batch(UUID) TO authenticated;

-- Comments
COMMENT ON FUNCTION delete_user_account_batch IS 'Deletes a user account in batches to avoid timeouts with large datasets';
COMMENT ON FUNCTION rpc_delete_user_account_batch IS 'RPC endpoint for batch deletion with permission validation';