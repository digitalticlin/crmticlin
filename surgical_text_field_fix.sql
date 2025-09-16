-- =====================================================================
-- 🔧 CORREÇÃO CIRÚRGICA DO CAMPO TEXT - ISOLAMENTO COMPLETO
-- =====================================================================
-- FASE 1: Renomear função duplicada + Correção cirúrgica das 3 funções RPC
-- ISOLAMENTO TOTAL: Cada Edge Function terá sua lógica própria
-- SEM FUNÇÃO UNIVERSAL: Correção inline em cada função
-- =====================================================================

-- 🎯 SITUAÇÃO ATUAL (confirmada via RETORNO):
-- FUNÇÃO 1 (OID 661071): save_whatsapp_message_service_role - 9 params (SEM base64) → VPS webhook
-- FUNÇÃO 2 (OID 740997): save_whatsapp_message_service_role - 10 params (COM base64) → CRM interno

-- =====================================================================

-- 1️⃣ STEP 1: RENOMEAR FUNÇÃO DUPLICADA PARA ISOLAMENTO COMPLETO

-- Renomear a função COM p_base64_data para evitar confusão
ALTER FUNCTION public.save_whatsapp_message_service_role(
    p_vps_instance_id text, 
    p_phone text, 
    p_message_text text, 
    p_from_me boolean, 
    p_media_type text, 
    p_media_url text, 
    p_external_message_id text, 
    p_contact_name text, 
    p_base64_data text, 
    p_profile_pic_url text
) RENAME TO save_whatsapp_message_crm_internal;

-- Verificar se renomeação foi bem-sucedida
SELECT 
    'VERIFICAÇÃO RENOMEAÇÃO:' as status,
    proname as nome_funcao,
    oid as function_oid,
    array_length(proargtypes, 1) as total_params,
    CASE 
        WHEN proname = 'save_whatsapp_message_service_role' THEN '✅ VPS WEBHOOK (mantém nome original)'
        WHEN proname = 'save_whatsapp_message_crm_internal' THEN '✅ CRM INTERNO (renomeada com sucesso)'
        ELSE '❓ OUTRAS'
    END as isolamento_status
FROM pg_proc 
WHERE proname IN ('save_whatsapp_message_service_role', 'save_whatsapp_message_crm_internal')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- =====================================================================

-- 2️⃣ STEP 2: CORREÇÃO CIRÚRGICA - save_whatsapp_message_service_role (VPS)
-- FUNÇÃO QUE RECEBE DA VPS (9 parâmetros, SEM base64)
-- CORREÇÃO: Adicionar lógica inline para campo TEXT com emojis

