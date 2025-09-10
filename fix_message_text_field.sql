-- ========================================
-- 🔧 CORREÇÃO CAMPO TEXT DAS MENSAGENS 
-- ========================================
-- 
-- PROBLEMA: Campo TEXT da tabela messages está sendo salvo como "[Mensagem não suportada]"
-- SOLUÇÃO: Corrigir lógica nas funções RPC para ter textos descritivos com emojis
--

-- =====================================================================
-- 1. FUNÇÃO AUXILIAR PARA GERAR TEXTO DESCRITIVO CORRETO
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_descriptive_message_text(
  p_message_text text,
  p_media_type text DEFAULT 'text',
  p_from_me boolean DEFAULT false
)
RETURNS text
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Se já tem texto válido e não é placeholder, usar o texto
  IF p_message_text IS NOT NULL 
     AND p_message_text != '' 
     AND p_message_text != '[Mensagem não suportada]'
     AND p_message_text != '[Mensagem de mídia]' THEN
    RETURN p_message_text;
  END IF;

  -- Gerar texto descritivo baseado no tipo de mídia com emojis
  CASE LOWER(COALESCE(p_media_type, 'text'))
    WHEN 'image' THEN
      RETURN '📷 Imagem';
    WHEN 'video' THEN
      RETURN '🎥 Vídeo';
    WHEN 'audio' THEN
      RETURN '🎵 Áudio';
    WHEN 'document' THEN
      RETURN '📄 Documento';
    WHEN 'sticker' THEN
      RETURN '😊 Sticker';
    WHEN 'location' THEN
      RETURN '📍 Localização';
    WHEN 'contact' THEN
      RETURN '👤 Contato';
    ELSE
      -- Para texto sem conteúdo ou casos não identificados
      IF p_from_me THEN
        RETURN '💬 Mensagem enviada';
      ELSE  
        RETURN '💬 Mensagem recebida';
      END IF;
  END CASE;
END;
$function$;

-- =====================================================================
-- 2. ATUALIZAR FUNÇÃO save_whatsapp_message_complete_v2
-- =====================================================================
CREATE OR REPLACE FUNCTION public.save_whatsapp_message_complete_v2(
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
  v_owner_id UUID;
  v_formatted_phone TEXT;
  v_contact_name TEXT;
  v_descriptive_text TEXT; -- ✅ NOVO: Texto descritivo
  v_existing_lead_count INTEGER;
BEGIN
  -- Log de início
  RAISE NOTICE '[save_whatsapp_message_complete_v2] 🚀 Iniciando processamento otimizado para: %', p_vps_instance_id;

  -- ETAPA 1: Buscar instância (com RLS ativo)
  SELECT id, created_by_user_id 
  INTO v_instance_id, v_user_id
  FROM public.whatsapp_instances 
  WHERE vps_instance_id = p_vps_instance_id;
  
  IF v_instance_id IS NULL THEN
    RAISE NOTICE '[save_whatsapp_message_complete_v2] ❌ Instância não encontrada: %', p_vps_instance_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Instance not found',
      'vps_instance_id', p_vps_instance_id
    );
  END IF;

  -- ETAPA 2: Determinar responsável pela instância (owner_id)
  v_owner_id := public.get_instance_owner_with_fallback(v_instance_id, v_user_id);
  RAISE NOTICE '[save_whatsapp_message_complete_v2] 👤 Owner determinado: % (Fallback para admin: %)', v_owner_id, v_user_id;

  -- ✅ ETAPA 3: GERAR TEXTO DESCRITIVO CORRETO
  v_descriptive_text := public.get_descriptive_message_text(p_message_text, p_media_type, p_from_me);
  RAISE NOTICE '[save_whatsapp_message_complete_v2] 💬 Texto original: "%" → Texto descritivo: "%"', p_message_text, v_descriptive_text;

  -- ETAPA 4: Formatar telefone brasileiro
  v_formatted_phone := '+55 (' || substring(p_phone, 1, 2) || ') ' ||
                      substring(p_phone, 3, 5) || '-' ||
                      substring(p_phone, 8, 4);

  -- ETAPA 5: Definir nome do contato
  v_contact_name := CASE 
    WHEN p_from_me THEN v_formatted_phone
    ELSE COALESCE(NULLIF(p_contact_name, ''), v_formatted_phone)
  END;

  -- ETAPA 6: Buscar funil padrão do admin
  SELECT id INTO v_funnel_id
  FROM public.funnels 
  WHERE created_by_user_id = v_user_id 
  ORDER BY created_at ASC 
  LIMIT 1;

  -- ETAPA 7: Buscar primeiro estágio do funil
  IF v_funnel_id IS NOT NULL THEN
    SELECT id INTO v_stage_id
    FROM public.kanban_stages 
    WHERE funnel_id = v_funnel_id 
    ORDER BY order_position ASC 
    LIMIT 1;
  END IF;

  -- ETAPA 8: Buscar ou criar lead
  SELECT id INTO v_lead_id
  FROM public.leads 
  WHERE phone = v_formatted_phone 
    AND created_by_user_id = v_user_id;

  IF v_lead_id IS NULL THEN
    -- Criar novo lead COM owner_id correto
    INSERT INTO public.leads (
      phone, 
      name, 
      whatsapp_number_id, 
      created_by_user_id,
      owner_id,
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
      v_owner_id,
      v_funnel_id,
      v_stage_id,
      now(),
      v_descriptive_text, -- ✅ USAR TEXTO DESCRITIVO
      'realtime',
      CASE WHEN p_from_me THEN 0 ELSE 1 END
    )
    RETURNING id INTO v_lead_id;

    RAISE NOTICE '[save_whatsapp_message_complete_v2] ✅ Novo lead criado: % (admin: % | owner: %)', v_lead_id, v_user_id, v_owner_id;
  ELSE
    -- Atualizar lead existente COM owner_id correto
    UPDATE public.leads 
    SET 
      name = CASE 
        WHEN p_from_me THEN name
        ELSE COALESCE(NULLIF(p_contact_name, ''), name)
      END,
      whatsapp_number_id = v_instance_id,
      owner_id = v_owner_id,
      funnel_id = COALESCE(v_funnel_id, funnel_id),
      kanban_stage_id = COALESCE(v_stage_id, kanban_stage_id),
      last_message_time = now(),
      last_message = v_descriptive_text, -- ✅ USAR TEXTO DESCRITIVO
      unread_count = CASE 
        WHEN p_from_me THEN unread_count 
        ELSE COALESCE(unread_count, 0) + 1 
      END,
      updated_at = now()
    WHERE id = v_lead_id;

    RAISE NOTICE '[save_whatsapp_message_complete_v2] ✅ Lead atualizado: % (admin: % | owner: %)', v_lead_id, v_user_id, v_owner_id;
  END IF;

  -- ✅ ETAPA 9: Inserir mensagem COM TEXTO DESCRITIVO
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
    v_descriptive_text, -- ✅ USAR TEXTO DESCRITIVO CORRIGIDO
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

  RAISE NOTICE '[save_whatsapp_message_complete_v2] ✅ Mensagem inserida com texto descritivo: %', v_message_id;

  -- ETAPA 10: Retornar resultado completo
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'message_id', v_message_id,
      'lead_id', v_lead_id,
      'instance_id', v_instance_id,
      'admin_user_id', v_user_id,
      'owner_id', v_owner_id,
      'funnel_id', v_funnel_id,
      'stage_id', v_stage_id,
      'formatted_phone', v_formatted_phone,
      'contact_name', v_contact_name,
      'descriptive_text', v_descriptive_text, -- ✅ INCLUIR TEXTO DESCRITIVO NO RETORNO
      'original_text', p_message_text,
      'media_type', COALESCE(p_media_type, 'text'),
      'from_me', p_from_me,
      'method', 'optimized_complete_with_descriptive_text_v2'
    )
  );

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[save_whatsapp_message_complete_v2] ❌ ERRO: % - SQLSTATE: %', SQLERRM, SQLSTATE;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE,
    'phone', p_phone,
    'vps_instance_id', p_vps_instance_id,
    'method', 'optimized_complete_with_descriptive_text_v2'
  );
