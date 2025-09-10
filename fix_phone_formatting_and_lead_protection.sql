-- =====================================================
-- 🔧 CORREÇÃO: Formatação de Telefone + Proteção Total de Leads
-- =====================================================
-- OBJETIVO:
-- 1. ✅ Novos leads: salvar com telefone formatado corretamente
-- 2. ✅ Leads existentes: NUNCA alterar nome (usuário pode ter editado)
-- 3. ✅ Leads existentes: atualizar APENAS last_message, last_message_time, unread_count
-- 4. ✅ Formato: +55 (XX) NNNNN-NNNN (sempre 4 dígitos após hífen)

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
  v_clean_phone text;
  v_digits_after_ddd text;
  v_formatted_display_name text;
  v_contact_name text;
  v_is_new_lead BOOLEAN := FALSE;
  v_current_profile_pic text;
  v_profile_pic_updated BOOLEAN := FALSE;
BEGIN
  -- Log de início
  RAISE NOTICE '[save_whatsapp_message_service_role] 🚀 Processando: % | Phone: % | Contact: %', 
    p_vps_instance_id, p_phone, COALESCE(substring(p_contact_name, 1, 20), 'NULL');

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
  -- Limpar telefone (remover @s.whatsapp.net se houver)
  v_clean_phone := split_part(p_phone, '@', 1);
  
  -- 🔧 LÓGICA CORRIGIDA: Extrair dígitos após o DDD (posição 5+)
  v_digits_after_ddd := substring(v_clean_phone, 5);
  
  -- 🎯 FORMATAÇÃO CORRETA SEMPRE COM 4 DÍGITOS APÓS HÍFEN
  v_formatted_display_name := CASE 
    WHEN length(v_digits_after_ddd) = 9 THEN -- Celular 9 dígitos: 62999999999 -> 99999-9999
      '+55 (' || substring(v_clean_phone, 3, 2) || ') ' ||
      substring(v_clean_phone, 5, 5) || '-' ||
      substring(v_clean_phone, 10, 4)
    WHEN length(v_digits_after_ddd) = 8 THEN -- Fixo 8 dígitos: 6299999999 -> 9999-9999
      '+55 (' || substring(v_clean_phone, 3, 2) || ') ' ||
      substring(v_clean_phone, 5, 4) || '-' ||
      substring(v_clean_phone, 9, 4)
    ELSE 
      -- Fallback para formatos não reconhecidos
      v_clean_phone
  END;

  RAISE NOTICE '[save_whatsapp_message_service_role] 📱 Telefone formatado: % -> limpo: %, display: %', 
    p_phone, v_clean_phone, v_formatted_display_name;

  -- ETAPA 3: 📝 DEFINIR NOME APENAS PARA NOVOS LEADS
  -- Se contact_name foi enviado, usar ele. Senão, usar telefone formatado
  v_contact_name := COALESCE(NULLIF(trim(p_contact_name), ''), v_formatted_display_name);
  
  RAISE NOTICE '[save_whatsapp_message_service_role] 👤 Nome para novo lead: %', v_contact_name;

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
    AND created_by_user_id = v_user_id;

  RAISE NOTICE '[save_whatsapp_message_service_role] 🔍 Lead encontrado: %', 
    COALESCE(v_lead_id::text, 'NÃO - será criado');

  -- 📸 PROCESSAR PROFILE PIC (apenas se recebido)
  IF p_profile_pic_url IS NOT NULL THEN
    IF v_lead_id IS NULL THEN
      -- Lead novo - sempre processar
      v_profile_pic_updated := TRUE;
      RAISE NOTICE '📸 Novo lead - incluirá profile pic';
    ELSIF v_current_profile_pic IS NULL THEN
      -- Lead existe mas não tem foto - processar
      v_profile_pic_updated := TRUE;
      RAISE NOTICE '📸 Lead sem foto - adicionará profile pic';
    ELSIF v_current_profile_pic != p_profile_pic_url THEN
      -- Lead tem foto diferente - processar
      v_profile_pic_updated := TRUE;
      RAISE NOTICE '📸 Foto mudou - atualizará profile pic';
    ELSE
      v_profile_pic_updated := FALSE;
      RAISE NOTICE '📸 Foto inalterada';
    END IF;
  END IF;

  IF v_lead_id IS NULL THEN
    -- ✅ CRIAR NOVO LEAD COM NOME FORMATADO
    v_is_new_lead := TRUE;
    INSERT INTO public.leads (
      phone,                    -- Telefone limpo: "556299999999"
      name,                     -- Nome formatado: "+55 (62) 99999-9999" ou nome do perfil
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
      v_contact_name,           -- ✅ SEMPRE nome válido (formatado ou do perfil)
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

    RAISE NOTICE '[save_whatsapp_message_service_role] 🆕 Novo lead criado: % | Nome: "%"', 
      v_lead_id, v_contact_name;
      
  ELSE
    -- 🔒 LEAD EXISTENTE: PROTEÇÃO TOTAL - APENAS last_message, last_message_time, unread_count
    UPDATE public.leads 
    SET 
      -- ❌ NÃO ALTERAR: name (usuário pode ter editado manualmente)
      -- ❌ NÃO ALTERAR: whatsapp_number_id (manter original)
      -- ❌ NÃO ALTERAR: funnel_id, kanban_stage_id (usuário pode ter movido)
      -- ✅ ALTERAR APENAS: informações da última mensagem
      last_message_time = now(),
      last_message = p_message_text,
      unread_count = CASE 
        WHEN p_from_me THEN unread_count 
        ELSE COALESCE(unread_count, 0) + 1 
      END,
      -- 📸 Profile pic: atualizar apenas se mudou
      profile_pic_url = CASE 
        WHEN v_profile_pic_updated AND p_profile_pic_url IS NOT NULL THEN p_profile_pic_url 
        ELSE profile_pic_url 
      END,
      updated_at = now()
    WHERE id = v_lead_id;

    RAISE NOTICE '[save_whatsapp_message_service_role] ✅ Lead existente atualizado | Nome: PROTEGIDO | Foto: %', 
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
      'formatted_display_name', v_formatted_display_name,
      'contact_name', v_contact_name,
      'media_type', COALESCE(p_media_type, 'text'),
      'from_me', p_from_me,
      'is_new_lead', v_is_new_lead,
      'profile_pic_updated', v_profile_pic_updated,
      'lead_name_protected', NOT v_is_new_lead,  -- ✅ Indicador de proteção
      'method', 'service_role_protected_leads_formatted_phone'
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
    'method', 'service_role_protected_leads_formatted_phone'
  );
