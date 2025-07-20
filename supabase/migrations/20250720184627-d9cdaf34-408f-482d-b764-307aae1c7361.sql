
-- FASE 1: CORREÇÃO CRÍTICA DE PERMISSÕES PARA SERVICE_ROLE
-- Conceder todas as permissões necessárias para service_role

-- Conceder permissões completas para service_role nas tabelas principais
GRANT ALL ON public.leads TO service_role;
GRANT ALL ON public.messages TO service_role;
GRANT ALL ON public.whatsapp_instances TO service_role;
GRANT ALL ON public.funnels TO service_role;
GRANT ALL ON public.kanban_stages TO service_role;

-- Conceder permissões em sequências (para IDs)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- FASE 2: FUNÇÃO SQL ALTERNATIVA SIMPLIFICADA (PLANO B)
-- Criar função que apenas insere mensagem sem manipular leads
CREATE OR REPLACE FUNCTION public.insert_message_only(
  p_instance_id uuid,
  p_phone text,
  p_message_text text,
  p_from_me boolean,
  p_user_id uuid,
  p_media_type text DEFAULT 'text',
  p_media_url text DEFAULT NULL,
  p_external_message_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_message_id UUID;
BEGIN
  RAISE NOTICE '[insert_message_only] 💬 Inserindo mensagem diretamente';

  -- Inserir mensagem diretamente sem manipular leads
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
    NULL, -- lead_id será NULL temporariamente
    p_instance_id,
    p_message_text,
    p_from_me,
    now(),
    CASE WHEN p_from_me THEN 'sent'::message_status ELSE 'received'::message_status END,
    p_user_id,
    COALESCE(p_media_type::media_type, 'text'::media_type),
    p_media_url,
    'realtime',
    p_external_message_id
  )
  RETURNING id INTO v_message_id;

  RAISE NOTICE '[insert_message_only] ✅ Mensagem inserida com sucesso: %', v_message_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message_id', v_message_id,
    'method', 'simplified_insert',
    'lead_id', NULL,
    'phone', p_phone
  );
    
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[insert_message_only] ❌ ERRO: % - SQLSTATE: %', SQLERRM, SQLSTATE;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE,
    'method', 'simplified_insert'
  );
END;
$function$;

-- FASE 3: FUNÇÃO DE DIAGNÓSTICO PARA VERIFICAR PERMISSÕES
CREATE OR REPLACE FUNCTION public.diagnose_permissions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_current_user TEXT;
  v_current_role TEXT;
  v_tables_info JSONB;
BEGIN
  -- Obter informações do usuário atual
  SELECT current_user INTO v_current_user;
  SELECT current_role INTO v_current_role;
  
  -- Verificar quais tabelas existem e suas permissões
  SELECT jsonb_agg(
    jsonb_build_object(
      'table_name', table_name,
      'table_schema', table_schema,
      'table_type', table_type
    )
  ) INTO v_tables_info
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('leads', 'messages', 'whatsapp_instances');
  
  RETURN jsonb_build_object(
    'current_user', v_current_user,
    'current_role', v_current_role,
    'tables', v_tables_info,
    'timestamp', now()
  );
END;
$function$;
