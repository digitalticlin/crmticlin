-- ✅ CORREÇÃO CRÍTICA: Adicionar criação de media_cache na função save_whatsapp_message_service_role
-- Para garantir que mídias recebidas via webhook sejam renderizadas corretamente

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
  v_media_cache_id UUID; -- ✅ NOVO: Para armazenar ID do media_cache
BEGIN
  -- ✅ BYPASSE TOTAL DO RLS - CORREÇÃO DEFINITIVA
  SET LOCAL row_security = off;
  
  RAISE NOTICE '[SERVICE_ROLE] 🚀 Iniciando processamento de mensagem WhatsApp';

  -- ETAPA 1: Buscar instância
  SELECT id, created_by_user_id 
  INTO v_instance_id, v_user_id
  FROM public.whatsapp_instances 
  WHERE vps_instance_id = p_vps_instance_id;
  
  IF v_instance_id IS NULL THEN
    RAISE NOTICE '[SERVICE_ROLE] ❌ Instância não encontrada: %', p_vps_instance_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Instance not found',
      'vps_instance_id', p_vps_instance_id
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

  v_contact_name := COALESCE(NULLIF(p_contact_name, ''), 'Contato ' || v_formatted_phone);

  -- ETAPA 3: Buscar funil padrão do usuário
  SELECT id INTO v_funnel_id 
  FROM public.funnels 
  WHERE created_by_user_id = v_user_id 
  ORDER BY created_at ASC 
  LIMIT 1;

  -- ETAPA 4: Buscar primeira etapa do funil
  IF v_funnel_id IS NOT NULL THEN
    SELECT id INTO v_stage_id 
    FROM public.kanban_stages 
    WHERE funnel_id = v_funnel_id 
    ORDER BY order_position ASC 
    LIMIT 1;
  END IF;

  -- ETAPA 5: Buscar ou criar lead
  SELECT id INTO v_lead_id 
  FROM public.leads 
  WHERE phone = v_formatted_phone 
  AND created_by_user_id = v_user_id;

  IF v_lead_id IS NULL THEN
    INSERT INTO public.leads (
      name,
      phone,
      created_by_user_id,
      whatsapp_number_id,
      funnel_id,
      kanban_stage_id,
      last_message_time,
      last_message,
      import_source,
      unread_count
    )
    VALUES (
      v_contact_name,
      v_formatted_phone,
      v_user_id,
      v_instance_id,
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

  -- ETAPA 6: Inserir mensagem
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

  -- ✅ ETAPA 7: CRIAR MEDIA_CACHE SE HÁ MÍDIA (CORREÇÃO PRINCIPAL)
  IF p_media_url IS NOT NULL AND p_media_type IS NOT NULL AND p_media_type != 'text' THEN
    RAISE NOTICE '[SERVICE_ROLE] 📎 Criando media_cache para mídia tipo: %', p_media_type;
    
    INSERT INTO public.media_cache (
      message_id,
      external_message_id,
      original_url,
      media_type,
      created_at
    )
    VALUES (
      v_message_id,
      p_external_message_id,
      p_media_url,
      p_media_type,
      now()
    )
    RETURNING id INTO v_media_cache_id;

    RAISE NOTICE '[SERVICE_ROLE] ✅ Media_cache criado: % para mensagem: %', v_media_cache_id, v_message_id;
    
    -- ✅ NOVO: Trigger para processamento assíncrono de mídia
    -- Isso será feito por uma Edge Function separada para não atrasar o webhook
    RAISE NOTICE '[SERVICE_ROLE] 🚀 Mídia marcada para processamento assíncrono: %', v_message_id;
  END IF;

  -- ETAPA 8: Retornar resultado completo
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'message_id', v_message_id,
      'lead_id', v_lead_id,
      'instance_id', v_instance_id,
      'user_id', v_user_id,
      'phone', left(v_formatted_phone, 8) || '****',
      'media_cache_id', v_media_cache_id,
      'media_type', p_media_type,
      'has_media', (p_media_url IS NOT NULL)
    ),
    'method', 'service_role_with_media_cache',
    'timestamp', extract(epoch from now())
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '[SERVICE_ROLE] ❌ ERRO: % - SQLSTATE: %', SQLERRM, SQLSTATE;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE,
      'method', 'service_role_error'
    );
END;
$function$;

-- ✅ GARANTIR PERMISSÕES
GRANT EXECUTE ON FUNCTION public.save_whatsapp_message_service_role TO service_role;
GRANT EXECUTE ON FUNCTION public.save_whatsapp_message_service_role TO authenticated; 