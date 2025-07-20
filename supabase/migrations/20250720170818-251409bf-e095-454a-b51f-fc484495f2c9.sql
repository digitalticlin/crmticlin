
-- FASE 1: CORRIGIR SEARCH PATH DAS FUNÇÕES SQL EXISTENTES
-- Recriar a função process_whatsapp_message com search_path correto
CREATE OR REPLACE FUNCTION public.process_whatsapp_message(
  p_vps_instance_id text, 
  p_phone text, 
  p_message_text text, 
  p_from_me boolean, 
  p_media_type text DEFAULT 'text'::text, 
  p_media_url text DEFAULT NULL::text, 
  p_external_message_id text DEFAULT NULL::text, 
  p_contact_name text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_instance_id UUID;
  v_user_id UUID;
  v_lead_id UUID;
  v_message_id UUID;
  v_funnel_id UUID;
  v_stage_id UUID;
  v_formatted_phone TEXT;
  v_formatted_name TEXT;
  v_result jsonb;
BEGIN
  -- ETAPA 1: Buscar instância e validar
  SELECT id, created_by_user_id 
  INTO v_instance_id, v_user_id
  FROM public.whatsapp_instances 
  WHERE vps_instance_id = p_vps_instance_id;
  
  IF v_instance_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Instance not found',
      'vps_instance_id', p_vps_instance_id
    );
  END IF;

  -- ETAPA 2: Formatar telefone brasileiro (+55 (XX) XXXXX-XXXX)
  v_formatted_phone := CASE
    WHEN p_phone LIKE '+55%' THEN p_phone
    WHEN length(regexp_replace(p_phone, '[^0-9]', '', 'g')) = 13 
         AND p_phone LIKE '55%' THEN
      '+55 (' || substring(regexp_replace(p_phone, '[^0-9]', '', 'g'), 3, 2) || ') ' ||
      substring(regexp_replace(p_phone, '[^0-9]', '', 'g'), 5, 5) || '-' ||
      substring(regexp_replace(p_phone, '[^0-9]', '', 'g'), 10, 4)
    WHEN length(regexp_replace(p_phone, '[^0-9]', '', 'g')) = 11 THEN
      '+55 (' || substring(regexp_replace(p_phone, '[^0-9]', '', 'g'), 1, 2) || ') ' ||
      substring(regexp_replace(p_phone, '[^0-9]', '', 'g'), 3, 5) || '-' ||
      substring(regexp_replace(p_phone, '[^0-9]', '', 'g'), 8, 4)
    WHEN length(regexp_replace(p_phone, '[^0-9]', '', 'g')) = 10 THEN
      '+55 (' || substring(regexp_replace(p_phone, '[^0-9]', '', 'g'), 1, 2) || ') 9' ||
      substring(regexp_replace(p_phone, '[^0-9]', '', 'g'), 3, 4) || '-' ||
      substring(regexp_replace(p_phone, '[^0-9]', '', 'g'), 7, 4)
    ELSE '+55 ' || regexp_replace(p_phone, '[^0-9]', '', 'g')
  END;

  -- ETAPA 3: Formatar nome
  v_formatted_name := COALESCE(
    NULLIF(p_contact_name, ''),
    'Contato ' || v_formatted_phone
  );

  -- ETAPA 4: Buscar funil padrão do usuário
  SELECT id INTO v_funnel_id
  FROM public.funnels 
  WHERE created_by_user_id = v_user_id 
  ORDER BY created_at ASC 
  LIMIT 1;

  -- ETAPA 5: Buscar primeiro estágio do funil
  SELECT id INTO v_stage_id
  FROM public.kanban_stages 
  WHERE funnel_id = v_funnel_id 
  ORDER BY order_position ASC 
  LIMIT 1;

  -- ETAPA 6: UPSERT do lead (buscar ou criar)
  INSERT INTO public.leads (
    phone, 
    name, 
    whatsapp_number_id, 
    created_by_user_id,
    funnel_id,
    kanban_stage_id,
    last_message_time,
    last_message,
    import_source
  )
  VALUES (
    v_formatted_phone,
    v_formatted_name,
    v_instance_id,
    v_user_id,
    v_funnel_id,
    v_stage_id,
    now(),
    p_message_text,
    'realtime'
  )
  ON CONFLICT (phone, created_by_user_id) 
  DO UPDATE SET
    whatsapp_number_id = EXCLUDED.whatsapp_number_id,
    last_message_time = EXCLUDED.last_message_time,
    last_message = EXCLUDED.last_message,
    updated_at = now()
  RETURNING id INTO v_lead_id;

  -- ETAPA 7: Inserir mensagem
  INSERT INTO public.messages (
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
    p_from_me,
    now(),
    CASE WHEN p_from_me THEN 'sent'::message_status ELSE 'received'::message_status END,
    v_user_id,
    p_media_type::media_type,
    p_media_url,
    'realtime',
    p_external_message_id
  )
  RETURNING id INTO v_message_id;

  -- ETAPA 8: Atualizar contador de mensagens não lidas (apenas para recebidas)
  IF NOT p_from_me THEN
    UPDATE public.leads 
    SET unread_count = unread_count + 1
    WHERE id = v_lead_id;
  END IF;

  -- ETAPA 9: Retornar resultado
  v_result := jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'message_id', v_message_id,
      'lead_id', v_lead_id,
      'instance_id', v_instance_id,
      'user_id', v_user_id,
      'formatted_phone', v_formatted_phone,
      'formatted_name', v_formatted_name,
      'media_type', p_media_type,
      'from_me', p_from_me
    )
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE,
    'phone', p_phone,
    'vps_instance_id', p_vps_instance_id
  );
