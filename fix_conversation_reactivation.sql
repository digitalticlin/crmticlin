-- 🔄 CORREÇÃO: Reativar conversas arquivadas quando recebem novas mensagens
-- Problema: Quando uma conversa é excluída (archived), ela não volta a aparecer quando recebe novas mensagens

-- 1. Primeiro vamos adicionar a variável que estava faltando na função original
ALTER FUNCTION public.save_whatsapp_message_service_role(text, text, text, boolean, text, text, text, text, text, text)
ADD PARAMETER v_conversation_status text;

-- 2. Criar uma versão corrigida da função que reativa conversas arquivadas
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
  v_conversation_status text; -- ✅ NOVA VARIÁVEL
  v_profile_pic_updated BOOLEAN := FALSE;
BEGIN
  -- Log de início
  RAISE NOTICE '[save_whatsapp_message_service_role] 🚀 Processando: % | Phone: %', 
    p_vps_instance_id, p_phone;

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

  -- ETAPA 2: 📱 FORMATAÇÃO DO TELEFONE
  v_phone_data := format_brazilian_phone(p_phone);
  v_clean_phone := v_phone_data->>'phone';
  v_display_name := v_phone_data->>'display';

  -- ETAPA 3: 📝 DEFINIR NOME DO CONTATO
  IF p_contact_name IS NOT NULL AND trim(p_contact_name) != '' THEN
    v_contact_name := trim(p_contact_name);
  ELSE
    v_contact_name := v_display_name;
  END IF;

  -- ETAPA 4-5: Buscar funil e estágio padrão
  SELECT id INTO v_funnel_id
  FROM public.funnels 
  WHERE created_by_user_id = v_user_id 
  ORDER BY created_at ASC 
  LIMIT 1;

  IF v_funnel_id IS NOT NULL THEN
    SELECT id INTO v_stage_id
    FROM public.kanban_stages 
    WHERE funnel_id = v_funnel_id 
    ORDER BY order_position ASC 
    LIMIT 1;
  END IF;

  -- 🔄 ETAPA 6 CORRIGIDA: Buscar lead pelo USUÁRIO (incluindo arquivados)
  SELECT id, profile_pic_url, COALESCE(conversation_status, 'active')
  INTO v_lead_id, v_current_profile_pic, v_conversation_status
  FROM public.leads 
  WHERE phone = v_clean_phone 
    AND created_by_user_id = v_user_id;  -- ✅ BUSCA POR USUÁRIO

  RAISE NOTICE '[save_whatsapp_message_service_role] 🔍 Lead: % | Status: %', 
    COALESCE(v_lead_id::text, 'NOVO'), COALESCE(v_conversation_status, 'null');

  -- Profile pic processing (mantendo lógica original)
  IF p_profile_pic_url IS NOT NULL THEN
    IF v_lead_id IS NULL OR v_current_profile_pic IS NULL OR v_current_profile_pic != p_profile_pic_url THEN
      v_profile_pic_updated := TRUE;
      -- Enfileirar processamento (código original mantido)
      PERFORM pgmq.send('profile_pic_download_queue', jsonb_build_object(
        'lead_id', COALESCE(v_lead_id, 'pending'),
        'phone', v_clean_phone,
        'profile_pic_url', p_profile_pic_url,
        'instance_id', v_instance_id,
        'is_new_lead', v_lead_id IS NULL,
        'current_pic_url', v_current_profile_pic,
        'timestamp', now()::text,
        'retry_count', 0,
        'priority', CASE WHEN v_lead_id IS NULL THEN 'urgent' ELSE 'high' END
      ));
    END IF;
  END IF;

  IF v_lead_id IS NULL THEN
    -- CRIAR NOVO LEAD
    v_is_new_lead := TRUE;
    INSERT INTO public.leads (
      phone, name, whatsapp_number_id, created_by_user_id,
      funnel_id, kanban_stage_id, last_message_time, last_message,
      import_source, unread_count, profile_pic_url, conversation_status
    )
    VALUES (
      v_clean_phone, v_contact_name, v_instance_id, v_user_id,
      v_funnel_id, v_stage_id, now(), p_message_text,
      'realtime', CASE WHEN p_from_me THEN 0 ELSE 1 END, 
      p_profile_pic_url, 'active'
    )
    RETURNING id INTO v_lead_id;

    RAISE NOTICE '[save_whatsapp_message_service_role] 🆕 Novo lead criado: %', v_lead_id;
  ELSE
    -- 🔄 ATUALIZAR LEAD + REATIVAR SE NECESSÁRIO
    UPDATE public.leads 
    SET 
      name = COALESCE(NULLIF(p_contact_name, ''), name),
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
      whatsapp_number_id = v_instance_id,
      -- 🔄 LÓGICA DE REATIVAÇÃO: Se arquivado/fechado e mensagem recebida, reativar
      conversation_status = CASE 
        WHEN conversation_status IN ('archived', 'closed') AND NOT p_from_me THEN 'active'
        ELSE COALESCE(conversation_status, 'active')
      END,
      updated_at = now()
    WHERE id = v_lead_id;

    RAISE NOTICE '[save_whatsapp_message_service_role] ✅ Lead atualizado | Status: % -> %', 
      v_conversation_status,
      CASE 
        WHEN v_conversation_status IN ('archived', 'closed') AND NOT p_from_me THEN 'active (REATIVADO)'
        ELSE 'inalterado'
      END;
  END IF;

  -- ETAPA 7: Inserir mensagem
  INSERT INTO public.messages (
    lead_id, whatsapp_number_id, text, from_me, timestamp, status,
    created_by_user_id, media_type, media_url, import_source,
    external_message_id, base64_data
  )
  VALUES (
    v_lead_id, v_instance_id, p_message_text, p_from_me, now(),
    CASE WHEN p_from_me THEN 'sent'::message_status ELSE 'received'::message_status END,
    v_user_id, COALESCE(p_media_type::media_type, 'text'::media_type), p_media_url,
    'realtime', p_external_message_id, p_base64_data
  )
  RETURNING id INTO v_message_id;

  -- ETAPA 8: Retornar resultado
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'message_id', v_message_id,
      'lead_id', v_lead_id,
      'instance_id', v_instance_id,
      'user_id', v_user_id,
      'is_new_lead', v_is_new_lead,
      'conversation_reactivated', (v_conversation_status IN ('archived', 'closed') AND NOT p_from_me),
      'method', 'webhook_with_reactivation'
    )
  );

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[save_whatsapp_message_service_role] ❌ ERRO: %', SQLERRM;
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'method', 'webhook_with_reactivation'
  );
END;
$function$;