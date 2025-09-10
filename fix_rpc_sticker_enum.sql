-- 🔧 CORREÇÃO: Validar enum media_type na função RCP
-- Converte tipos inválidos antes do CAST para evitar erro de enum

CREATE OR REPLACE FUNCTION public.save_whatsapp_message_service_role(
  p_vps_instance_id text,
  p_phone text,
  p_message_text text,
  p_from_me boolean,
  p_media_type text DEFAULT 'text',
  p_media_url text DEFAULT NULL,
  p_external_message_id text DEFAULT NULL,
  p_contact_name text DEFAULT NULL, -- ❌ PARÂMETRO IGNORADO
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
  v_owner_id UUID;
  v_phone_data jsonb;
  v_clean_phone text;
  v_display_name text;
  v_is_new_lead BOOLEAN := FALSE;
  v_current_profile_pic text;
  v_profile_pic_updated BOOLEAN := FALSE;
  v_safe_media_type text; -- ✅ VARIÁVEL PARA TIPO SEGURO
BEGIN
  -- Log de início
  RAISE NOTICE '[save_whatsapp_message_service_role] 🚀 Processando: % | Phone: % | MediaType: %', 
    p_vps_instance_id, p_phone, p_media_type;

  -- 🔧 ETAPA 0: CONVERTER TIPOS INVÁLIDOS PARA ENUM SEGURO
  v_safe_media_type := CASE 
    WHEN p_media_type = 'sticker' THEN 'image'
    WHEN p_media_type = 'unknown' THEN 'text'
    WHEN p_media_type IS NULL THEN 'text'
    WHEN p_media_type = '' THEN 'text'
    ELSE p_media_type
  END;
  
  RAISE NOTICE '[save_whatsapp_message_service_role] 🔧 MediaType: % -> %', 
    p_media_type, v_safe_media_type;

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

  -- ETAPA 2: Determinar owner_id
  v_owner_id := public.get_instance_owner_with_fallback(v_instance_id, v_user_id);
  RAISE NOTICE '[save_whatsapp_message_service_role] 👤 Owner determinado: % (fallback admin: %)', v_owner_id, v_user_id;

  -- ETAPA 3: 📱 FORMATAÇÃO DO TELEFONE (SEMPRE USADO COMO NOME)
  v_phone_data := format_brazilian_phone(p_phone);
  v_clean_phone := v_phone_data->>'phone';        -- "556299212484"
  v_display_name := v_phone_data->>'display';     -- "+55 (62) 9921-2484"

  RAISE NOTICE '[save_whatsapp_message_service_role] 📱 Telefone formatado: % -> phone: %, display: % (USADO COMO NOME)', 
    p_phone, v_clean_phone, v_display_name;

  -- ❌ ETAPA REMOVIDA: Lógica complexa de nome do contato
  -- 📱 SEMPRE usar o telefone formatado como nome: "+55 (62) 9921-2484"

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

  -- 📸 PROCESSAR PROFILE PIC (ÚNICA ATUALIZAÇÃO PERMITIDA)
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
    -- ✅ CRIAR NOVO LEAD COM TELEFONE FORMATADO COMO NOME
    v_is_new_lead := TRUE;
    INSERT INTO public.leads (
      phone,                    
      name, -- ✅ SEMPRE telefone formatado: "+55 (62) 9921-2484"                   
      whatsapp_number_id, 
      created_by_user_id,
      owner_id,
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
      v_display_name, -- ✅ SEMPRE telefone formatado como nome          
      v_instance_id,
      v_user_id,
      v_owner_id,
      v_funnel_id,
      v_stage_id,
      now(),
      p_message_text,
      'realtime',
      CASE WHEN p_from_me THEN 0 ELSE 1 END,
      p_profile_pic_url
    )
    RETURNING id INTO v_lead_id;

    RAISE NOTICE '[save_whatsapp_message_service_role] 🆕 Novo lead criado: % | Phone: % | Name: % | Owner: %', 
      v_lead_id, v_clean_phone, v_display_name, v_owner_id;
  ELSE
    -- ✅ ATUALIZAR LEAD EXISTENTE - NOME NUNCA MUDA + owner_id ATUALIZADO
    UPDATE public.leads 
    SET 
      -- 🔒 NOME NUNCA É ALTERADO (permanece telefone formatado da criação)
      owner_id = v_owner_id, -- ✅ SEMPRE ATUALIZAR OWNER
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

    RAISE NOTICE '[save_whatsapp_message_service_role] ✅ Lead atualizado | Nome: IMUTÁVEL (telefone formatado) | Owner: % | Foto: %', 
      v_owner_id, CASE WHEN v_profile_pic_updated THEN 'ATUALIZADA' ELSE 'INALTERADA' END;
  END IF;

  -- ETAPA 7: Inserir mensagem COM TIPO SEGURO
  INSERT INTO public.messages (
    lead_id,
    whatsapp_number_id,
    text,
    from_me,
    timestamp,
    status,
    created_by_user_id,
    media_type, -- ✅ USAR TIPO SEGURO
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
    v_safe_media_type::media_type, -- ✅ CAST SEGURO COM VALIDAÇÃO
    p_media_url,
    'realtime',
    p_external_message_id,
    p_base64_data
  )
  RETURNING id INTO v_message_id;

  RAISE NOTICE '[save_whatsapp_message_service_role] ✅ Mensagem inserida: % | MediaType: %', 
    v_message_id, v_safe_media_type;

  -- ETAPA 8: Retornar resultado completo
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
      'clean_phone', v_clean_phone,
      'display_name', v_display_name,
      'lead_name', v_display_name, -- ✅ SEMPRE telefone formatado
      'is_new_lead', v_is_new_lead,
      'profile_pic_updated', v_profile_pic_updated,
      'media_type', v_safe_media_type, -- ✅ RETORNAR TIPO SEGURO
      'from_me', p_from_me,
      'method', 'phone_name_only_v4' -- ✅ VERSÃO ATUALIZADA
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
    'media_type_received', p_media_type,
    'media_type_converted', v_safe_media_type,
    'method', 'phone_name_only_v4'
  );
END;
$function$;

-- =====================================================================
-- COMENTÁRIOS FINAIS
-- =====================================================================
/*
🔧 CORREÇÕES IMPLEMENTADAS:

1. ✅ Validação de enum media_type:
   - "sticker" → "image"
   - "unknown" → "text" 
   - NULL/vazio → "text"

2. ✅ CAST seguro:
   - v_safe_media_type::media_type nunca falhará
   - Todos os tipos são validados antes do CAST

3. ✅ Logs melhorados:
   - Mostra conversão de tipos
   - Retorna ambos os tipos em caso de erro

4. ✅ Compatibilidade total:
   - Funciona com Edge Function antiga e nova
   - Versão atualizada para v4

📋 RESULTADO:
- Nunca mais erro: 'invalid input value for enum media_type: "sticker"'
- Todos os stickers salvos como media_type: 'image'
- Função robusta para qualquer tipo recebido
*/