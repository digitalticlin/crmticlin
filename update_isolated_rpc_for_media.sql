-- ========================================
-- ATUALIZAR RPC ISOLADA PARA SUPORTAR MÍDIA
-- ========================================

-- Dropar função existente
DROP FUNCTION IF EXISTS public.save_sent_message_only(text, text, text, text, text);

-- Criar nova versão com suporte a mídia
CREATE OR REPLACE FUNCTION public.save_sent_message_only(
  p_vps_instance_id text,
  p_phone text,
  p_message_text text,
  p_external_message_id text DEFAULT NULL,
  p_contact_name text DEFAULT NULL,
  p_media_type text DEFAULT 'text',
  p_media_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_instance_id UUID;
  v_user_id UUID;
  v_lead_id UUID;
  v_message_id UUID;
  v_funnel_id UUID;
  v_stage_id UUID;
  v_formatted_phone TEXT;
  v_contact_name TEXT;
  v_media_cache_id UUID;
BEGIN
  -- ✅ BYPASSE TOTAL DO RLS
  SET LOCAL row_security = off;
  
  RAISE NOTICE '[SENT_MESSAGE_ONLY] 🚀 Salvando mensagem ENVIADA (%): %', p_media_type, p_vps_instance_id;

  -- ETAPA 1: Buscar instância
  SELECT id, created_by_user_id 
  INTO v_instance_id, v_user_id
  FROM whatsapp_instances 
  WHERE vps_instance_id = p_vps_instance_id;
  
  IF v_instance_id IS NULL THEN
    RAISE NOTICE '[SENT_MESSAGE_ONLY] ❌ Instância não encontrada: %', p_vps_instance_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Instance not found',
      'vps_instance_id', p_vps_instance_id
    );
  END IF;

  RAISE NOTICE '[SENT_MESSAGE_ONLY] ✅ Instância encontrada: % - User: %', v_instance_id, v_user_id;

  -- ETAPA 2: Formatar telefone
  v_formatted_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
  v_contact_name := COALESCE(NULLIF(p_contact_name, ''), 'Contato ' || v_formatted_phone);

  -- ETAPA 3: Buscar funil padrão do usuário
  SELECT id INTO v_funnel_id
  FROM funnels 
  WHERE created_by_user_id = v_user_id 
  ORDER BY created_at ASC 
  LIMIT 1;

  -- ETAPA 4: Buscar primeiro estágio do funil
  IF v_funnel_id IS NOT NULL THEN
    SELECT id INTO v_stage_id
    FROM kanban_stages 
    WHERE funnel_id = v_funnel_id 
    ORDER BY order_position ASC 
    LIMIT 1;
  END IF;

  -- ETAPA 5: Buscar ou criar lead
  SELECT id INTO v_lead_id
  FROM leads 
  WHERE phone = v_formatted_phone 
    AND created_by_user_id = v_user_id;

  IF v_lead_id IS NULL THEN
    RAISE NOTICE '[SENT_MESSAGE_ONLY] ➕ Criando novo lead...';
    
    INSERT INTO leads (
      phone, 
      name, 
      whatsapp_number_id, 
      created_by_user_id,
      funnel_id,
      kanban_stage_id,
      last_message_time,
      last_message,
      import_source,
      unread_count
    )
    VALUES (
      v_formatted_phone,
      v_contact_name,
      v_instance_id,
      v_user_id,
      v_funnel_id,
      v_stage_id,
      now(),
      p_message_text,
      'realtime',
      0  -- ✅ MENSAGEM ENVIADA = 0 não lidas
    )
    RETURNING id INTO v_lead_id;

    RAISE NOTICE '[SENT_MESSAGE_ONLY] ✅ Novo lead criado: %', v_lead_id;
  ELSE
    RAISE NOTICE '[SENT_MESSAGE_ONLY] 🔄 Atualizando lead existente: %', v_lead_id;
    
    UPDATE leads 
    SET 
      name = COALESCE(NULLIF(p_contact_name, ''), name),
      whatsapp_number_id = v_instance_id,
      funnel_id = COALESCE(v_funnel_id, funnel_id),
      kanban_stage_id = COALESCE(v_stage_id, kanban_stage_id),
      last_message_time = now(),
      last_message = p_message_text,
      -- ✅ NÃO incrementar unread_count para mensagens enviadas
      updated_at = now()
    WHERE id = v_lead_id;
  END IF;

  -- ETAPA 6: Inserir mensagem ENVIADA (from_me = TRUE) COM MÍDIA
  INSERT INTO messages (
    lead_id,
    whatsapp_number_id,
    text,
    from_me,
    timestamp,
    status,
    created_by_user_id,
    media_type,
    media_url,
    import_source,
    external_message_id
  )
  VALUES (
    v_lead_id,
    v_instance_id,
    p_message_text,
    true,  -- ✅ SEMPRE TRUE para mensagens enviadas
    now(),
    'sent'::message_status,  -- ✅ STATUS SENT
    v_user_id,
    COALESCE(p_media_type::media_type, 'text'::media_type),
    p_media_url,
    'messaging_service',  -- ✅ FONTE DIFERENCIADA
    p_external_message_id
  )
  RETURNING id INTO v_message_id;

  RAISE NOTICE '[SENT_MESSAGE_ONLY] ✅ Mensagem ENVIADA inserida: %', v_message_id;

  -- ETAPA 7: SALVAR NA MEDIA_CACHE SE HOUVER URL DE MÍDIA
  IF p_media_url IS NOT NULL AND p_media_type != 'text' THEN
    RAISE NOTICE '[SENT_MESSAGE_ONLY] 💾 Salvando mídia no cache...';
    
    INSERT INTO media_cache (
      message_id,
      original_url,
      cached_url,
      base64_data,
      media_type,
      external_message_id
    )
    VALUES (
      v_message_id,
      p_media_url,
      p_media_url, -- URL será a mesma inicialmente
      NULL, -- Base64 será processado posteriormente se necessário
      COALESCE(p_media_type::media_type, 'text'::media_type),
      p_external_message_id
    )
    RETURNING id INTO v_media_cache_id;

    RAISE NOTICE '[SENT_MESSAGE_ONLY] ✅ Mídia salva no cache: %', v_media_cache_id;
  END IF;

  -- ETAPA 8: Retornar resultado específico
  RETURN jsonb_build_object(
    'success', true,
    'message_id', v_message_id,
    'lead_id', v_lead_id,
    'instance_id', v_instance_id,
    'user_id', v_user_id,
    'from_me', true,
    'media_type', p_media_type,
    'media_url', p_media_url,
    'media_cache_id', v_media_cache_id,
    'source', 'messaging_service_isolated'
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '[SENT_MESSAGE_ONLY] ❌ ERRO: % %', SQLSTATE, SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE
    );
END;
$function$;

-- Garantir permissões específicas
GRANT EXECUTE ON FUNCTION public.save_sent_message_only(text, text, text, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.save_sent_message_only(text, text, text, text, text, text, text) TO authenticated; 