END;
$function$;

-- =====================================================
-- 🔧 SCRIPT DE CORREÇÃO DOS LEADS EXISTENTES COM NOMES VAZIOS
-- =====================================================
-- Executar APENAS UMA VEZ para corrigir leads com name = ""

-- 1. Verificar quantos leads têm nomes vazios
SELECT 
  COUNT(*) as total_leads,
  COUNT(CASE WHEN name IS NULL OR name = '' THEN 1 END) as leads_sem_nome,
  COUNT(CASE WHEN name LIKE '+55 (%' THEN 1 END) as leads_com_telefone_formatado
FROM public.leads;

-- 2. Corrigir leads com nomes vazios (aplicar formatação correta)
UPDATE public.leads 
SET 
  name = CASE 
    -- Extrair dígitos após DDD para determinar formato
    WHEN length(substring(phone, 5)) = 9 THEN -- Celular 9 dígitos
      '+55 (' || substring(phone, 3, 2) || ') ' ||
      substring(phone, 5, 5) || '-' ||
      substring(phone, 10, 4)
    WHEN length(substring(phone, 5)) = 8 THEN -- Fixo 8 dígitos  
      '+55 (' || substring(phone, 3, 2) || ') ' ||
      substring(phone, 5, 4) || '-' ||
      substring(phone, 9, 4)
    ELSE 
      phone -- Manter como está se formato não reconhecido
  END,
  updated_at = now()
WHERE name IS NULL OR name = '';

-- 3. Verificar resultado da correção
SELECT 
  COUNT(*) as total_leads_apos_correcao,
  COUNT(CASE WHEN name IS NULL OR name = '' THEN 1 END) as leads_sem_nome_apos_correcao,
  COUNT(CASE WHEN name LIKE '+55 (%' THEN 1 END) as leads_com_telefone_formatado_apos_correcao
FROM public.leads;

-- ✅ Resultado esperado:
-- leads_sem_nome_apos_correcao: 0
-- leads_com_telefone_formatado_apos_correcao: aumentou

-- 4. Exemplos dos nomes corrigidos
SELECT 
  id,
  name,
  phone,
  updated_at
FROM public.leads 
WHERE name LIKE '+55 (%'
ORDER BY updated_at DESC
LIMIT 10;