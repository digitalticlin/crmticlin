
-- CORREÇÃO DAS FUNÇÕES SQL PARA TRABALHAR COM ESTRUTURA FLEXÍVEL

-- 1. ATUALIZAR A FUNÇÃO process_whatsapp_message PARA USAR NOVA ESTRUTURA
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
  RAISE NOTICE '[process_whatsapp_message] 🚀 Iniciando processamento: %', p_vps_instance_id;

  -- ETAPA 1: Buscar instância e validar
  SELECT id, created_by_user_id 
  INTO v_instance_id, v_user_id
  FROM public.whatsapp_instances 
  WHERE vps_instance_id = p_vps_instance_id;
  
  IF v_instance_id IS NULL THEN
    RAISE NOTICE '[process_whatsapp_message] ❌ Instância não encontrada: %', p_vps_instance_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Instance not found',
      'vps_instance_id', p_vps_instance_id
    );
  END IF;

  RAISE NOTICE '[process_whatsapp_message] ✅ Instância encontrada: % - User: %', v_instance_id, v_user_id;

  -- ETAPA 2: Formatar telefone brasileiro
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

  RAISE NOTICE '[process_whatsapp_message] 📞 Telefone formatado: %', left(v_formatted_phone, 8) || '****';

  -- ETAPA 3: Buscar funil padrão do usuário
  SELECT id INTO v_funnel_id
  FROM public.funnels 
  WHERE created_by_user_id = v_user_id 
  ORDER BY created_at ASC 
  LIMIT 1;

  -- ETAPA 4: Buscar primeiro estágio do funil
  IF v_funnel_id IS NOT NULL THEN
    SELECT id INTO v_stage_id
    FROM public.kanban_stages 
    WHERE funnel_id = v_funnel_id 
    ORDER BY order_position ASC 
    LIMIT 1;
  END IF;

  -- ETAPA 5: UPSERT do lead (buscar ou criar) com estrutura flexível
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
    whatsapp_number_id = COALESCE(EXCLUDED.whatsapp_number_id, leads.whatsapp_number_id),
    last_message_time = EXCLUDED.last_message_time,
    last_message = EXCLUDED.last_message,
    updated_at = now()
  RETURNING id INTO v_lead_id;

  RAISE NOTICE '[process_whatsapp_message] ✅ Lead processado: %', v_lead_id;

  -- ETAPA 6: Inserir mensagem com estrutura flexível
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
    COALESCE(p_media_type::media_type, 'text'::media_type),
    p_media_url,
    'realtime',
    p_external_message_id
  )
  RETURNING id INTO v_message_id;

  RAISE NOTICE '[process_whatsapp_message] ✅ Mensagem inserida: %', v_message_id;

  -- ETAPA 7: Atualizar contador de mensagens não lidas (apenas para recebidas)
  IF NOT p_from_me THEN
    UPDATE public.leads 
    SET unread_count = COALESCE(unread_count, 0) + 1
    WHERE id = v_lead_id;
    
    RAISE NOTICE '[process_whatsapp_message] ✅ Contador atualizado';
  END IF;

  -- ETAPA 8: Retornar resultado
  v_result := jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'message_id', v_message_id,
      'lead_id', v_lead_id,
      'instance_id', v_instance_id,
      'user_id', v_user_id,
      'formatted_phone', v_formatted_phone,
      'formatted_name', v_formatted_name,
      'media_type', COALESCE(p_media_type, 'text'),
      'from_me', p_from_me
    )
  );

  RAISE NOTICE '[process_whatsapp_message] ✅ Processamento concluído com sucesso';
  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[process_whatsapp_message] ❌ ERRO: % - SQLSTATE: %', SQLERRM, SQLSTATE;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE,
    'phone', p_phone,
    'vps_instance_id', p_vps_instance_id
  );
END;
$function$;

-- 2. CRIAR FUNÇÃO SIMPLIFICADA E OTIMIZADA PARA INSERÇÃO DE MENSAGENS
CREATE OR REPLACE FUNCTION public.insert_message_optimized(
  p_lead_id uuid,
  p_instance_id uuid,
  p_message_text text,
  p_from_me boolean,
  p_user_id uuid,
  p_media_type text DEFAULT 'text',
  p_media_url text DEFAULT NULL,
  p_external_message_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_message_id UUID;
BEGIN
  RAISE NOTICE '[insert_message_optimized] 💬 Inserindo mensagem otimizada';

  -- Inserir mensagem com validação mínima
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
    p_lead_id,
    p_instance_id,
    p_message_text,
    p_from_me,
    now(),
    CASE WHEN p_from_me THEN 'sent'::message_status ELSE 'received'::message_status END,
    p_user_id,
    COALESCE(p_media_type::media_type, 'text'::media_type),
    p_media_url,
    'realtime',
    p_external_message_id
  )
  RETURNING id INTO v_message_id;

  RAISE NOTICE '[insert_message_optimized] ✅ Mensagem inserida: %', v_message_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message_id', v_message_id,
    'method', 'optimized_insert'
  );
    
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[insert_message_optimized] ❌ ERRO: % - SQLSTATE: %', SQLERRM, SQLSTATE;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE,
    'method', 'optimized_insert'
  );
END;
$function$;

-- 3. FUNÇÃO PARA INCREMENTAR CONTADOR DE NÃO LIDAS
CREATE OR REPLACE FUNCTION public.increment_unread_count(p_lead_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.leads 
  SET unread_count = COALESCE(unread_count, 0) + 1,
      updated_at = now()
  WHERE id = p_lead_id;
END;
$function$;