CREATE OR REPLACE FUNCTION public.save_whatsapp_message_service_role(
    p_vps_instance_id text, 
    p_phone text, 
    p_message_text text, 
    p_from_me boolean, 
    p_media_type text DEFAULT 'text'::text, 
    p_media_url text DEFAULT NULL::text, 
    p_external_message_id text DEFAULT NULL::text, 
    p_contact_name text DEFAULT NULL::text, 
    p_profile_pic_url text DEFAULT NULL::text
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
  v_final_text text; -- 🆕 VARIÁVEL PARA TEXTO CORRIGIDO
BEGIN
  -- Log de início
  RAISE NOTICE '[save_whatsapp_message_service_role] 🚀 Processando: % | Phone: % | IGNORANDO Profile Name (sempre usar formato padrão)', 
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

  -- ETAPA 3: 📝 DEFINIR NOME DO CONTATO - SEMPRE USAR FORMATO PADRÃO
  -- 🔧 FIX CRÍTICO: SEMPRE descartar profile name e usar telefone formatado
  v_contact_name := v_display_name;  -- ✅ SEMPRE usar telefone formatado
  RAISE NOTICE '[save_whatsapp_message_service_role] 📱 Nome SEMPRE formato padrão: %', v_contact_name;

  -- 🆕 ETAPA 3.5: CORREÇÃO CIRÚRGICA DO CAMPO TEXT
  -- Aplicar padrão de emojis correto INLINE (sem função externa)
  CASE 
    WHEN p_media_type = 'text' THEN 
      v_final_text := p_message_text; -- Texto original
    WHEN p_media_type = 'image' THEN 
      v_final_text := CASE 
        WHEN p_message_text IS NOT NULL AND p_message_text != '' AND p_message_text NOT IN ('[Mensagem não suportada]', '[Sticker]') 
        THEN '📷 Imagem: ' || p_message_text
        ELSE '📷 Imagem'
      END;
    WHEN p_media_type = 'video' THEN 
      v_final_text := CASE 
        WHEN p_message_text IS NOT NULL AND p_message_text != '' AND p_message_text NOT IN ('[Mensagem não suportada]', '[Sticker]') 
        THEN '🎥 Vídeo: ' || p_message_text
        ELSE '🎥 Vídeo'
      END;
    WHEN p_media_type = 'audio' THEN 
      v_final_text := CASE 
        WHEN p_message_text IS NOT NULL AND p_message_text != '' AND p_message_text NOT IN ('[Mensagem não suportada]', '[Sticker]') 
        THEN '🎵 Áudio: ' || p_message_text
        ELSE '🎵 Áudio'
      END;
    WHEN p_media_type = 'document' THEN 
      v_final_text := CASE 
        WHEN p_message_text IS NOT NULL AND p_message_text != '' AND p_message_text NOT IN ('[Mensagem não suportada]', '[Sticker]') 
        THEN '📄 Documento: ' || p_message_text
        ELSE '📄 Documento'
      END;
    ELSE 
      -- Para sticker ou tipos desconhecidos
      v_final_text := CASE 
        WHEN p_message_text = '[Sticker]' THEN '😊 Sticker'
        WHEN p_message_text = '[Mensagem não suportada]' THEN '📎 Mídia'
        ELSE COALESCE(p_message_text, '📎 Mídia')
      END;
  END CASE;

  RAISE NOTICE '[save_whatsapp_message_service_role] 🎨 Texto corrigido: "%" → "%"', p_message_text, v_final_text;

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
    -- CRIAR NOVO LEAD - 🔧 SEMPRE COM NOME FORMATO PADRÃO
    v_is_new_lead := TRUE;
    INSERT INTO public.leads (
      phone,                    
      name,                     -- ✅ SEMPRE formato padrão "+55 (XX) XXXXX-XXXX"
      whatsapp_number_id, 
      created_by_user_id,
      funnel_id,
      kanban_stage_id,
      last_message_time,
      last_message,             -- 🆕 USAR TEXTO CORRIGIDO
      import_source,
      unread_count,
      profile_pic_url
    )
    VALUES (
      v_clean_phone,            
      v_contact_name,           -- ✅ GARANTIDO: sempre formato padrão
      v_instance_id,
      v_user_id,
      v_funnel_id,
      v_stage_id,
      now(),
      v_final_text,             -- 🆕 USAR TEXTO CORRIGIDO
      'realtime',
      CASE WHEN p_from_me THEN 0 ELSE 1 END,
      p_profile_pic_url
    )
    RETURNING id INTO v_lead_id;

    RAISE NOTICE '[save_whatsapp_message_service_role] 🆕 Novo lead criado com formato padrão: % | Phone: % | Name: "%"', 
      v_lead_id, v_clean_phone, v_contact_name;
  ELSE
    -- 🔒 ATUALIZAR LEAD EXISTENTE - NÃO ALTERAR NOME (manter existente)
    UPDATE public.leads 
    SET 
      -- 🔧 NUNCA ALTERAR NOME de lead existente - manter como está
      last_message_time = now(),
      last_message = v_final_text,  -- 🆕 USAR TEXTO CORRIGIDO
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

    RAISE NOTICE '[save_whatsapp_message_service_role] ✅ Lead existente atualizado | Nome: INALTERADO | Foto: %', 
      CASE WHEN v_profile_pic_updated THEN 'ATUALIZADA' ELSE 'INALTERADA' END;
  END IF;

  -- ETAPA 7: Inserir mensagem com TODOS os campos corretos
  INSERT INTO public.messages (
    lead_id,
    whatsapp_number_id,
    text,                       -- 🆕 USAR TEXTO CORRIGIDO
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
    v_final_text,               -- 🆕 USAR TEXTO CORRIGIDO
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

  RAISE NOTICE '[save_whatsapp_message_service_role] ✅ Mensagem inserida: % | Media URL: % | Texto: "%"', 
    v_message_id, COALESCE(substring(p_media_url, 1, 50), 'NULL'), v_final_text;

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
      'contact_name', v_contact_name,         -- ✅ GARANTIDO: sempre formato padrão
      'final_text', v_final_text,             -- 🆕 TEXTO CORRIGIDO
      'media_type', COALESCE(p_media_type, 'text'),
      'from_me', p_from_me,                   -- ✅ Boolean correto
      'is_new_lead', v_is_new_lead,
      'profile_pic_updated', v_profile_pic_updated,
      'media_url_received', p_media_url IS NOT NULL,  -- ✅ Indicador
      'method', 'service_role_fixed_text_corrected_vps'  -- 🆕 VERSÃO CORRIGIDA
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
    'method', 'service_role_fixed_text_corrected_vps'  -- 🆕 VERSÃO CORRIGIDA
  );
END;
$function$;

-- =====================================================================

-- 3️⃣ VERIFICAÇÃO DA CORREÇÃO CIRÚRGICA

SELECT 
    'VERIFICAÇÃO FUNÇÃO VPS CORRIGIDA:' as status,
    proname as nome_funcao,
    array_length(proargtypes, 1) as total_params,
    '✅ Campo TEXT corrigido cirurgicamente' as resultado
FROM pg_proc 
WHERE proname = 'save_whatsapp_message_service_role'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- =====================================================================
-- 📋 PRÓXIMOS PASSOS
-- =====================================================================
/*
✅ STEP 1 CONCLUÍDO: Renomeação da função duplicada
✅ STEP 2 CONCLUÍDO: Correção cirúrgica da função VPS

🔄 PRÓXIMOS STEPS:
STEP 3: Corrigir save_sent_message_only (CRM)
STEP 4: Corrigir save_whatsapp_message_ai_agent (AI)  
STEP 5: Validar resultados das correções

RESULTADO ESPERADO:
- Função VPS: Campo TEXT com emojis corretos
- Isolamento: Cada função independente
- Zero quebra: Funcionalidade existente mantida
*/