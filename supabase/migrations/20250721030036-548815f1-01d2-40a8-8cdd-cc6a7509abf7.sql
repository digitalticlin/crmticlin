
-- CORREÇÃO DEFINITIVA: BYPASSE TOTAL DO RLS
-- Adicionar SET LOCAL row_security = off; no início da função

CREATE OR REPLACE FUNCTION public.save_whatsapp_message_service_role(
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
  v_current_schema TEXT;
  v_search_path TEXT;
  v_tables_check TEXT;
  v_rls_status TEXT;
BEGIN
  -- ✅ BYPASSE TOTAL DO RLS - CORREÇÃO DEFINITIVA
  SET LOCAL row_security = off;
  
  -- Verificar se RLS foi desabilitado
  SELECT current_setting('row_security') INTO v_rls_status;
  
  -- DIAGNÓSTICO COMPLETO DE CONTEXTO
  SELECT current_schema() INTO v_current_schema;
  SHOW search_path INTO v_search_path;
  
  -- Verificar se tabelas existem no esquema público
  SELECT string_agg(table_name, ', ') INTO v_tables_check
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('leads', 'messages', 'whatsapp_instances', 'funnels', 'kanban_stages');
  
  RAISE NOTICE '[SERVICE_ROLE] 🔍 DIAGNÓSTICO COMPLETO - Schema: %, Path: %, RLS: %, Tabelas: %', 
    v_current_schema, v_search_path, v_rls_status, v_tables_check;

  -- Log de início com diagnóstico
  RAISE NOTICE '[SERVICE_ROLE] 🚀 Iniciando com RLS DESABILITADO para: %', p_vps_instance_id;

  -- ETAPA 1: Buscar instância com referência absoluta (SEM RLS)
  SELECT id, created_by_user_id 
  INTO v_instance_id, v_user_id
  FROM public.whatsapp_instances 
  WHERE vps_instance_id = p_vps_instance_id;
  
  IF v_instance_id IS NULL THEN
    RAISE NOTICE '[SERVICE_ROLE] ❌ Instância não encontrada: %', p_vps_instance_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Instance not found',
      'vps_instance_id', p_vps_instance_id,
      'method', 'service_role_rls_disabled',
      'diagnostics', jsonb_build_object(
        'schema', v_current_schema,
        'search_path', v_search_path,
        'rls_status', v_rls_status,
        'tables_found', v_tables_check
      )
    );
  END IF;

  RAISE NOTICE '[SERVICE_ROLE] ✅ Instância encontrada: % - User: %', v_instance_id, v_user_id;

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
    ELSE '+55 ' || regexp_replace(p_phone, '[^0-9]', '', 'g')
  END;

  -- Definir nome do contato
  v_contact_name := COALESCE(NULLIF(p_contact_name, ''), 'Contato ' || v_formatted_phone);

  RAISE NOTICE '[SERVICE_ROLE] 📞 Telefone formatado: %', left(v_formatted_phone, 8) || '****';

  -- ETAPA 3: Buscar funil padrão do usuário (SEM RLS)
  SELECT id INTO v_funnel_id
  FROM public.funnels 
  WHERE created_by_user_id = v_user_id 
  ORDER BY created_at ASC 
  LIMIT 1;

  RAISE NOTICE '[SERVICE_ROLE] 🎯 Funil encontrado: %', v_funnel_id;

  -- ETAPA 4: Buscar primeiro estágio do funil (SEM RLS)
  IF v_funnel_id IS NOT NULL THEN
    SELECT id INTO v_stage_id
    FROM public.kanban_stages 
    WHERE funnel_id = v_funnel_id 
    ORDER BY order_position ASC 
    LIMIT 1;
    
    RAISE NOTICE '[SERVICE_ROLE] 📊 Estágio encontrado: %', v_stage_id;
  END IF;

  -- ETAPA 5: Buscar ou criar lead (SEM RLS)
  RAISE NOTICE '[SERVICE_ROLE] 🔍 Buscando lead para telefone: %', left(v_formatted_phone, 8) || '****';
  
  SELECT id INTO v_lead_id
  FROM public.leads 
  WHERE phone = v_formatted_phone 
    AND created_by_user_id = v_user_id;

  IF v_lead_id IS NULL THEN
    RAISE NOTICE '[SERVICE_ROLE] ➕ Criando novo lead...';
    
    -- Criar novo lead (SEM RLS)
    INSERT INTO public.leads (
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
      CASE WHEN p_from_me THEN 0 ELSE 1 END
    )
    RETURNING id INTO v_lead_id;

    RAISE NOTICE '[SERVICE_ROLE] ✅ Novo lead criado: %', v_lead_id;
  ELSE
    RAISE NOTICE '[SERVICE_ROLE] 🔄 Atualizando lead existente: %', v_lead_id;
    
    -- Atualizar lead existente (SEM RLS)
    UPDATE public.leads 
    SET 
      name = COALESCE(NULLIF(p_contact_name, ''), name),
      whatsapp_number_id = v_instance_id,
      funnel_id = COALESCE(v_funnel_id, funnel_id),
      kanban_stage_id = COALESCE(v_stage_id, kanban_stage_id),
      last_message_time = now(),
      last_message = p_message_text,
      unread_count = CASE 
        WHEN p_from_me THEN unread_count 
        ELSE COALESCE(unread_count, 0) + 1 
      END,
      updated_at = now()
    WHERE id = v_lead_id;

    RAISE NOTICE '[SERVICE_ROLE] ✅ Lead atualizado: %', v_lead_id;
  END IF;

  -- ETAPA 6: Inserir mensagem (SEM RLS)
  RAISE NOTICE '[SERVICE_ROLE] 💬 Inserindo mensagem...';
  
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

  RAISE NOTICE '[SERVICE_ROLE] ✅ Mensagem inserida: %', v_message_id;

  -- ETAPA 7: Retornar resultado completo
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'message_id', v_message_id,
      'lead_id', v_lead_id,
      'instance_id', v_instance_id,
      'user_id', v_user_id,
      'funnel_id', v_funnel_id,
      'stage_id', v_stage_id,
      'formatted_phone', v_formatted_phone,
      'contact_name', v_contact_name,
      'media_type', COALESCE(p_media_type, 'text'),
      'from_me', p_from_me,
      'method', 'service_role_rls_disabled',
      'diagnostics', jsonb_build_object(
        'schema', v_current_schema,
        'search_path', v_search_path,
        'rls_status', v_rls_status,
        'tables_found', v_tables_check
      )
    )
  );

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[SERVICE_ROLE] ❌ ERRO COM RLS DESABILITADO: % - SQLSTATE: %', SQLERRM, SQLSTATE;
  
  -- Se for erro de tabela não encontrada, fornecer diagnóstico detalhado
  IF SQLSTATE = '42P01' THEN
    RAISE NOTICE '[SERVICE_ROLE] 🔍 ERRO 42P01 PERSISTENTE - Schema=%, Path=%, RLS=%, Tabelas=%, Erro=%', 
      v_current_schema, v_search_path, v_rls_status, v_tables_check, SQLERRM;
  END IF;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE,
    'phone', p_phone,
    'vps_instance_id', p_vps_instance_id,
    'method', 'service_role_rls_disabled',
    'diagnostics', jsonb_build_object(
      'schema', v_current_schema,
      'search_path', v_search_path,
      'rls_status', v_rls_status,
      'tables_found', v_tables_check,
      'error_detail', SQLERRM
    )
  );
END;
$function$;
