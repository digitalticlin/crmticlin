-- =====================================================
-- 🔧 CORREÇÃO COMPLETA DA FUNÇÃO RCP
-- =====================================================
-- Problemas identificados no @RETORNO:
-- 1. ❌ Leads com name = "" (vazio) ao invés de telefone formatado
-- 2. ✅ from_me funcionando corretamente  
-- 3. ⚠️ media_url parcialmente funcional (alguns NULL quando deveria ter URL)

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
  RAISE NOTICE '[save_whatsapp_message_service_role] 🚀 Processando: % | Phone: % | Contact: % | Media URL: %', 
    p_vps_instance_id, p_phone, 
    COALESCE(substring(p_contact_name, 1, 20), 'NULL'), 
    CASE WHEN p_media_url IS NOT NULL THEN 'RECEBIDA' ELSE 'NULL' END;

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

  -- ETAPA 2: 📱 FORMATAÇÃO CORRETA DO TELEFONE usando função auxiliar
  -- Verificar se a função format_brazilian_phone existe, senão usar lógica inline
  BEGIN
    v_phone_data := format_brazilian_phone(p_phone);
    v_clean_phone := v_phone_data->>'phone';        -- "556299212484"
    v_display_name := v_phone_data->>'display';     -- "+55 (62) 9921-2484"
  EXCEPTION WHEN OTHERS THEN
    -- Fallback caso a função não exista - formatação manual
    v_clean_phone := split_part(p_phone, '@', 1);
    
    -- Criar nome formatado para exibição
    IF length(v_clean_phone) = 13 THEN -- 556299999999 = 9 dígitos
      v_display_name := '+55 (' || substring(v_clean_phone, 3, 2) || ') ' ||
                       substring(v_clean_phone, 5, 5) || '-' ||
                       substring(v_clean_phone, 10, 4);
    ELSIF length(v_clean_phone) = 12 THEN -- 55629999999 = 8 dígitos  
      v_display_name := '+55 (' || substring(v_clean_phone, 3, 2) || ') ' ||
                       substring(v_clean_phone, 5, 4) || '-' ||
                       substring(v_clean_phone, 9, 4);
    ELSE
      -- Telefones com formato diferente - usar como está
      v_display_name := v_clean_phone;
    END IF;
  END;

  RAISE NOTICE '[save_whatsapp_message_service_role] 📱 Telefone formatado: % -> phone: %, display: %', 
    p_phone, v_clean_phone, v_display_name;

  -- ETAPA 3: 📝 DEFINIR NOME DO CONTATO - LÓGICA CORRIGIDA
  -- 🔧 FIX: Garantir que nunca fique vazio - sempre ter fallback
  IF p_contact_name IS NOT NULL AND trim(p_contact_name) != '' THEN
    v_contact_name := trim(p_contact_name);  -- ✅ Usar nome do perfil do WhatsApp
    RAISE NOTICE '[save_whatsapp_message_service_role] 👤 Nome do perfil: %', v_contact_name;
  ELSE
    v_contact_name := v_display_name;        -- ✅ SEMPRE usar telefone formatado como fallback
    RAISE NOTICE '[save_whatsapp_message_service_role] 📱 Nome fallback (telefone formatado): %', v_contact_name;
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

  -- ETAPA 6: Buscar lead existente pelo PHONE LIMPO + USUÁRIO
  SELECT id, profile_pic_url INTO v_lead_id, v_current_profile_pic
  FROM public.leads 
  WHERE phone = v_clean_phone 
    AND created_by_user_id = v_user_id;  -- ✅ Busca por usuário, não por instância

  RAISE NOTICE '[save_whatsapp_message_service_role] 🔍 Lead encontrado: % | Profile pic atual: %', 
    COALESCE(v_lead_id::text, 'NÃO'), 
    CASE WHEN v_current_profile_pic IS NULL THEN 'NULL' ELSE substring(v_current_profile_pic, 1, 50) END;

  -- 📸 PROCESSAR PROFILE PIC
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
    -- CRIAR NOVO LEAD - 🔧 GARANTIR NOME NUNCA VAZIO
    v_is_new_lead := TRUE;
    INSERT INTO public.leads (
      phone,                    
      name,                     -- ✅ SEMPRE com nome válido (nunca vazio)
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
      v_contact_name,           -- ✅ GARANTIDO: nunca vazio
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

    RAISE NOTICE '[save_whatsapp_message_service_role] 🆕 Novo lead criado: % | Phone: % | Name: "%"', 
      v_lead_id, v_clean_phone, v_contact_name;
  ELSE
    -- 🔒 ATUALIZAR LEAD EXISTENTE - NOME PROTEGIDO (não alterar se já existe)
    UPDATE public.leads 
    SET 
      -- 🔧 NÃO ALTERAR NOME se já existe e não está vazio
      name = CASE 
        WHEN name IS NULL OR name = '' THEN v_contact_name  -- ✅ FIX: Se vazio, corrigir
        ELSE name  -- ✅ MANTER nome existente se válido
      END,
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

    RAISE NOTICE '[save_whatsapp_message_service_role] ✅ Lead atualizado | Nome: PROTEGIDO | Foto: %', 
      CASE WHEN v_profile_pic_updated THEN 'ATUALIZADA' ELSE 'INALTERADA' END;
  END IF;

  -- ETAPA 7: Inserir mensagem com TODOS os campos corretos
  INSERT INTO public.messages (
    lead_id,
    whatsapp_number_id,
    text,
    from_me,                    -- ✅ CONFIRMADO: Funcionando
    timestamp,
    status,
    created_by_user_id,
    media_type,
    media_url,                  -- ✅ ACEITAR URL quando fornecida
    import_source,
    external_message_id
  )
  VALUES (
    v_lead_id,
    v_instance_id,
    p_message_text,
    p_from_me,                  -- ✅ Boolean passado corretamente
    now(),
    CASE WHEN p_from_me THEN 'sent'::message_status ELSE 'received'::message_status END,
    v_user_id,
    COALESCE(p_media_type::media_type, 'text'::media_type),
    p_media_url,                -- ✅ NULL inicialmente, será atualizado se houver mídia
    'realtime',
    p_external_message_id
  )
  RETURNING id INTO v_message_id;

  RAISE NOTICE '[save_whatsapp_message_service_role] ✅ Mensagem inserida: % | Media URL: %', 
    v_message_id, COALESCE(substring(p_media_url, 1, 50), 'NULL');

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
      'contact_name', v_contact_name,         -- ✅ GARANTIDO: nunca vazio
      'media_type', COALESCE(p_media_type, 'text'),
      'from_me', p_from_me,                   -- ✅ Boolean correto
      'is_new_lead', v_is_new_lead,
      'profile_pic_updated', v_profile_pic_updated,
      'media_url_received', p_media_url IS NOT NULL,  -- ✅ Indicador
      'method', 'service_role_fixed_names_and_media'
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
    'method', 'service_role_fixed_names_and_media'
  );
