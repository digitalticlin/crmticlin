-- 📱 CORRIGIR FORMATAÇÃO DE TELEFONE BRASILEIRO
-- Formato correto: phone = "556299212484", name = "+55 (62) 9921-2484"

-- 1. 🔧 FUNÇÃO PARA FORMATAÇÃO CORRETA
CREATE OR REPLACE FUNCTION format_brazilian_phone(input_phone text)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  clean_phone text;
  formatted_display text;
  area_code text;
  number_part text;
BEGIN
  -- Limpar apenas números
  clean_phone := regexp_replace(input_phone, '[^0-9]', '', 'g');
  
  -- Se começar com 55 (código do Brasil), manter
  IF clean_phone ~ '^55' THEN
    clean_phone := clean_phone;
  ELSIF length(clean_phone) >= 10 THEN
    -- Se não tem 55, adicionar
    clean_phone := '55' || clean_phone;
  ELSE
    -- Número muito curto, retornar original
    RETURN jsonb_build_object(
      'phone', input_phone,
      'display', input_phone
    );
  END IF;
  
  -- Validar comprimento (deve ter 13 dígitos: 55 + DDD + número)
  IF length(clean_phone) = 13 THEN
    -- Formato: 556299212484 -> phone: '556299212484', display: '+55 (62) 9921-2484'
    area_code := substring(clean_phone, 3, 2);  -- DDD
    number_part := substring(clean_phone, 5);   -- Número completo
    
    -- Formatar display: +55 (62) 9921-2484
    formatted_display := '+55 (' || area_code || ') ' || 
                        substring(number_part, 1, 1) || substring(number_part, 2, 3) || '-' ||
                        substring(number_part, 5);
                        
  ELSIF length(clean_phone) = 12 THEN
    -- Formato antigo: 556299212484 -> phone: '556299212484', display: '+55 (62) 9921-2484'
    area_code := substring(clean_phone, 3, 2);
    number_part := substring(clean_phone, 5);
    
    -- Formatar display: +55 (62) 9212-4848
    formatted_display := '+55 (' || area_code || ') ' || 
                        substring(number_part, 1, 4) || '-' ||
                        substring(number_part, 5);
  ELSE
    -- Comprimento inválido, retornar original
    RETURN jsonb_build_object(
      'phone', input_phone,
      'display', input_phone
    );
  END IF;
  
  RETURN jsonb_build_object(
    'phone', clean_phone,      -- Para busca: "556299212484"
    'display', formatted_display -- Para exibição: "+55 (62) 9921-2484"
  );
END;
$$;

-- 2. 🧪 TESTE DA FUNÇÃO
DO $$
DECLARE
  result jsonb;
BEGIN
  -- Testar diferentes formatos
  result := format_brazilian_phone('6299212484');
  RAISE NOTICE 'Teste 1 - Input: 6299212484 -> %', result;
  
  result := format_brazilian_phone('556299212484');
  RAISE NOTICE 'Teste 2 - Input: 556299212484 -> %', result;
  
  result := format_brazilian_phone('+55 62 9921-2484');
  RAISE NOTICE 'Teste 3 - Input: +55 62 9921-2484 -> %', result;
END $$;

