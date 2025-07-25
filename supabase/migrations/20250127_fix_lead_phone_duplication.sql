-- ✅ CORREÇÃO CRÍTICA: Evitar duplicação de leads por diferentes formatos de telefone
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
  v_clean_phone TEXT;        -- ✅ NOVO: Telefone limpo (só números)
  v_formatted_name TEXT;     -- ✅ NOVO: Nome formatado visual
  v_media_cache_id UUID;
BEGIN
  -- ✅ BYPASSE TOTAL DO RLS
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

  -- ✅ ETAPA 2: NORMALIZAR TELEFONE (CORREÇÃO PRINCIPAL)
  -- Extrair apenas números do telefone
  v_clean_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
  
  -- ✅ GARANTIR QUE SEMPRE TENHA CÓDIGO DO PAÍS BRASILEIRO
  IF length(v_clean_phone) = 11 THEN
    -- Telefone sem código do país: 62999212484 → 556299212484
    v_clean_phone := '55' || v_clean_phone;
  ELSIF length(v_clean_phone) = 13 AND substring(v_clean_phone, 1, 2) = '55' THEN
    -- Telefone já com código: 556299212484 → manter
    v_clean_phone := v_clean_phone;
  ELSIF length(v_clean_phone) = 14 AND substring(v_clean_phone, 1, 4) = '5555' THEN
    -- Telefone com 55 duplicado: 55556299212484 → 556299212484
    v_clean_phone := substring(v_clean_phone, 3);
  END IF;
  
  -- ✅ CRIAR NOME FORMATADO VISUAL
  IF length(v_clean_phone) >= 12 THEN
    v_formatted_name := COALESCE(
      NULLIF(p_contact_name, ''),
      '+55 (' || substring(v_clean_phone, 3, 2) || ') ' ||
      substring(v_clean_phone, 5, 5) || '-' ||
      substring(v_clean_phone, 10)
    );
  ELSE
    v_formatted_name := COALESCE(NULLIF(p_contact_name, ''), '+55 ' || v_clean_phone);
  END IF;

  RAISE NOTICE '[SERVICE_ROLE] 📱 Telefone normalizado: % → % | Nome: %', p_phone, v_clean_phone, v_formatted_name;

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

  -- ✅ ETAPA 5: BUSCAR LEAD POR TELEFONE LIMPO (EVITAR DUPLICAÇÃO)
  SELECT id INTO v_lead_id 
  FROM public.leads 
  WHERE regexp_replace(phone, '[^0-9]', '', 'g') = v_clean_phone
  AND created_by_user_id = v_user_id;

  IF v_lead_id IS NULL THEN
    -- ✅ CRIAR NOVO LEAD COM FORMATO PADRONIZADO
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
      v_formatted_name,
      v_clean_phone,           -- ✅ SALVAR TELEFONE LIMPO
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

    RAISE NOTICE '[SERVICE_ROLE] ✅ Novo lead criado: % | Telefone: %', v_lead_id, v_clean_phone;
  ELSE
    -- ✅ ATUALIZAR LEAD EXISTENTE E NORMALIZAR TELEFONE
    UPDATE public.leads 
    SET 
      name = v_formatted_name,           -- ✅ ATUALIZAR NOME FORMATADO
      phone = v_clean_phone,             -- ✅ NORMALIZAR TELEFONE
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

    RAISE NOTICE '[SERVICE_ROLE] ✅ Lead atualizado: % | Telefone normalizado: %', v_lead_id, v_clean_phone;
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

  -- ✅ ETAPA 7: CRIAR MEDIA_CACHE SE HÁ MÍDIA
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
  END IF;

  -- ETAPA 8: Retornar resultado completo
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'message_id', v_message_id,
      'lead_id', v_lead_id,
      'instance_id', v_instance_id,
      'user_id', v_user_id,
      'phone', left(v_clean_phone, 8) || '****',
      'formatted_name', v_formatted_name,
      'media_cache_id', v_media_cache_id,
      'media_type', p_media_type,
      'has_media', (p_media_url IS NOT NULL)
    ),
    'method', 'service_role_normalized_phone',
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