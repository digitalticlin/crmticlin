-- Remove campo base64_data (ai_description) do salvamento de mensagens
-- Manter todo o processamento de mídia com Storage intacto

-- Primeiro fazer DROP de AMBAS as versões da função (resolve function overloading)
DROP FUNCTION IF EXISTS public.save_whatsapp_message_service_role(text,text,text,boolean,text,text,text,text,text); -- 9 parâmetros
DROP FUNCTION IF EXISTS public.save_whatsapp_message_service_role(text,text,text,boolean,text,text,text,text,text,text); -- 10 parâmetros

-- Criar nova versão sem p_base64_data
CREATE OR REPLACE FUNCTION public.save_whatsapp_message_service_role(
  p_vps_instance_id text,
  p_phone text,
  p_message_text text,
  p_from_me boolean,
  p_media_type text DEFAULT 'text',
  p_media_url text DEFAULT NULL,
  p_external_message_id text DEFAULT NULL,
  p_contact_name text DEFAULT NULL,
  p_profile_pic_url text DEFAULT NULL -- Manter apenas profile pic, remover p_base64_data
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
  v_contact_name TEXT;
  v_is_new_lead BOOLEAN := FALSE;
  v_current_profile_pic TEXT;
  v_profile_pic_updated BOOLEAN := FALSE;
BEGIN
  -- Log de início
  RAISE NOTICE '[save_whatsapp_message_service_role] 🚀 Processando: % | Profile pic: %', 
    p_vps_instance_id, CASE WHEN p_profile_pic_url IS NOT NULL THEN '✅' ELSE '❌' END;

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

  -- ETAPA 2: Formatar telefone brasileiro
  -- p_phone vem como 556299999999@s.whatsapp.net, remover apenas a parte @s.whatsapp.net
  v_formatted_phone := split_part(p_phone, '@', 1);
  
  -- Criar nome formatado para exibição: +55 (62) 9999-9999 ou +55 (62) 99999-9999
  -- Detectar se é 8 ou 9 dígitos após DDD
  v_contact_name := COALESCE(
    NULLIF(p_contact_name, ''), 
    CASE 
      WHEN length(v_formatted_phone) = 13 THEN -- 556299999999 = 9 dígitos
        '+55 (' || substring(v_formatted_phone, 3, 2) || ') ' ||
        substring(v_formatted_phone, 5, 5) || '-' ||
        substring(v_formatted_phone, 10, 4)
      ELSE -- 55629999999 = 8 dígitos
        '+55 (' || substring(v_formatted_phone, 3, 2) || ') ' ||
        substring(v_formatted_phone, 5, 4) || '-' ||
        substring(v_formatted_phone, 9, 4)
    END
  );

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

  -- ETAPA 6: Buscar lead existente e profile pic atual
  SELECT id, profile_pic_url INTO v_lead_id, v_current_profile_pic
  FROM public.leads 
  WHERE phone = v_formatted_phone 
    AND created_by_user_id = v_user_id;

  -- 📸 VERIFICAR SE PROFILE PIC MUDOU
  IF p_profile_pic_url IS NOT NULL THEN
    v_profile_pic_updated := (v_current_profile_pic IS NULL OR v_current_profile_pic != p_profile_pic_url);
    IF v_profile_pic_updated THEN
      RAISE NOTICE '📸 Profile pic mudou: % -> %', 
        COALESCE(substring(v_current_profile_pic, 1, 50) || '...', 'NULL'), 
        substring(p_profile_pic_url, 1, 50) || '...';
      
      -- 🚀 ENFILEIRAR DOWNLOAD PARA STORAGE (processamento assíncrono)
      PERFORM pgmq.send('profile_pic_download_queue', jsonb_build_object(
        'lead_id', COALESCE(v_lead_id::text, null),
        'phone', v_formatted_phone,
        'profile_pic_url', p_profile_pic_url,
        'timestamp', now()::text,
        'retry_count', 0,
        'priority', 'high'
      ));
      
      RAISE NOTICE '📦 Profile pic enfileirado para download no Storage';
    END IF;
  END IF;

  IF v_lead_id IS NULL THEN
    -- CRIAR NOVO LEAD
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
      profile_pic_url -- 📸 INCLUIR PROFILE PIC
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
      CASE WHEN p_from_me THEN 0 ELSE 1 END,
      p_profile_pic_url -- 📸 FOTO DO NOVO LEAD
    )
    RETURNING id INTO v_lead_id;

    RAISE NOTICE '[save_whatsapp_message_service_role] 🆕 Novo lead criado com foto: %', v_lead_id;
  ELSE
    -- ATUALIZAR LEAD EXISTENTE (SEM ALTERAR ESTÁGIO DO KANBAN)
    UPDATE public.leads 
    SET 
      name = COALESCE(NULLIF(p_contact_name, ''), name),
      whatsapp_number_id = v_instance_id,
      -- ❌ REMOVIDO: funnel_id e kanban_stage_id - não alterar estágio de leads existentes
      last_message_time = now(),
      last_message = p_message_text,
      unread_count = CASE 
        WHEN p_from_me THEN unread_count 
        ELSE COALESCE(unread_count, 0) + 1 
      END,
      profile_pic_url = CASE 
        WHEN v_profile_pic_updated THEN p_profile_pic_url 
        ELSE profile_pic_url 
      END, -- 📸 ATUALIZAR APENAS SE MUDOU
      updated_at = now()
    WHERE id = v_lead_id;

    RAISE NOTICE '[save_whatsapp_message_service_role] ✅ Lead atualizado | Foto: %', 
      CASE WHEN v_profile_pic_updated THEN 'ATUALIZADA' ELSE 'INALTERADA' END;
  END IF;

  -- ETAPA 7: Inserir mensagem SEM o campo base64_data/ai_description
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
    -- ❌ REMOVIDO: base64_data (ai_description)
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
    -- ❌ REMOVIDO: p_base64_data
  )
  RETURNING id INTO v_message_id;

  RAISE NOTICE '[save_whatsapp_message_service_role] ✅ Mensagem inserida sem base64_data: %', v_message_id;

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
      'formatted_phone', v_formatted_phone,
      'contact_name', v_contact_name,
      'media_type', COALESCE(p_media_type, 'text'),
      'from_me', p_from_me,
      'is_new_lead', v_is_new_lead, -- 🆕 INDICADOR
      'profile_pic_updated', v_profile_pic_updated, -- 📸 INDICADOR
      'method', 'service_role_without_base64'
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
    'method', 'service_role_without_base64'
  );
END;
$function$;

-- Atualizar permissões (agora com 9 parâmetros em vez de 10)
GRANT EXECUTE ON FUNCTION public.save_whatsapp_message_service_role(text,text,text,boolean,text,text,text,text,text) TO service_role;

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Campo base64_data/ai_description removido do salvamento de mensagens';
  RAISE NOTICE '🎯 Processamento de mídia com Storage mantido intacto';
  RAISE NOTICE '📸 Profile pic processing mantido';
END $$;