END;
$function$;

-- =====================================================================
-- 3. ATUALIZAR FUNÇÃO save_whatsapp_message_service_role
-- =====================================================================
CREATE OR REPLACE FUNCTION public.save_whatsapp_message_service_role(
  p_vps_instance_id text,
  p_phone text,
  p_message_text text,
  p_from_me boolean,
  p_media_type text DEFAULT 'text',
  p_media_url text DEFAULT NULL,
  p_external_message_id text DEFAULT NULL,
  p_contact_name text DEFAULT NULL,
  p_profile_pic_url text DEFAULT NULL
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
  v_clean_phone TEXT;
  v_formatted_name TEXT;
  v_descriptive_text TEXT; -- ✅ NOVO: Texto descritivo
  v_media_cache_id UUID;
BEGIN
  -- ✅ BYPASSE TOTAL DO RLS
  SET LOCAL row_security = off;
  
  RAISE NOTICE '[SERVICE_ROLE] 🚀 Iniciando processamento de mensagem WhatsApp (com texto descritivo)';

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

  -- ✅ ETAPA 2: GERAR TEXTO DESCRITIVO CORRETO
  v_descriptive_text := public.get_descriptive_message_text(p_message_text, p_media_type, p_from_me);
  RAISE NOTICE '[SERVICE_ROLE] 💬 Texto original: "%" → Texto descritivo: "%"', p_message_text, v_descriptive_text;

  -- ETAPA 3: NORMALIZAR TELEFONE
  v_clean_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
  
  IF length(v_clean_phone) = 11 THEN
    v_clean_phone := '55' || v_clean_phone;
  ELSIF length(v_clean_phone) = 13 AND substring(v_clean_phone, 1, 2) = '55' THEN
    v_clean_phone := v_clean_phone;
  ELSIF length(v_clean_phone) = 14 AND substring(v_clean_phone, 1, 4) = '5555' THEN
    v_clean_phone := substring(v_clean_phone, 3);
  END IF;
  
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

  -- ETAPA 4: Buscar funil padrão do usuário
  SELECT id INTO v_funnel_id 
  FROM public.funnels 
  WHERE created_by_user_id = v_user_id 
  ORDER BY created_at ASC 
  LIMIT 1;

  -- ETAPA 5: Buscar primeira etapa do funil
  IF v_funnel_id IS NOT NULL THEN
    SELECT id INTO v_stage_id 
    FROM public.kanban_stages 
    WHERE funnel_id = v_funnel_id 
    ORDER BY order_position ASC 
    LIMIT 1;
  END IF;

  -- ETAPA 6: BUSCAR LEAD POR TELEFONE LIMPO
  SELECT id INTO v_lead_id 
  FROM public.leads 
  WHERE regexp_replace(phone, '[^0-9]', '', 'g') = v_clean_phone
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
      unread_count,
      profile_pic_url
    )
    VALUES (
      v_formatted_name,
      v_clean_phone,
      v_user_id,
      v_instance_id,
      v_funnel_id,
      v_stage_id,
      now(),
      v_descriptive_text, -- ✅ USAR TEXTO DESCRITIVO
      'realtime',
      CASE WHEN p_from_me THEN 0 ELSE 1 END,
      p_profile_pic_url
    )
    RETURNING id INTO v_lead_id;

    RAISE NOTICE '[SERVICE_ROLE] ✅ Novo lead criado: % | Telefone: %', v_lead_id, v_clean_phone;
  ELSE
    UPDATE public.leads 
    SET 
      name = v_formatted_name,
      phone = v_clean_phone,
      whatsapp_number_id = v_instance_id,
      funnel_id = COALESCE(v_funnel_id, funnel_id),
      kanban_stage_id = COALESCE(v_stage_id, kanban_stage_id),
      last_message_time = now(),
      last_message = v_descriptive_text, -- ✅ USAR TEXTO DESCRITIVO
      unread_count = CASE 
        WHEN p_from_me THEN unread_count 
        ELSE COALESCE(unread_count, 0) + 1 
      END,
      profile_pic_url = COALESCE(p_profile_pic_url, profile_pic_url),
      updated_at = now()
    WHERE id = v_lead_id;

    RAISE NOTICE '[SERVICE_ROLE] ✅ Lead atualizado: % | Telefone normalizado: %', v_lead_id, v_clean_phone;
  END IF;

  -- ✅ ETAPA 7: Inserir mensagem COM TEXTO DESCRITIVO
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
    v_descriptive_text, -- ✅ USAR TEXTO DESCRITIVO CORRIGIDO
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

  RAISE NOTICE '[SERVICE_ROLE] ✅ Mensagem inserida com texto descritivo: %', v_message_id;

  -- ETAPA 8: CRIAR MEDIA_CACHE SE HÁ MÍDIA
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

  -- ETAPA 9: Retornar resultado completo
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'message_id', v_message_id,
      'lead_id', v_lead_id,
      'instance_id', v_instance_id,
      'user_id', v_user_id,
      'phone', left(v_clean_phone, 8) || '****',
      'formatted_name', v_formatted_name,
      'descriptive_text', v_descriptive_text, -- ✅ INCLUIR TEXTO DESCRITIVO NO RETORNO
      'original_text', p_message_text,
      'media_cache_id', v_media_cache_id,
      'media_type', p_media_type,
      'has_media', (p_media_url IS NOT NULL),
      'method', 'service_role_with_descriptive_text'
    ),
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

