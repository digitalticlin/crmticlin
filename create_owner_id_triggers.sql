-- SISTEMA COMPLETO DE GERENCIAMENTO AUTOMÁTICO DE OWNER_ID
-- Este arquivo implementa triggers para atualizar automaticamente o owner_id dos leads

-- =====================================================================
-- 1. FUNÇÃO MELHORADA: Determinar owner_id com fallback para admin
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_instance_owner_with_fallback(
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
    AND p.created_by_user_id = p_admin_user_id -- Mesmo admin/empresa
  ORDER BY p.created_at ASC -- Se houver múltiplos, pega o mais antigo
  LIMIT 1;

  -- Se não encontrou responsável específico, retorna o admin
  v_owner_id := COALESCE(v_owner_id, p_admin_user_id);
  
  RAISE NOTICE '[get_instance_owner_with_fallback] Instance: % -> Owner: %', p_instance_id, v_owner_id;
  RETURN v_owner_id;
END;
$function$;

-- =====================================================================
-- 2. FUNÇÃO: Atualizar owner_id dos leads quando atribuições mudam
-- =====================================================================
CREATE OR REPLACE FUNCTION public.update_leads_owner_on_instance_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_user_id UUID;
  v_new_owner_id UUID;
  v_affected_leads INTEGER;
BEGIN
  RAISE NOTICE '[update_leads_owner_on_instance_change] 🔄 Trigger executado: %', TG_OP;
  
  -- Para INSERT (nova atribuição)
  IF TG_OP = 'INSERT' THEN
    -- Buscar o admin da instância
    SELECT created_by_user_id INTO v_admin_user_id
    FROM public.whatsapp_instances 
    WHERE id = NEW.whatsapp_number_id;
    
    -- Determinar novo owner
    v_new_owner_id := public.get_instance_owner_with_fallback(NEW.whatsapp_number_id, v_admin_user_id);
    
    -- Atualizar todos os leads desta instância
    UPDATE public.leads 
    SET owner_id = v_new_owner_id,
        updated_at = now()
    WHERE whatsapp_number_id = NEW.whatsapp_number_id
      AND created_by_user_id = v_admin_user_id;
    
    GET DIAGNOSTICS v_affected_leads = ROW_COUNT;
    RAISE NOTICE '[update_leads_owner_on_instance_change] ✅ INSERT: % leads atualizados para owner %', v_affected_leads, v_new_owner_id;
    
    RETURN NEW;
  END IF;
  
  -- Para DELETE (remoção de atribuição)
  IF TG_OP = 'DELETE' THEN
    -- Buscar o admin da instância
    SELECT created_by_user_id INTO v_admin_user_id
    FROM public.whatsapp_instances 
    WHERE id = OLD.whatsapp_number_id;
    
    -- Determinar novo owner (pode voltar para admin se não houver outros)
    v_new_owner_id := public.get_instance_owner_with_fallback(OLD.whatsapp_number_id, v_admin_user_id);
    
    -- Atualizar todos os leads desta instância
    UPDATE public.leads 
    SET owner_id = v_new_owner_id,
        updated_at = now()
    WHERE whatsapp_number_id = OLD.whatsapp_number_id
      AND created_by_user_id = v_admin_user_id;
    
    GET DIAGNOSTICS v_affected_leads = ROW_COUNT;
    RAISE NOTICE '[update_leads_owner_on_instance_change] ✅ DELETE: % leads atualizados para owner %', v_affected_leads, v_new_owner_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$function$;

-- =====================================================================
-- 3. CRIAR TRIGGER na tabela user_whatsapp_numbers
-- =====================================================================
DROP TRIGGER IF EXISTS trigger_update_leads_owner_on_instance_change ON public.user_whatsapp_numbers;

CREATE TRIGGER trigger_update_leads_owner_on_instance_change
  AFTER INSERT OR DELETE ON public.user_whatsapp_numbers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_leads_owner_on_instance_change();

-- =====================================================================
-- 4. ATUALIZAR FUNÇÃO DE CRIAÇÃO DE LEADS (Melhorada)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.save_whatsapp_message_complete_v2(
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
  v_owner_id UUID; -- ✅ Owner correto
  v_formatted_phone TEXT;
  v_contact_name TEXT;
  v_existing_lead_count INTEGER;
BEGIN
  -- Log de início
  RAISE NOTICE '[save_whatsapp_message_complete_v2] 🚀 Iniciando processamento otimizado para: %', p_vps_instance_id;

  -- ETAPA 1: Buscar instância (com RLS ativo)
  SELECT id, created_by_user_id 
  INTO v_instance_id, v_user_id
  FROM public.whatsapp_instances 
  WHERE vps_instance_id = p_vps_instance_id;
  
  IF v_instance_id IS NULL THEN
    RAISE NOTICE '[save_whatsapp_message_complete_v2] ❌ Instância não encontrada: %', p_vps_instance_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Instance not found',
      'vps_instance_id', p_vps_instance_id
    );
  END IF;

  -- ETAPA 2: Determinar responsável pela instância (owner_id) - ✅ MELHORADO
  v_owner_id := public.get_instance_owner_with_fallback(v_instance_id, v_user_id);
  RAISE NOTICE '[save_whatsapp_message_complete_v2] 👤 Owner determinado: % (Fallback para admin: %)', v_owner_id, v_user_id;

  -- ETAPA 3: Formatar telefone brasileiro
  v_formatted_phone := '+55 (' || substring(p_phone, 1, 2) || ') ' ||
                      substring(p_phone, 3, 5) || '-' ||
                      substring(p_phone, 8, 4);

  -- ETAPA 4: Definir nome do contato
  v_contact_name := CASE 
    WHEN p_from_me THEN v_formatted_phone
    ELSE COALESCE(NULLIF(p_contact_name, ''), v_formatted_phone)
  END;

  -- ETAPA 5: Buscar funil padrão do admin
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
    -- Criar novo lead COM owner_id correto - ✅ MELHORADO
    INSERT INTO public.leads (
      phone, 
      name, 
      whatsapp_number_id, 
      created_by_user_id,
      owner_id, -- ✅ SEMPRE com owner correto
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
      v_user_id, -- Admin que criou a empresa
      v_owner_id, -- Membro responsável ou admin como fallback
      v_funnel_id,
      v_stage_id,
      now(),
      p_message_text,
      'realtime',
      CASE WHEN p_from_me THEN 0 ELSE 1 END
    )
    RETURNING id INTO v_lead_id;

    RAISE NOTICE '[save_whatsapp_message_complete_v2] ✅ Novo lead criado: % (admin: % | owner: %)', v_lead_id, v_user_id, v_owner_id;
  ELSE
    -- Atualizar lead existente COM owner_id correto - ✅ MELHORADO
    UPDATE public.leads 
    SET 
      name = CASE 
        WHEN p_from_me THEN name
        ELSE COALESCE(NULLIF(p_contact_name, ''), name)
      END,
      whatsapp_number_id = v_instance_id,
      owner_id = v_owner_id, -- ✅ SEMPRE atualizar owner
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

    RAISE NOTICE '[save_whatsapp_message_complete_v2] ✅ Lead atualizado: % (admin: % | owner: %)', v_lead_id, v_user_id, v_owner_id;
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

  RAISE NOTICE '[save_whatsapp_message_complete_v2] ✅ Mensagem inserida: %', v_message_id;

  -- ETAPA 9: Retornar resultado completo
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'message_id', v_message_id,
      'lead_id', v_lead_id,
      'instance_id', v_instance_id,
      'admin_user_id', v_user_id, -- Admin da empresa
      'owner_id', v_owner_id, -- Responsável pelo lead
      'funnel_id', v_funnel_id,
      'stage_id', v_stage_id,
      'formatted_phone', v_formatted_phone,
      'contact_name', v_contact_name,
      'media_type', COALESCE(p_media_type, 'text'),
      'from_me', p_from_me,
      'method', 'optimized_complete_with_auto_owner_v2'
    )
  );

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[save_whatsapp_message_complete_v2] ❌ ERRO: % - SQLSTATE: %', SQLERRM, SQLSTATE;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE,
    'phone', p_phone,
    'vps_instance_id', p_vps_instance_id,
    'method', 'optimized_complete_with_auto_owner_v2'
  );
