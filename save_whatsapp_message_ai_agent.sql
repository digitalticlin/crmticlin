-- 🤖 RPC ESPECÍFICA PARA AI MESSAGING SERVICE
-- Esta função é otimizada para salvar mensagens enviadas pela IA
-- Diferenças da função webhook:
-- - Sem p_profile_pic_url (IA não processa fotos de perfil)
-- - Sem p_base64_data (IA não precisa base64)
-- - Sempre p_from_me = true (mensagens da IA)
-- - Lead lookup corrigido: busca por created_by_user_id em vez de whatsapp_number_id

CREATE OR REPLACE FUNCTION public.save_whatsapp_message_ai_agent(
  p_vps_instance_id text,
  p_phone text,
  p_message_text text,
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
  v_phone_data jsonb;
  v_clean_phone text;
  v_display_name text;
  v_contact_name text;
  v_is_new_lead BOOLEAN := FALSE;
BEGIN
  -- Log de início
  RAISE NOTICE '[save_whatsapp_message_ai_agent] 🤖 Processando mensagem da IA: % | Phone: %', 
    p_vps_instance_id, p_phone;

  -- ETAPA 1: Buscar instância
  SELECT id, created_by_user_id 
  INTO v_instance_id, v_user_id
  FROM public.whatsapp_instances 
  WHERE vps_instance_id = p_vps_instance_id;
  
  IF v_instance_id IS NULL THEN
    RAISE NOTICE '[save_whatsapp_message_ai_agent] ❌ Instância não encontrada: %', p_vps_instance_id;
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

  RAISE NOTICE '[save_whatsapp_message_ai_agent] 📱 Telefone formatado: % -> phone: %, display: %', 
    p_phone, v_clean_phone, v_display_name;

  -- ETAPA 3: 📝 DEFINIR NOME DO CONTATO (prioridade: profileName > formato telefone)
  IF p_contact_name IS NOT NULL AND trim(p_contact_name) != '' THEN
    v_contact_name := trim(p_contact_name);  -- ✅ Usar nome do lead
    RAISE NOTICE '[save_whatsapp_message_ai_agent] 👤 Nome do lead: %', v_contact_name;
  ELSE
    v_contact_name := v_display_name;        -- ✅ Usar formato telefone: "+55 (62) 9921-2484"
    RAISE NOTICE '[save_whatsapp_message_ai_agent] 📱 Nome padrão (telefone): %', v_contact_name;
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

  -- ETAPA 6: 🚨 CORREÇÃO PRINCIPAL - Buscar lead existente pelo PHONE + USUÁRIO (incluindo arquivados)
  SELECT id, COALESCE(conversation_status, 'active') INTO v_lead_id, v_conversation_status
  FROM public.leads 
  WHERE phone = v_clean_phone 
    AND created_by_user_id = v_user_id;  -- ✅ BUSCA PELO USUÁRIO, NÃO INSTÂNCIA

  RAISE NOTICE '[save_whatsapp_message_ai_agent] 🔍 Lead encontrado: % | Status: %', 
    COALESCE(v_lead_id::text, 'NÃO'), COALESCE(v_conversation_status, 'null');

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
      unread_count
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
      'ai_agent',
      0  -- Mensagens da IA não são "não lidas"
    )
    RETURNING id INTO v_lead_id;

    RAISE NOTICE '[save_whatsapp_message_ai_agent] 🆕 Novo lead criado: % | Phone: % | Name: %', 
      v_lead_id, v_clean_phone, v_contact_name;
  ELSE
    -- ATUALIZAR LEAD EXISTENTE
    UPDATE public.leads 
    SET 
      name = COALESCE(NULLIF(p_contact_name, ''), name), -- Manter nome se não vier novo
      last_message_time = now(),
      last_message = p_message_text,
      whatsapp_number_id = v_instance_id,  -- ✅ Atualizar para instância atual
      updated_at = now()
    WHERE id = v_lead_id;

    RAISE NOTICE '[save_whatsapp_message_ai_agent] ✅ Lead atualizado para instância atual';
  END IF;

  -- ETAPA 7: Inserir mensagem da IA
  INSERT INTO public.messages (
    lead_id,
    whatsapp_number_id,
    text,
    from_me,  -- ✅ SEMPRE TRUE para mensagens da IA
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
    true,  -- ✅ SEMPRE TRUE para IA
    now(),
    'sent'::message_status,
    v_user_id,
    COALESCE(p_media_type::media_type, 'text'::media_type),
    p_media_url,
    'ai_agent',
    p_external_message_id
  )
  RETURNING id INTO v_message_id;

  RAISE NOTICE '[save_whatsapp_message_ai_agent] ✅ Mensagem da IA inserida: %', v_message_id;

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
      'from_me', true,
      'is_new_lead', v_is_new_lead,
      'method', 'ai_agent_optimized',
      'lead_lookup_method', 'by_user_id_not_instance_id'
    )
  );

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[save_whatsapp_message_ai_agent] ❌ ERRO: % - SQLSTATE: %', SQLERRM, SQLSTATE;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE,
    'phone', p_phone,
    'vps_instance_id', p_vps_instance_id,
    'method', 'ai_agent_optimized'
  );
END;
$function$;