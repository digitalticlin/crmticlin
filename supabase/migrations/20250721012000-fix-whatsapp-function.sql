
-- CRIAR FUNÇÃO SQL CORRIGIDA PARA TRABALHAR SEM RLS
CREATE OR REPLACE FUNCTION public.save_whatsapp_message_corrected(
  p_vps_instance_id text,
  p_phone text,
  p_message_text text,
  p_from_me boolean,
  p_external_message_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_instance_id UUID;
  v_user_id UUID;
  v_lead_id UUID;
  v_message_id UUID;
  v_formatted_phone TEXT;
  v_formatted_name TEXT;
  v_clean_phone TEXT;
BEGIN
  -- Log de início
  RAISE NOTICE '[save_whatsapp_message_corrected] 🚀 Iniciando SEM RLS para instância: %', p_vps_instance_id;
  RAISE NOTICE '[save_whatsapp_message_corrected] 📞 Telefone recebido: %', p_phone;

  -- 1. BUSCAR INSTÂNCIA (agora sem RLS)
  SELECT id, created_by_user_id 
  INTO v_instance_id, v_user_id
  FROM whatsapp_instances 
  WHERE vps_instance_id = p_vps_instance_id;
  
  IF v_instance_id IS NULL THEN
    RAISE NOTICE '[save_whatsapp_message_corrected] ❌ Instância não encontrada: %', p_vps_instance_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Instance not found',
      'vps_instance_id', p_vps_instance_id
    );
  END IF;

  RAISE NOTICE '[save_whatsapp_message_corrected] ✅ Instância encontrada: % - User: %', v_instance_id, v_user_id;

  -- 2. FORMATAÇÃO MELHORADA DO TELEFONE BRASILEIRO
  v_clean_phone := p_phone;
  
  -- Se o telefone tem 13 dígitos e começa com 55, é brasileiro
  IF length(v_clean_phone) = 13 AND v_clean_phone LIKE '55%' THEN
    -- Remover código do país (55)
    v_clean_phone := substring(v_clean_phone, 3);
  END IF;
  
  -- Se tem 10 dígitos, adicionar o 9 no celular (exceto para 11 - São Paulo)
  IF length(v_clean_phone) = 10 AND NOT v_clean_phone LIKE '11%' THEN
    v_clean_phone := substring(v_clean_phone, 1, 2) || '9' || substring(v_clean_phone, 3);
  END IF;
  
  -- Formatar para exibição: +55 (11) 99999-9999
  IF length(v_clean_phone) = 11 THEN
    v_formatted_phone := '+55 (' || substring(v_clean_phone, 1, 2) || ') ' ||
                        substring(v_clean_phone, 3, 5) || '-' ||
                        substring(v_clean_phone, 8, 4);
  ELSE
    -- Fallback para números não convencionais
    v_formatted_phone := '+55 ' || v_clean_phone;
  END IF;

  v_formatted_name := 'Contato ' || v_formatted_phone;

  RAISE NOTICE '[save_whatsapp_message_corrected] 📞 Formatação do telefone:';
  RAISE NOTICE '  - Original: %', p_phone;
  RAISE NOTICE '  - Limpo: %', v_clean_phone;
  RAISE NOTICE '  - Formatado: %', v_formatted_phone;

  -- 3. BUSCAR OU CRIAR LEAD (agora sem RLS)
  SELECT id INTO v_lead_id
  FROM leads 
  WHERE phone = v_formatted_phone 
    AND created_by_user_id = v_user_id;

  IF v_lead_id IS NULL THEN
    -- Criar novo lead
    INSERT INTO leads (
      phone, 
      name, 
      whatsapp_number_id, 
      created_by_user_id,
      last_message_time,
      last_message,
      import_source
    )
    VALUES (
      v_formatted_phone,
      v_formatted_name,
      v_instance_id,
      v_user_id,
      now(),
      p_message_text,
      'realtime'
    )
    RETURNING id INTO v_lead_id;

    RAISE NOTICE '[save_whatsapp_message_corrected] ✅ Novo lead criado: %', v_lead_id;
  ELSE
    -- Atualizar lead existente
    UPDATE leads 
    SET 
      whatsapp_number_id = v_instance_id,
      last_message_time = now(),
      last_message = p_message_text,
      updated_at = now()
    WHERE id = v_lead_id;

    RAISE NOTICE '[save_whatsapp_message_corrected] ✅ Lead atualizado: %', v_lead_id;
  END IF;

  -- 4. SALVAR MENSAGEM (agora sem RLS)
  INSERT INTO messages (
    lead_id,
    whatsapp_number_id,
    text,
    from_me,
    timestamp,
    status,
    created_by_user_id,
    media_type,
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
    'text'::media_type,
    'realtime',
    p_external_message_id
  )
  RETURNING id INTO v_message_id;

  RAISE NOTICE '[save_whatsapp_message_corrected] ✅ Mensagem salva com sucesso: %', v_message_id;

  -- 5. ATUALIZAR CONTADOR DE NÃO LIDAS
  IF NOT p_from_me THEN
    UPDATE leads 
    SET unread_count = COALESCE(unread_count, 0) + 1
    WHERE id = v_lead_id;
    
    RAISE NOTICE '[save_whatsapp_message_corrected] ✅ Contador de não lidas atualizado';
  END IF;

  -- 6. RETORNAR SUCESSO COMPLETO
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'message_id', v_message_id,
      'lead_id', v_lead_id,
      'instance_id', v_instance_id,
      'user_id', v_user_id,
      'formatted_phone', v_formatted_phone,
      'clean_phone', v_clean_phone,
      'original_phone', p_phone,
      'from_me', p_from_me
    )
  );

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[save_whatsapp_message_corrected] ❌ ERRO CRÍTICO: % - SQLSTATE: %', SQLERRM, SQLSTATE;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE,
    'phone', p_phone,
    'vps_instance_id', p_vps_instance_id
  );
END;
$function$;
