
-- FASE 1: CORREÇÃO ESTRUTURAL DE PERMISSÕES
-- Desabilitar completamente RLS em todas as tabelas principais

-- Desabilitar RLS nas tabelas principais
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_instances DISABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas RLS conflitantes da tabela leads
DROP POLICY IF EXISTS "Users can create their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can manage leads in their organization" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view leads in their organization" ON public.leads;
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "service_role_leads_full_access" ON public.leads;
DROP POLICY IF EXISTS "service_role_leads_policy" ON public.leads;

-- Remover TODAS as políticas RLS conflitantes da tabela messages
DROP POLICY IF EXISTS "messages_flexible_delete" ON public.messages;
DROP POLICY IF EXISTS "messages_flexible_select" ON public.messages;
DROP POLICY IF EXISTS "messages_flexible_update" ON public.messages;
DROP POLICY IF EXISTS "messages_liberal_insert" ON public.messages;
DROP POLICY IF EXISTS "service_role_messages_access" ON public.messages;
DROP POLICY IF EXISTS "service_role_messages_full_liberal" ON public.messages;
DROP POLICY IF EXISTS "messages_flexible_insert" ON public.messages;
DROP POLICY IF EXISTS "service_role_messages_full_access" ON public.messages;
DROP POLICY IF EXISTS "service_role_messages_policy" ON public.messages;

-- Remover TODAS as políticas RLS conflitantes da tabela whatsapp_instances
DROP POLICY IF EXISTS "Users can create their own instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can delete their own instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can manage instances in their organization" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can update their own instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can view instances in their organization" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can view their own instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar instâncias" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir instâncias" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Usuários autenticados podem ver instâncias" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "service_role_whatsapp_instances_full_access" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "service_role_whatsapp_instances_policy" ON public.whatsapp_instances;

-- Conceder permissões EXPLÍCITAS para service_role em TODAS as tabelas
GRANT ALL PRIVILEGES ON public.leads TO service_role;
GRANT ALL PRIVILEGES ON public.messages TO service_role;
GRANT ALL PRIVILEGES ON public.whatsapp_instances TO service_role;
GRANT ALL PRIVILEGES ON public.funnels TO service_role;
GRANT ALL PRIVILEGES ON public.kanban_stages TO service_role;

-- Conceder permissões em sequências para IDs
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Conceder permissões de uso do schema
GRANT USAGE ON SCHEMA public TO service_role;

-- FASE 2: FUNÇÃO SQL ULTRA-SIMPLIFICADA
-- Remover funções antigas problemáticas
DROP FUNCTION IF EXISTS public.process_whatsapp_message(text, text, text, boolean, text, text, text, text);
DROP FUNCTION IF EXISTS public.insert_message_only(uuid, text, text, boolean, uuid, text, text, text);
DROP FUNCTION IF EXISTS public.insert_whatsapp_message_safe(text, text, text, boolean, text, text, text, text);

-- Criar função SQL ultra-simplificada e robusta
CREATE OR REPLACE FUNCTION public.save_whatsapp_message_simple(
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
BEGIN
  -- Log de início
  RAISE NOTICE '[save_whatsapp_message_simple] 🚀 Iniciando para instância: %', p_vps_instance_id;

  -- 1. BUSCAR INSTÂNCIA (sem RLS)
  SELECT id, created_by_user_id 
  INTO v_instance_id, v_user_id
  FROM whatsapp_instances 
  WHERE vps_instance_id = p_vps_instance_id;
  
  IF v_instance_id IS NULL THEN
    RAISE NOTICE '[save_whatsapp_message_simple] ❌ Instância não encontrada: %', p_vps_instance_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Instance not found',
      'vps_instance_id', p_vps_instance_id
    );
  END IF;

  RAISE NOTICE '[save_whatsapp_message_simple] ✅ Instância encontrada: % - User: %', v_instance_id, v_user_id;

  -- 2. FORMATAR TELEFONE BRASILEIRO
  v_formatted_phone := CASE
    WHEN p_phone LIKE '+55%' THEN p_phone
    WHEN length(regexp_replace(p_phone, '[^0-9]', '', 'g')) = 13 
         AND p_phone LIKE '55%' THEN
      '+55 (' || substring(regexp_replace(p_phone, '[^0-9]', '', 'g'), 3, 2) || ') ' ||
      substring(regexp_replace(p_phone, '[^0-9]', '', 'g'), 5, 5) || '-' ||
      substring(regexp_replace(p_phone, '[^0-9]', '', 'g'), 10, 4)
    WHEN length(regexp_replace(p_phone, '[^0-9]', '', 'g')) = 11 THEN
      '+55 (' || substring(regexp_replace(p_phone, '[^0-9]', '', 'g'), 1, 2) || ') ' ||
      substring(regexp_replace(p_phone, '[^0-9]', '', 'g'), 3, 5) || '-' ||
      substring(regexp_replace(p_phone, '[^0-9]', '', 'g'), 8, 4)
    ELSE '+55 ' || regexp_replace(p_phone, '[^0-9]', '', 'g')
  END;

  v_formatted_name := 'Contato ' || v_formatted_phone;

  RAISE NOTICE '[save_whatsapp_message_simple] 📞 Telefone formatado: %', left(v_formatted_phone, 8) || '****';

  -- 3. BUSCAR OU CRIAR LEAD (sem RLS)
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

    RAISE NOTICE '[save_whatsapp_message_simple] ✅ Novo lead criado: %', v_lead_id;
  ELSE
    -- Atualizar lead existente
    UPDATE leads 
    SET 
      whatsapp_number_id = v_instance_id,
      last_message_time = now(),
      last_message = p_message_text,
      updated_at = now()
    WHERE id = v_lead_id;

    RAISE NOTICE '[save_whatsapp_message_simple] ✅ Lead atualizado: %', v_lead_id;
  END IF;

  -- 4. SALVAR MENSAGEM (sem RLS)
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

  RAISE NOTICE '[save_whatsapp_message_simple] ✅ Mensagem salva: %', v_message_id;

  -- 5. ATUALIZAR CONTADOR DE NÃO LIDAS
  IF NOT p_from_me THEN
    UPDATE leads 
    SET unread_count = COALESCE(unread_count, 0) + 1
    WHERE id = v_lead_id;
  END IF;

  -- 6. RETORNAR SUCESSO
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'message_id', v_message_id,
      'lead_id', v_lead_id,
      'instance_id', v_instance_id,
      'user_id', v_user_id,
      'formatted_phone', v_formatted_phone,
      'from_me', p_from_me
    )
  );

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[save_whatsapp_message_simple] ❌ ERRO: % - SQLSTATE: %', SQLERRM, SQLSTATE;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE,
    'phone', p_phone,
    'vps_instance_id', p_vps_instance_id
  );
END;
$function$;

-- Log de confirmação
SELECT 'Configuração de permissões e função SQL concluída' as status;
