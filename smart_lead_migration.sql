-- Função de migração inteligente de leads
-- Atualiza lead para nova instância e migra mensagens apenas se mesmo número

CREATE OR REPLACE FUNCTION smart_lead_migration(
  p_phone TEXT,
  p_new_instance_id UUID,
  p_user_id UUID
) RETURNS JSON AS $$
DECLARE
  v_existing_lead RECORD;
  v_old_instance RECORD;
  v_new_instance RECORD;
  v_same_number BOOLEAN := FALSE;
  v_messages_migrated INTEGER := 0;
  v_result JSON;
BEGIN
  -- 1. Buscar lead existente por telefone + usuário
  SELECT * INTO v_existing_lead
  FROM leads 
  WHERE phone = p_phone 
  AND created_by_user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- 2. Se não existe lead, retornar para criar novo
  IF v_existing_lead.id IS NULL THEN
    RETURN json_build_object(
      'action', 'create_new',
      'lead_exists', false
    );
  END IF;
  
  -- 3. Buscar informações das instâncias
  IF v_existing_lead.whatsapp_number_id IS NOT NULL THEN
    SELECT * INTO v_old_instance
    FROM whatsapp_instances 
    WHERE id = v_existing_lead.whatsapp_number_id;
  END IF;
  
  SELECT * INTO v_new_instance
  FROM whatsapp_instances 
  WHERE id = p_new_instance_id;
  
  -- 4. Verificar se é o mesmo número
  IF v_old_instance.phone IS NOT NULL 
     AND v_new_instance.phone IS NOT NULL 
     AND v_old_instance.phone = v_new_instance.phone THEN
    v_same_number := TRUE;
  END IF;
  
  -- 5. Atualizar lead para nova instância (SEMPRE)
  UPDATE leads 
  SET 
    whatsapp_number_id = p_new_instance_id,
    updated_at = NOW()
  WHERE id = v_existing_lead.id;
  
  -- 6. Migrar mensagens APENAS se mesmo número
  IF v_same_number THEN
    UPDATE messages 
    SET whatsapp_number_id = p_new_instance_id
    WHERE lead_id = v_existing_lead.id
    AND (whatsapp_number_id IS NULL OR whatsapp_number_id = v_existing_lead.whatsapp_number_id);
    
    GET DIAGNOSTICS v_messages_migrated = ROW_COUNT;
  END IF;
  
  -- 7. Retornar resultado
  v_result := json_build_object(
    'action', 'updated_existing',
    'lead_exists', true,
    'lead_id', v_existing_lead.id,
    'old_instance_id', v_existing_lead.whatsapp_number_id,
    'new_instance_id', p_new_instance_id,
    'same_number', v_same_number,
    'messages_migrated', v_messages_migrated,
    'old_phone_number', COALESCE(v_old_instance.phone, 'unknown'),
    'new_phone_number', COALESCE(v_new_instance.phone, 'unknown')
  );
  
  RAISE NOTICE 'Smart Migration: % - Same number: % - Messages migrated: %', 
    p_phone, v_same_number, v_messages_migrated;
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in smart_lead_migration: %', SQLERRM;
    RETURN json_build_object(
      'action', 'error',
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- Função auxiliar para buscar ou criar lead com migração inteligente
CREATE OR REPLACE FUNCTION find_or_create_lead_smart(
  p_phone TEXT,
  p_instance_id UUID,
  p_user_id UUID,
  p_lead_name TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_migration_result JSON;
  v_lead_id UUID;
  v_funnel_id UUID;
BEGIN
  -- 1. Tentar migração inteligente
  SELECT smart_lead_migration(p_phone, p_instance_id, p_user_id) INTO v_migration_result;
  
  -- 2. Se lead existe, retornar ID
  IF (v_migration_result->>'action') = 'updated_existing' THEN
    RETURN (v_migration_result->>'lead_id')::UUID;
  END IF;
  
  -- 3. Se não existe, criar novo lead
  IF (v_migration_result->>'action') = 'create_new' THEN
    -- Buscar funil padrão do usuário
    SELECT id INTO v_funnel_id
    FROM funnels 
    WHERE created_by_user_id = p_user_id
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Criar novo lead
    INSERT INTO leads (
      phone,
      name,
      whatsapp_number_id,
      created_by_user_id,
      funnel_id,
      last_message,
      last_message_time,
      created_at
    ) VALUES (
      p_phone,
      COALESCE(p_lead_name, 'Contato ' || p_phone),
      p_instance_id,
      p_user_id,
      v_funnel_id,
      'Conversa iniciada',
      NOW(),
      NOW()
    ) RETURNING id INTO v_lead_id;
    
    RAISE NOTICE 'New lead created: % for phone %', v_lead_id, p_phone;
    RETURN v_lead_id;
  END IF;
  
  -- 4. Se erro, retornar NULL
  RAISE NOTICE 'Error in find_or_create_lead_smart: %', v_migration_result->>'error';
  RETURN NULL;
  
END;
$$ LANGUAGE plpgsql;

-- Testar a função com dados reais
SELECT smart_lead_migration(
  '556296615422',
  '8c0d1fa7-babb-4c69-9428-dc4ea65b411a',
  '712e7708-2299-4a00-9128-577c8f113ca4'
); 