END;
$function$;

-- FASE 2: CRIAR FUNÇÃO SQL DEDICADA ULTRA-SEGURA PARA MENSAGENS
CREATE OR REPLACE FUNCTION public.insert_whatsapp_message_safe(
  p_vps_instance_id text,
  p_phone text,
  p_message_text text,
  p_from_me boolean,
  p_media_type text DEFAULT 'text',
  p_media_url text DEFAULT NULL,
  p_external_message_id text DEFAULT NULL,
  p_contact_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_instance_id UUID;
  v_user_id UUID;
  v_lead_id UUID;
  v_message_id UUID;
  v_funnel_id UUID;
  v_stage_id UUID;
  v_formatted_phone TEXT;
  v_formatted_name TEXT;
  v_existing_lead_id UUID;
BEGIN
  -- Log de início
  RAISE NOTICE '[SQL Function] Iniciando processamento seguro para instância: %', p_vps_instance_id;

  -- 1. Buscar instância com search_path explícito
  SELECT wi.id, wi.created_by_user_id 
  INTO v_instance_id, v_user_id
  FROM public.whatsapp_instances wi
  WHERE wi.vps_instance_id = p_vps_instance_id;
  
  IF v_instance_id IS NULL THEN
    RAISE NOTICE '[SQL Function] Instância não encontrada: %', p_vps_instance_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Instance not found',
      'vps_instance_id', p_vps_instance_id
    );
  END IF;

  RAISE NOTICE '[SQL Function] Instância encontrada: % - User: %', v_instance_id, v_user_id;

  -- 2. Formatar telefone
  v_formatted_phone := CASE
    WHEN p_phone LIKE '+55%' THEN p_phone
    WHEN length(regexp_replace(p_phone, '[^0-9]', '', 'g')) = 13 
         AND p_phone LIKE '55%' THEN
      '+55 (' || substring(regexp_replace(p_phone, '[^0-9]', '', 'g'), 3, 2) || ') ' ||
      substring(regexp_replace(p_phone, '[^0-9]', '', 'g'), 5, 5) || '-' ||
      substring(regexp_replace(p_phone, '[^0-9]', '', 'g'), 10, 4)
    WHEN length(regexp_replace(p_phone, '[^0-9]', '', 'g')) = 11 THEN
      '+55 (' || substring(regexp_replace(p_phone, '[^0-9]', '', 'g'), 1, 2) || ') ' ||
      substring(regexp_replace(p_phone, '[^0-9]', '', 'g'), 3, 5) || '-' ||
      substring(regexp_replace(p_phone, '[^0-9]', '', 'g'), 8, 4)
    WHEN length(regexp_replace(p_phone, '[^0-9]', '', 'g')) = 10 THEN
      '+55 (' || substring(regexp_replace(p_phone, '[^0-9]', '', 'g'), 1, 2) || ') 9' ||
      substring(regexp_replace(p_phone, '[^0-9]', '', 'g'), 3, 4) || '-' ||
      substring(regexp_replace(p_phone, '[^0-9]', '', 'g'), 7, 4)
    ELSE '+55 ' || regexp_replace(p_phone, '[^0-9]', '', 'g')
  END;

  v_formatted_name := COALESCE(NULLIF(p_contact_name, ''), 'Contato ' || v_formatted_phone);

  RAISE NOTICE '[SQL Function] Telefone formatado: %', left(v_formatted_phone, 8) || '****';

  -- 3. Buscar lead existente
  SELECT l.id INTO v_existing_lead_id
  FROM public.leads l
  WHERE l.phone = v_formatted_phone 
    AND l.created_by_user_id = v_user_id
  LIMIT 1;

  IF v_existing_lead_id IS NOT NULL THEN
    -- Lead existe - atualizar
    RAISE NOTICE '[SQL Function] Lead existente encontrado: %', v_existing_lead_id;
    
    UPDATE public.leads 
    SET 
      whatsapp_number_id = v_instance_id,
      last_message_time = now(),
      last_message = p_message_text,
      updated_at = now()
    WHERE id = v_existing_lead_id;
    
    v_lead_id := v_existing_lead_id;
    RAISE NOTICE '[SQL Function] Lead atualizado com sucesso';
  ELSE
    -- Lead não existe - criar novo
    RAISE NOTICE '[SQL Function] Criando novo lead';
    
    -- Buscar funil e estágio padrão
    SELECT f.id INTO v_funnel_id
    FROM public.funnels f
    WHERE f.created_by_user_id = v_user_id 
    ORDER BY f.created_at ASC 
    LIMIT 1;

    SELECT ks.id INTO v_stage_id  
    FROM public.kanban_stages ks
    WHERE ks.funnel_id = v_funnel_id 
    ORDER BY ks.order_position ASC 
    LIMIT 1;

    INSERT INTO public.leads (
      phone, 
      name, 
      whatsapp_number_id, 
      created_by_user_id,
      funnel_id,
      kanban_stage_id,
      last_message_time,
      last_message,
      import_source
    )
    VALUES (
      v_formatted_phone,
      v_formatted_name,
      v_instance_id,
      v_user_id,
      v_funnel_id,
      v_stage_id,
      now(),
      p_message_text,
      'realtime'
    )
    RETURNING id INTO v_lead_id;
    
    RAISE NOTICE '[SQL Function] Novo lead criado: %', v_lead_id;
  END IF;

  -- 4. Inserir mensagem com search_path explícito
  RAISE NOTICE '[SQL Function] Inserindo mensagem para lead: %', v_lead_id;
  
  INSERT INTO public.messages (
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
    p_from_me,
    now(),
    CASE WHEN p_from_me THEN 'sent'::message_status ELSE 'received'::message_status END,
    v_user_id,
    p_media_type::media_type,
    p_media_url,
    'realtime',
    p_external_message_id
  )
  RETURNING id INTO v_message_id;

  RAISE NOTICE '[SQL Function] Mensagem inserida com sucesso: %', v_message_id;

  -- 5. Atualizar contador não lidas
  IF NOT p_from_me THEN
    UPDATE public.leads 
    SET unread_count = COALESCE(unread_count, 0) + 1
    WHERE id = v_lead_id;
    
    RAISE NOTICE '[SQL Function] Contador de não lidas atualizado';
  END IF;

  -- 6. Retornar sucesso
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'message_id', v_message_id,
      'lead_id', v_lead_id,
      'instance_id', v_instance_id,
      'user_id', v_user_id,
      'formatted_phone', v_formatted_phone,
      'formatted_name', v_formatted_name,
      'media_type', p_media_type,
      'from_me', p_from_me,
      'was_existing_lead', v_existing_lead_id IS NOT NULL
    )
  );

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[SQL Function] ERRO: % - SQLSTATE: %', SQLERRM, SQLSTATE;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE,
    'context', 'insert_whatsapp_message_safe',
    'phone', p_phone,
    'vps_instance_id', p_vps_instance_id
  );
END;
$function$;
