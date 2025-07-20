
-- CRIAR FUNÇÃO SQL ESPECÍFICA PARA INSERÇÃO DE MENSAGENS
-- Esta função será usada como estratégia de fallback

CREATE OR REPLACE FUNCTION public.insert_message_safe(
  p_lead_id uuid,
  p_instance_id uuid,
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
SET search_path = 'public'
AS $function$
DECLARE
  v_message_id UUID;
  v_current_schema TEXT;
  v_search_path TEXT;
  v_messages_table_exists BOOLEAN;
BEGIN
  -- DIAGNÓSTICOS DE CONTEXTO
  SELECT current_schema() INTO v_current_schema;
  SHOW search_path INTO v_search_path;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'messages'
  ) INTO v_messages_table_exists;
  
  RAISE NOTICE '[MESSAGE SQL] Schema: %, Path: %, Messages exists: %', 
    v_current_schema, v_search_path, v_messages_table_exists;

  -- TENTAR INSERIR MENSAGEM
  BEGIN
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
      p_lead_id,
      p_instance_id,
      p_message_text,
      p_from_me,
      now(),
      CASE WHEN p_from_me THEN 'sent'::message_status ELSE 'received'::message_status END,
      p_user_id,
      p_media_type::media_type,
      p_media_url,
      'realtime',
      p_external_message_id
    )
    RETURNING id INTO v_message_id;

    RAISE NOTICE '[MESSAGE SQL] ✅ Mensagem inserida com sucesso: %', v_message_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'message_id', v_message_id,
      'method', 'sql_function'
    );
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[MESSAGE SQL] ❌ ERRO: % - SQLSTATE: %', SQLERRM, SQLSTATE;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE,
      'method', 'sql_function',
      'diagnostics', jsonb_build_object(
        'current_schema', v_current_schema,
        'search_path', v_search_path,
        'messages_table_exists', v_messages_table_exists
      )
    );
  END;
END;
$function$;