END;
$function$;

-- =====================================================================
-- 5. FUNÇÃO UTILITÁRIA: Corrigir owner_id de leads existentes
-- =====================================================================
CREATE OR REPLACE FUNCTION public.fix_existing_leads_owner_id()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total_leads INTEGER := 0;
  v_fixed_leads INTEGER := 0;
  v_instance_record RECORD;
  v_owner_id UUID;
BEGIN
  RAISE NOTICE '[fix_existing_leads_owner_id] 🔧 Iniciando correção de owner_id em leads existentes';

  -- Percorrer todas as instâncias WhatsApp
  FOR v_instance_record IN
    SELECT DISTINCT wi.id as instance_id, wi.created_by_user_id as admin_id
    FROM public.whatsapp_instances wi
  LOOP
    -- Determinar owner correto para esta instância
    v_owner_id := public.get_instance_owner_with_fallback(
      v_instance_record.instance_id, 
      v_instance_record.admin_id
    );
    
    -- Contar leads desta instância
    SELECT COUNT(*) INTO v_total_leads
    FROM public.leads 
    WHERE whatsapp_number_id = v_instance_record.instance_id;
    
    -- Atualizar owner_id dos leads desta instância
    UPDATE public.leads 
    SET owner_id = v_owner_id,
        updated_at = now()
    WHERE whatsapp_number_id = v_instance_record.instance_id
      AND (owner_id IS NULL OR owner_id != v_owner_id);
    
    GET DIAGNOSTICS v_fixed_leads = ROW_COUNT;
    
    RAISE NOTICE '[fix_existing_leads_owner_id] ✅ Instância %: % leads totais, % atualizados para owner %', 
      v_instance_record.instance_id, v_total_leads, v_fixed_leads, v_owner_id;
  END LOOP;

  RAISE NOTICE '[fix_existing_leads_owner_id] 🎉 Correção concluída!';
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Owner ID corrigido para todos os leads existentes',
    'timestamp', now()
  );
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[fix_existing_leads_owner_id] ❌ ERRO: %', SQLERRM;
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;

-- =====================================================================
-- COMENTÁRIOS FINAIS
-- =====================================================================
/*
🎯 SISTEMA IMPLEMENTADO:

1. ✅ Trigger Automático:
   - Quando membro é atribuído/removido de instância
   - Todos os leads daquela instância são automaticamente transferidos
   - Fallback para admin se não houver responsável

2. ✅ Função Melhorada de Criação:
   - Sempre determina owner_id correto na criação
   - Atualiza owner_id em leads existentes
   - Fallback para admin se não houver membro atribuído

3. ✅ Função de Correção:
   - Corrige owner_id de todos os leads existentes
   - Pode ser executada quando necessário

📋 COMO USAR:
1. Execute este arquivo no Supabase
2. Execute: SELECT public.fix_existing_leads_owner_id(); (uma vez só)
3. Teste a criação de membros e atribuição de instâncias

🔄 FLUXO AUTOMÁTICO:
- Lead chega → Verifica quem é responsável pela instância → Atribui owner_id
- Membro é atribuído à instância → Todos leads da instância viram dele
- Membro é removido → Leads voltam para admin ou próximo responsável
*/