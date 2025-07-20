
-- DIAGNÓSTICO E CORREÇÃO DA FUNÇÃO SQL
-- Recriar a função com diagnósticos completos

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
-- FORÇAR search_path explicitamente
SET search_path = 'public'
AS $function$
DECLARE
  v_current_schema TEXT;
  v_search_path TEXT;
  v_table_exists BOOLEAN;
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
  -- DIAGNÓSTICO 1: Verificar contexto atual
  SELECT current_schema() INTO v_current_schema;
  SHOW search_path INTO v_search_path;
  
  RAISE NOTICE '[DIAGNÓSTICO] Schema atual: %, Search path: %', v_current_schema, v_search_path;
  
  -- DIAGNÓSTICO 2: Verificar se tabela leads existe
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'leads'
  ) INTO v_table_exists;
  
  RAISE NOTICE '[DIAGNÓSTICO] Tabela leads existe: %', v_table_exists;
  
  -- DIAGNÓSTICO 3: Forçar schema público
  IF NOT v_table_exists THEN
    RAISE NOTICE '[DIAGNÓSTICO] Tentando forçar schema público...';
    PERFORM set_config('search_path', 'public', true);
  END IF;

  RAISE NOTICE '[SQL Function] Iniciando processamento seguro para instância: %', p_vps_instance_id;

  -- 1. Buscar instância com schema explícito
  SELECT wi.id, wi.created_by_user_id 
  INTO v_instance_id, v_user_id
  FROM public.whatsapp_instances wi
  WHERE wi.vps_instance_id = p_vps_instance_id;
  
  IF v_instance_id IS NULL THEN
    RAISE NOTICE '[SQL Function] Instância não encontrada: %', p_vps_instance_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Instance not found',
      'vps_instance_id', p_vps_instance_id,
      'diagnostics', jsonb_build_object(
        'current_schema', v_current_schema,
        'search_path', v_search_path,
        'leads_table_exists', v_table_exists
      )
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

  -- 3. DIAGNÓSTICO: Tentar buscar lead existente com schema explícito
  BEGIN
    SELECT l.id INTO v_existing_lead_id
    FROM public.leads l
    WHERE l.phone = v_formatted_phone 
      AND l.created_by_user_id = v_user_id
    LIMIT 1;
    
    RAISE NOTICE '[SQL Function] Busca de lead existente: SUCCESS';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[SQL Function] ERRO na busca de lead: % - SQLSTATE: %', SQLERRM, SQLSTATE;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Error searching existing lead: ' || SQLERRM,
      'sqlstate', SQLSTATE,
      'context', 'lead_search',
      'diagnostics', jsonb_build_object(
        'current_schema', v_current_schema,
        'search_path', v_search_path,
        'leads_table_exists', v_table_exists,
        'formatted_phone', v_formatted_phone
      )
    );
  END;

  IF v_existing_lead_id IS NOT NULL THEN
    -- Lead existe - atualizar
    RAISE NOTICE '[SQL Function] Lead existente encontrado: %', v_existing_lead_id;
    
    BEGIN
      UPDATE public.leads 
      SET 
        whatsapp_number_id = v_instance_id,
        last_message_time = now(),
        last_message = p_message_text,
        updated_at = now()
      WHERE id = v_existing_lead_id;
      
      v_lead_id := v_existing_lead_id;
      RAISE NOTICE '[SQL Function] Lead atualizado com sucesso';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '[SQL Function] ERRO na atualização de lead: % - SQLSTATE: %', SQLERRM, SQLSTATE;
      
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Error updating lead: ' || SQLERRM,
        'sqlstate', SQLSTATE,
        'context', 'lead_update'
      );
    END;
  ELSE
    -- Lead não existe - criar novo COM DIAGNÓSTICOS
    RAISE NOTICE '[SQL Function] Criando novo lead';
    
    -- Buscar funil e estágio padrão
    BEGIN
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
      
      RAISE NOTICE '[SQL Function] Funil: %, Estágio: %', v_funnel_id, v_stage_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '[SQL Function] ERRO buscando funil/estágio: % - SQLSTATE: %', SQLERRM, SQLSTATE;
    END;

    -- TENTATIVA DE INSERÇÃO COM DIAGNÓSTICO COMPLETO
    BEGIN
      RAISE NOTICE '[SQL Function] TENTANDO INSERIR LEAD na tabela public.leads...';
      
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
      
      RAISE NOTICE '[SQL Function] Novo lead criado com SUCESSO: %', v_lead_id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '[SQL Function] ❌ ERRO FATAL INSERINDO LEAD: % - SQLSTATE: %', SQLERRM, SQLSTATE;
      
      -- Retornar erro detalhado
      RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'sqlstate', SQLSTATE,
        'context', 'lead_insert_failure',
        'phone', p_phone,
        'vps_instance_id', p_vps_instance_id,
        'diagnostics', jsonb_build_object(
          'current_schema', v_current_schema,
          'search_path', v_search_path,
          'leads_table_exists', v_table_exists,
          'formatted_phone', v_formatted_phone,
          'instance_id', v_instance_id,
          'user_id', v_user_id,
          'funnel_id', v_funnel_id,
          'stage_id', v_stage_id
        )
      );
    END;
  END IF;

  -- 4. Inserir mensagem
  BEGIN
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
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[SQL Function] ERRO inserindo mensagem: % - SQLSTATE: %', SQLERRM, SQLSTATE;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Message insert failed: ' || SQLERRM,
      'sqlstate', SQLSTATE,
      'context', 'message_insert'
    );
  END;

  -- 5. Atualizar contador não lidas
  IF NOT p_from_me THEN
    UPDATE public.leads 
    SET unread_count = COALESCE(unread_count, 0) + 1
    WHERE id = v_lead_id;
    
    RAISE NOTICE '[SQL Function] Contador de não lidas atualizado';
  END IF;

  -- 6. Retornar sucesso com diagnósticos
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
    ),
    'diagnostics', jsonb_build_object(
      'current_schema', v_current_schema,
      'search_path', v_search_path,
      'leads_table_exists', v_table_exists
    )
  );

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[SQL Function] ERRO GERAL: % - SQLSTATE: %', SQLERRM, SQLSTATE;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE,
    'context', 'general_exception',
    'phone', p_phone,
    'vps_instance_id', p_vps_instance_id,
    'diagnostics', jsonb_build_object(
      'current_schema', COALESCE(v_current_schema, 'unknown'),
      'search_path', COALESCE(v_search_path, 'unknown'),
      'leads_table_exists', COALESCE(v_table_exists, false)
    )
  );
END;
$function$;
