-- 🔧 CORRIGIR ERRO DE UUID NA FILA PROFILE PIC
-- Problema: "pending" não é um UUID válido

CREATE OR REPLACE FUNCTION public.save_whatsapp_message_service_role(
  p_vps_instance_id text,
  p_phone text,
  p_message_text text,
  p_from_me boolean,
  p_media_type text DEFAULT 'text',
  p_media_url text DEFAULT NULL,
  p_external_message_id text DEFAULT NULL,
  p_contact_name text DEFAULT NULL,
  p_base64_data text DEFAULT NULL,
  p_profile_pic_url text DEFAULT NULL
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
  v_phone_data jsonb;
  v_clean_phone text;
  v_display_name text;
  v_contact_name text;
  v_is_new_lead BOOLEAN := FALSE;
  v_current_profile_pic text;
  v_profile_pic_updated BOOLEAN := FALSE;
BEGIN
  -- Log de início
  RAISE NOTICE '[save_whatsapp_message_service_role] 🚀 Processando: % | Phone: % | Profile pic: %', 
    p_vps_instance_id, p_phone, CASE WHEN p_profile_pic_url IS NOT NULL THEN '✅ RECEBIDO' ELSE '❌ NULL' END;

  -- ETAPA 1: Buscar instância
  SELECT id, created_by_user_id 
  INTO v_instance_id, v_user_id
  FROM public.whatsapp_instances 
  WHERE vps_instance_id = p_vps_instance_id;
  
  IF v_instance_id IS NULL THEN
    RAISE NOTICE '[save_whatsapp_message_service_role] ❌ Instância não encontrada: %', p_vps_instance_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Instance not found',
      'vps_instance_id', p_vps_instance_id
    );
  END IF;

  -- ETAPA 2: 📱 FORMATAÇÃO CORRETA DO TELEFONE
  v_phone_data := format_brazilian_phone(p_phone);
  v_clean_phone := v_phone_data->>'phone';        -- "556299212484"
  v_display_name := v_phone_data->>'display';     -- "+55 (62) 9921-2484"

  RAISE NOTICE '[save_whatsapp_message_service_role] 📱 Telefone formatado: % -> phone: %, display: %', 
    p_phone, v_clean_phone, v_display_name;

  -- ETAPA 3: 📝 DEFINIR NOME DO CONTATO (prioridade: profileName > formato telefone)
  IF p_contact_name IS NOT NULL AND trim(p_contact_name) != '' THEN
    v_contact_name := trim(p_contact_name);  -- ✅ Usar nome do perfil do WhatsApp
    RAISE NOTICE '[save_whatsapp_message_service_role] 👤 Nome do perfil: %', v_contact_name;
  ELSE
    v_contact_name := v_display_name;        -- ✅ Usar formato telefone: "+55 (62) 9921-2484"
    RAISE NOTICE '[save_whatsapp_message_service_role] 📱 Nome padrão (telefone): %', v_contact_name;
  END IF;

  -- ETAPA 4: Buscar funil padrão do usuário
  SELECT id INTO v_funnel_id
  FROM public.funnels 
  WHERE created_by_user_id = v_user_id 
  ORDER BY created_at ASC 
  LIMIT 1;

  -- ETAPA 5: Buscar primeiro estágio do funil
  IF v_funnel_id IS NOT NULL THEN
    SELECT id INTO v_stage_id
    FROM public.kanban_stages 
    WHERE funnel_id = v_funnel_id 
    ORDER BY order_position ASC 
    LIMIT 1;
  END IF;

  -- ETAPA 6: Buscar lead existente pelo PHONE LIMPO + INSTÂNCIA
  SELECT id, profile_pic_url INTO v_lead_id, v_current_profile_pic
  FROM public.leads 
  WHERE phone = v_clean_phone 
    AND whatsapp_number_id = v_instance_id;

  RAISE NOTICE '[save_whatsapp_message_service_role] 🔍 Lead encontrado: % | Profile pic atual: %', 
    COALESCE(v_lead_id::text, 'NÃO'), 
    CASE WHEN v_current_profile_pic IS NULL THEN 'NULL' ELSE substring(v_current_profile_pic, 1, 50) END;

  -- 📸 PROCESSAR PROFILE PIC - LÓGICA SIMPLIFICADA SEM FILA
  IF p_profile_pic_url IS NOT NULL THEN
    RAISE NOTICE '✅ Profile pic URL recebido: %', substring(p_profile_pic_url, 1, 100);
    
    -- 🔍 DETERMINAR SE DEVE PROCESSAR PROFILE PIC
    IF v_lead_id IS NULL THEN
      -- Lead novo - sempre processar
      v_profile_pic_updated := TRUE;
      RAISE NOTICE '📸 Novo lead - processará profile pic';
    ELSIF v_current_profile_pic IS NULL THEN
      -- Lead existe mas não tem foto - processar
      v_profile_pic_updated := TRUE;
      RAISE NOTICE '📸 Lead sem foto - processará profile pic';
    ELSIF v_current_profile_pic != p_profile_pic_url THEN
      -- Lead tem foto diferente - processar
      v_profile_pic_updated := TRUE;
      RAISE NOTICE '📸 Foto mudou - processará profile pic';
    ELSE
      -- Foto é igual - não processar
      v_profile_pic_updated := FALSE;
      RAISE NOTICE '📸 Foto inalterada - não processará';
    END IF;
    
  ELSE
    RAISE NOTICE '❌ Nenhum profile pic recebido (p_profile_pic_url = NULL)';
  END IF;

  IF v_lead_id IS NULL THEN
    -- CRIAR NOVO LEAD COM FORMATAÇÃO CORRETA
    v_is_new_lead := TRUE;
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
      unread_count,
      profile_pic_url
    )
    VALUES (
      v_clean_phone,            
      v_contact_name,           
      v_instance_id,
      v_user_id,
      v_funnel_id,
      v_stage_id,
      now(),
      p_message_text,
      'realtime',
      CASE WHEN p_from_me THEN 0 ELSE 1 END,
      p_profile_pic_url
    )
    RETURNING id INTO v_lead_id;

    RAISE NOTICE '[save_whatsapp_message_service_role] 🆕 Novo lead criado: % | Phone: % | Name: %', 
      v_lead_id, v_clean_phone, v_contact_name;
  ELSE
    -- ATUALIZAR LEAD EXISTENTE (NUNCA SOBRESCREVER NOME)
    UPDATE public.leads 
    SET 
      -- 🔒 NOME PROTEGIDO: se já existe, nunca alterar
      name = name,  -- Manter nome atual sempre
      last_message_time = now(),
      last_message = p_message_text,
      unread_count = CASE 
        WHEN p_from_me THEN unread_count 
        ELSE COALESCE(unread_count, 0) + 1 
      END,
      profile_pic_url = CASE 
        WHEN v_profile_pic_updated AND p_profile_pic_url IS NOT NULL THEN p_profile_pic_url 
        ELSE profile_pic_url 
      END,
      updated_at = now()
    WHERE id = v_lead_id;

    RAISE NOTICE '[save_whatsapp_message_service_role] ✅ Lead atualizado | Foto: %', 
      CASE WHEN v_profile_pic_updated THEN 'ATUALIZADA' ELSE 'INALTERADA' END;
  END IF;

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
    external_message_id,
    base64_data
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
    p_external_message_id,
    p_base64_data
  )
  RETURNING id INTO v_message_id;

  RAISE NOTICE '[save_whatsapp_message_service_role] ✅ Mensagem inserida: %', v_message_id;

  -- ETAPA 8: Retornar resultado completo
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'message_id', v_message_id,
      'lead_id', v_lead_id,
      'instance_id', v_instance_id,
      'user_id', v_user_id,
      'funnel_id', v_funnel_id,
      'stage_id', v_stage_id,
      'clean_phone', v_clean_phone,           
      'display_name', v_display_name,         
      'contact_name', v_contact_name,
      'media_type', COALESCE(p_media_type, 'text'),
      'from_me', p_from_me,
      'is_new_lead', v_is_new_lead,
      'profile_pic_updated', v_profile_pic_updated,
      'profile_pic_received', p_profile_pic_url IS NOT NULL,
      'method', 'service_role_fixed_uuid_error'
    )
  );

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[save_whatsapp_message_service_role] ❌ ERRO: % - SQLSTATE: %', SQLERRM, SQLSTATE;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE,
    'phone', p_phone,
    'vps_instance_id', p_vps_instance_id,
    'method', 'service_role_fixed_uuid_error'
  );
END;
$function$;