-- =====================================================================
-- 4. GARANTIR PERMISSÕES
-- =====================================================================
GRANT EXECUTE ON FUNCTION public.get_descriptive_message_text(text, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_descriptive_message_text(text, text, boolean) TO authenticated;

GRANT EXECUTE ON FUNCTION public.save_whatsapp_message_complete_v2(text, text, text, boolean, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.save_whatsapp_message_complete_v2(text, text, text, boolean, text, text, text, text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.save_whatsapp_message_service_role(text, text, text, boolean, text, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.save_whatsapp_message_service_role(text, text, text, boolean, text, text, text, text, text) TO authenticated;

-- =====================================================================
-- 5. SCRIPT DE LIMPEZA PARA CORRIGIR MENSAGENS EXISTENTES
-- =====================================================================

-- Atualizar mensagens existentes que têm "[Mensagem não suportada]"
UPDATE public.messages 
SET text = CASE 
  WHEN media_type = 'image' THEN '📷 Imagem'
  WHEN media_type = 'video' THEN '🎥 Vídeo'
  WHEN media_type = 'audio' THEN '🎵 Áudio'
  WHEN media_type = 'document' THEN '📄 Documento'
  WHEN media_type = 'text' AND from_me THEN '💬 Mensagem enviada'
  WHEN media_type = 'text' AND NOT from_me THEN '💬 Mensagem recebida'
  ELSE '💬 Mensagem'
END
WHERE text = '[Mensagem não suportada]'
   OR text = '[Mensagem de mídia]'
   OR text IS NULL
   OR text = '';

-- Log de resultado
DO $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE '✅ CORREÇÃO APLICADA: % mensagens atualizadas com textos descritivos', v_updated_count;
END $$;