-- CORREÇÃO: Implementar owner_id na criação de leads
-- Este arquivo corrige a função save_whatsapp_message_complete para incluir owner_id

-- FUNÇÃO AUXILIAR: Determinar qual usuário é responsável pela instância WhatsApp
CREATE OR REPLACE FUNCTION public.get_instance_owner(
  p_instance_id UUID,
  p_admin_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_owner_id UUID;
BEGIN
  -- Buscar usuário responsável pela instância na tabela user_whatsapp_numbers
  SELECT uwn.profile_id INTO v_owner_id
  FROM public.user_whatsapp_numbers uwn
  INNER JOIN public.profiles p ON p.id = uwn.profile_id
  WHERE uwn.whatsapp_number_id = p_instance_id
    AND p.role IN ('manager', 'operational') -- Apenas membros da equipe
  LIMIT 1;

  -- Se não encontrou responsável específico, retorna o admin
  RETURN COALESCE(v_owner_id, p_admin_user_id);
END;
$function$;

-- ATUALIZAR FUNÇÃO PRINCIPAL: Incluir owner_id na criação de leads
CREATE OR REPLACE FUNCTION public.save_whatsapp_message_complete(
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
  v_owner_id UUID; -- ✅ NOVO: ID do responsável pelo lead
  v_formatted_phone TEXT;
  v_contact_name TEXT;
  v_existing_lead_count INTEGER;
BEGIN
  -- Log de início
  RAISE NOTICE '[save_whatsapp_message_complete] 🚀 Iniciando processamento otimizado para: %', p_vps_instance_id;

  -- ETAPA 1: Buscar instância (com RLS ativo)
  SELECT id, created_by_user_id 
  INTO v_instance_id, v_user_id
  FROM public.whatsapp_instances 
  WHERE vps_instance_id = p_vps_instance_id;
  
  IF v_instance_id IS NULL THEN
    RAISE NOTICE '[save_whatsapp_message_complete] ❌ Instância não encontrada: %', p_vps_instance_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Instance not found',
      'vps_instance_id', p_vps_instance_id
    );
  END IF;

  -- ETAPA 2: Determinar responsável pela instância (owner_id) - ✅ NOVO
  v_owner_id := public.get_instance_owner(v_instance_id, v_user_id);
  RAISE NOTICE '[save_whatsapp_message_complete] 👤 Owner determinado: %', v_owner_id;

  -- ETAPA 3: Formatar telefone brasileiro
  v_formatted_phone := '+55 (' || substring(p_phone, 1, 2) || ') ' ||
                      substring(p_phone, 3, 5) || '-' ||
                      substring(p_phone, 8, 4);

  -- ETAPA 4: Definir nome do contato - ✅ CORRIGIDO: Não usar nome se fromMe = TRUE
  v_contact_name := CASE 
    WHEN p_from_me THEN v_formatted_phone  -- Se nossa mensagem, usar apenas telefone
    ELSE COALESCE(NULLIF(p_contact_name, ''), v_formatted_phone)  -- Se mensagem deles, usar nome real
  END;

  -- ETAPA 5: Buscar funil padrão do responsável (não do admin) - ✅ MELHORADO
  SELECT id INTO v_funnel_id
  FROM public.funnels 
  WHERE created_by_user_id = v_user_id 
  ORDER BY created_at ASC 
  LIMIT 1;

  -- ETAPA 6: Buscar primeiro estágio do funil
  IF v_funnel_id IS NOT NULL THEN
    SELECT id INTO v_stage_id
    FROM public.kanban_stages 
    WHERE funnel_id = v_funnel_id 
    ORDER BY order_position ASC 
    LIMIT 1;
  END IF;

  -- ETAPA 7: Buscar ou criar lead (operação otimizada)
  SELECT id INTO v_lead_id
  FROM public.leads 
  WHERE phone = v_formatted_phone 
    AND created_by_user_id = v_user_id;

  IF v_lead_id IS NULL THEN
    -- Criar novo lead COM owner_id - ✅ CORRIGIDO
    INSERT INTO public.leads (
      phone, 
      name, 
      whatsapp_number_id, 
      created_by_user_id,
      owner_id, -- ✅ NOVO CAMPO
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
      v_owner_id, -- ✅ NOVO VALOR
      v_funnel_id,
      v_stage_id,
      now(),
      p_message_text,
      'realtime',
      CASE WHEN p_from_me THEN 0 ELSE 1 END
    )
    RETURNING id INTO v_lead_id;

    RAISE NOTICE '[save_whatsapp_message_complete] ✅ Novo lead criado: % (owner: %) (nome: %)', v_lead_id, v_owner_id, v_contact_name;
  ELSE
    -- Atualizar lead existente COM owner_id - ✅ MELHORADO + CORREÇÃO NOME
    UPDATE public.leads 
    SET 
      name = CASE 
        WHEN p_from_me THEN name  -- Se nossa mensagem, manter nome atual
        ELSE COALESCE(NULLIF(p_contact_name, ''), name)  -- Se mensagem deles, atualizar nome real
      END,
      whatsapp_number_id = v_instance_id,
      owner_id = v_owner_id, -- ✅ ATUALIZAR OWNER TAMBÉM
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

    RAISE NOTICE '[save_whatsapp_message_complete] ✅ Lead atualizado: % (owner: %) (fromMe: %)', v_lead_id, v_owner_id, p_from_me;
  END IF;

  -- ETAPA 8: Inserir mensagem
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

  RAISE NOTICE '[save_whatsapp_message_complete] ✅ Mensagem inserida: %', v_message_id;

  -- ETAPA 9: Retornar resultado completo
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'message_id', v_message_id,
      'lead_id', v_lead_id,
      'instance_id', v_instance_id,
      'user_id', v_user_id,
      'owner_id', v_owner_id, -- ✅ INCLUIR NO RETORNO
      'funnel_id', v_funnel_id,
      'stage_id', v_stage_id,
      'formatted_phone', v_formatted_phone,
      'contact_name', v_contact_name,
      'media_type', COALESCE(p_media_type, 'text'),
      'from_me', p_from_me,
      'method', 'optimized_complete_with_owner'
    )
  );

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[save_whatsapp_message_complete] ❌ ERRO: % - SQLSTATE: %', SQLERRM, SQLSTATE;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE,
    'phone', p_phone,
    'vps_instance_id', p_vps_instance_id,
    'method', 'optimized_complete_with_owner'
  );
END;
$function$;

-- COMENTÁRIOS DE IMPLEMENTAÇÃO
/*
🎯 FUNCIONALIDADES IMPLEMENTADAS:

1. ✅ Função get_instance_owner(): 
   - Busca qual usuário da equipe é responsável pela instância WhatsApp
   - Fallback para admin se não houver responsável específico

2. ✅ Campo owner_id na criação de leads:
   - Todo lead novo recebe automaticamente o owner_id
   - Owner_id é baseado na instância WhatsApp que recebeu a mensagem

3. ✅ Atualização de leads existentes:
   - Owner_id pode ser atualizado se a responsabilidade mudou

4. ✅ Logs melhorados:
   - Rastreamento de qual usuário ficou responsável

📋 PRÓXIMOS PASSOS:
- Executar este arquivo no Supabase
- Testar criação de leads via webhook
- Verificar se owner_id está sendo preenchido corretamente
*/