-- 3. 🔧 ATUALIZAR RPC PRINCIPAL
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
    p_vps_instance_id, p_phone, CASE WHEN p_profile_pic_url IS NOT NULL THEN '✅' ELSE '❌' END;

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
    AND whatsapp_number_id = v_instance_id;  -- ✅ BUSCA PELA INSTÂNCIA TAMBÉM

  RAISE NOTICE '[save_whatsapp_message_service_role] 🔍 Lead encontrado: %', COALESCE(v_lead_id::text, 'NÃO');

  -- 📸 PROCESSAR PROFILE PIC AUTOMATICAMENTE
  IF p_profile_pic_url IS NOT NULL THEN
    v_profile_pic_updated := (v_current_profile_pic IS NULL OR v_current_profile_pic != p_profile_pic_url);
    
    -- ✅ PROCESSAR SE: novo lead OU foto mudou OU não tem foto salva
    IF v_lead_id IS NULL OR v_profile_pic_updated OR v_current_profile_pic IS NULL THEN
      RAISE NOTICE '📸 Processando profile pic: % | Motivo: %', 
        substring(p_profile_pic_url, 1, 50) || '...', 
        CASE 
          WHEN v_lead_id IS NULL THEN 'novo_lead'
          WHEN v_current_profile_pic IS NULL THEN 'sem_foto'
          WHEN v_profile_pic_updated THEN 'foto_mudou'
          ELSE 'desconhecido'
        END;
      
      -- 🚀 ENFILEIRAR DOWNLOAD PARA STORAGE (processamento assíncrono)
      PERFORM pgmq.send('profile_pic_download_queue', jsonb_build_object(
        'lead_id', COALESCE(v_lead_id, 'pending'),
        'phone', v_clean_phone,
        'profile_pic_url', p_profile_pic_url,
        'instance_id', v_instance_id,
        'is_new_lead', v_lead_id IS NULL,
        'timestamp', now()::text,
        'retry_count', 0,
        'priority', CASE WHEN v_lead_id IS NULL THEN 'urgent' ELSE 'high' END
      ));
      
      RAISE NOTICE '📦 Profile pic enfileirado para processamento automático';
      v_profile_pic_updated := TRUE;  -- Marcar como processado
    ELSE
      RAISE NOTICE '📸 Profile pic não mudou, mantendo atual';
      v_profile_pic_updated := FALSE;
    END IF;
  END IF;

  IF v_lead_id IS NULL THEN
    -- CRIAR NOVO LEAD COM FORMATAÇÃO CORRETA
    v_is_new_lead := TRUE;
    INSERT INTO public.leads (
      phone,                    -- ✅ FORMATO LIMPO: "556299212484"
      name,                     -- ✅ NOME FORMATADO: "+55 (62) 9921-2484" OU nome do contato
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
      v_clean_phone,            -- ✅ "556299212484"
      v_contact_name,           -- ✅ "+55 (62) 9921-2484" ou nome do contato
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
    -- ATUALIZAR LEAD EXISTENTE
    UPDATE public.leads 
    SET 
      name = COALESCE(NULLIF(p_contact_name, ''), name), -- Manter nome se não vier novo
      last_message_time = now(),
      last_message = p_message_text,
      unread_count = CASE 
        WHEN p_from_me THEN unread_count 
        ELSE COALESCE(unread_count, 0) + 1 
      END,
      profile_pic_url = CASE 
        WHEN v_profile_pic_updated THEN p_profile_pic_url 
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
      'clean_phone', v_clean_phone,           -- ✅ NOVO
      'display_name', v_display_name,         -- ✅ NOVO
      'contact_name', v_contact_name,
      'media_type', COALESCE(p_media_type, 'text'),
      'from_me', p_from_me,
      'is_new_lead', v_is_new_lead,
      'profile_pic_updated', v_profile_pic_updated,
      'method', 'service_role_with_correct_phone_format'
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
    'method', 'service_role_with_correct_phone_format'
  );
END;
$function$;

-- 4. 🔒 PERMISSÕES
GRANT EXECUTE ON FUNCTION format_brazilian_phone(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.save_whatsapp_message_service_role(text,text,text,boolean,text,text,text,text,text,text) TO service_role;

-- 5. ✅ LOG DE SUCESSO
DO $$
BEGIN
  RAISE NOTICE '📱 Sistema de formatação de telefone corrigido!';
  RAISE NOTICE '🎯 Formato:';
  RAISE NOTICE '   phone: "556299212484" (para busca)';
  RAISE NOTICE '   name:  "+55 (62) 9921-2484" (para exibição)';
  RAISE NOTICE '   ✅ Busca por phone + instância';
  RAISE NOTICE '   ✅ Profile pic integrado';
END $$;