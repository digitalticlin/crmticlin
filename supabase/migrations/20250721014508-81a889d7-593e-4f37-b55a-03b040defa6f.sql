
-- FASE 1: REATIVAR RLS NAS TABELAS CRÍTICAS
-- Reativar RLS em leads, messages e whatsapp_instances

-- 1. REATIVAR RLS na tabela leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 2. REATIVAR RLS na tabela messages  
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 3. REATIVAR RLS na tabela whatsapp_instances
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- FASE 2: CRIAR POLÍTICAS DUAIS PADRONIZADAS

-- POLÍTICAS PARA TABELA LEADS
-- Política para service_role (acesso total para webhooks)
CREATE POLICY "service_role_leads_access" ON public.leads
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Política para usuários autenticados (isolamento por created_by_user_id)
CREATE POLICY "authenticated_users_leads_access" ON public.leads
  FOR ALL TO authenticated
  USING (created_by_user_id = auth.uid())
  WITH CHECK (created_by_user_id = auth.uid());

-- POLÍTICAS PARA TABELA MESSAGES
-- Política para service_role (acesso total para webhooks)
CREATE POLICY "service_role_messages_access" ON public.messages
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Política para usuários autenticados (isolamento por created_by_user_id)
CREATE POLICY "authenticated_users_messages_access" ON public.messages
  FOR ALL TO authenticated
  USING (created_by_user_id = auth.uid())
  WITH CHECK (created_by_user_id = auth.uid());

-- POLÍTICAS PARA TABELA WHATSAPP_INSTANCES
-- Política para service_role (acesso total para webhooks)
CREATE POLICY "service_role_whatsapp_instances_access" ON public.whatsapp_instances
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Política para usuários autenticados (isolamento por created_by_user_id)
CREATE POLICY "authenticated_users_whatsapp_instances_access" ON public.whatsapp_instances
  FOR ALL TO authenticated
  USING (created_by_user_id = auth.uid())
  WITH CHECK (created_by_user_id = auth.uid());

-- FASE 3: LIMPEZA DE POLÍTICAS REDUNDANTES EM OUTRAS TABELAS

-- Limpar políticas duplicadas em funnels (manter apenas as essenciais)
DROP POLICY IF EXISTS "Enable delete for own funnels" ON public.funnels;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.funnels;
DROP POLICY IF EXISTS "Enable read access for own funnels" ON public.funnels;
DROP POLICY IF EXISTS "Enable update for own funnels" ON public.funnels;

-- Recriar políticas padronizadas para funnels
CREATE POLICY "authenticated_users_funnels_access" ON public.funnels
  FOR ALL TO authenticated
  USING (created_by_user_id = auth.uid())
  WITH CHECK (created_by_user_id = auth.uid());

-- Limpar políticas duplicadas em kanban_stages
DROP POLICY IF EXISTS "Enable delete for funnel stages" ON public.kanban_stages;
DROP POLICY IF EXISTS "Enable insert for funnel stages" ON public.kanban_stages;
DROP POLICY IF EXISTS "Enable read access for funnel stages" ON public.kanban_stages;
DROP POLICY IF EXISTS "Enable update for funnel stages" ON public.kanban_stages;

-- Recriar políticas padronizadas para kanban_stages
CREATE POLICY "authenticated_users_kanban_stages_access" ON public.kanban_stages
  FOR ALL TO authenticated
  USING (created_by_user_id = auth.uid())
  WITH CHECK (created_by_user_id = auth.uid());

-- FASE 4: CORREÇÃO DAS FUNÇÕES - ADICIONAR SEARCH_PATH

-- Atualizar função save_whatsapp_message_simple com search_path correto
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
SET search_path TO 'public'
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
  RAISE NOTICE '[save_whatsapp_message_simple] 🚀 Iniciando COM RLS ATIVO para instância: %', p_vps_instance_id;

  -- 1. BUSCAR INSTÂNCIA (com RLS ativo)
  SELECT id, created_by_user_id 
  INTO v_instance_id, v_user_id
  FROM public.whatsapp_instances 
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

  -- 3. BUSCAR OU CRIAR LEAD (com RLS ativo)
  SELECT id INTO v_lead_id
  FROM public.leads 
  WHERE phone = v_formatted_phone 
    AND created_by_user_id = v_user_id;

  IF v_lead_id IS NULL THEN
    -- Criar novo lead
    INSERT INTO public.leads (
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
    UPDATE public.leads 
    SET 
      whatsapp_number_id = v_instance_id,
      last_message_time = now(),
      last_message = p_message_text,
      updated_at = now()
    WHERE id = v_lead_id;

    RAISE NOTICE '[save_whatsapp_message_simple] ✅ Lead atualizado: %', v_lead_id;
  END IF;

  -- 4. SALVAR MENSAGEM (com RLS ativo)
  INSERT INTO public.messages (
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
    UPDATE public.leads 
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
      'from_me', p_from_me,
      'rls_status', 'active'
    )
  );

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[save_whatsapp_message_simple] ❌ ERRO COM RLS ATIVO: % - SQLSTATE: %', SQLERRM, SQLSTATE;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE,
    'phone', p_phone,
    'vps_instance_id', p_vps_instance_id,
    'rls_status', 'active'
  );
END;
$function$;

-- VERIFICAÇÃO FINAL: Confirmar que todas as tabelas têm RLS ativo
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('leads', 'messages', 'whatsapp_instances', 'funnels', 'kanban_stages')
ORDER BY tablename;

-- Log de confirmação
SELECT 'RLS REATIVADO COM SUCESSO - Políticas duais implementadas para multi-tenancy seguro' as status;