END;
$function$;

-- =====================================================
-- 🔧 SCRIPT DE CORREÇÃO DOS LEADS COM NOMES VAZIOS
-- =====================================================

-- 1. Corrigir leads existentes com nomes vazios
UPDATE public.leads 
SET name = CASE 
  WHEN length(phone) = 13 THEN -- 556299999999 = 9 dígitos
    '+55 (' || substring(phone, 3, 2) || ') ' ||
    substring(phone, 5, 5) || '-' ||
    substring(phone, 10, 4)
  WHEN length(phone) = 12 THEN -- 55629999999 = 8 dígitos  
    '+55 (' || substring(phone, 3, 2) || ') ' ||
    substring(phone, 5, 4) || '-' ||
    substring(phone, 9, 4)
  ELSE phone -- Manter como está se formato diferente
END,
updated_at = now()
WHERE name IS NULL OR name = '';

-- 2. Verificar correções aplicadas
SELECT 
  COUNT(*) as total_leads,
  COUNT(CASE WHEN name IS NULL OR name = '' THEN 1 END) as leads_sem_nome,
  COUNT(CASE WHEN name LIKE '+55 (%' THEN 1 END) as leads_com_telefone_formatado
FROM public.leads;

-- ✅ Resultado esperado após correção:
-- - leads_sem_nome: 0
-- - leads_com_telefone_formatado: maior que antes