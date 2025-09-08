-- VERSÃO MELHORADA da função com mais debug

CREATE OR REPLACE FUNCTION public.process_accepted_invite(
  p_auth_user_id uuid,
  p_profile_id uuid,
  p_invite_token text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  profile_record RECORD;
  result json;
BEGIN
  RAISE NOTICE '[INVITE] === INÍCIO DEBUG ===';
  RAISE NOTICE '[INVITE] auth_user_id: %', p_auth_user_id;
  RAISE NOTICE '[INVITE] profile_id: %', p_profile_id;
  RAISE NOTICE '[INVITE] invite_token: %', p_invite_token;
  
  -- Buscar profile com mais detalhes para debug
  SELECT 
    id, 
    full_name, 
    email, 
    invite_token, 
    invite_status,
    pg_typeof(invite_token) as token_type
  INTO profile_record
  FROM public.profiles 
  WHERE id = p_profile_id;
  
  IF NOT FOUND THEN
    result := json_build_object(
      'success', false,
      'error', 'Profile não encontrado com ID: ' || p_profile_id
    );
    RAISE WARNING '[INVITE] ❌ Profile % não encontrado', p_profile_id;
    RETURN result;
  END IF;
  
  RAISE NOTICE '[INVITE] Profile encontrado: %, token_db: %, status: %, tipo: %', 
    profile_record.full_name, profile_record.invite_token, profile_record.invite_status, profile_record.token_type;
  
  -- Verificar se token confere (tentando ambos os tipos)
  IF profile_record.invite_token::text != p_invite_token THEN
    result := json_build_object(
      'success', false,
      'error', 'Token inválido. Esperado: ' || profile_record.invite_token::text || ', Recebido: ' || p_invite_token,
      'debug', json_build_object(
        'profile_token', profile_record.invite_token,
        'received_token', p_invite_token,
        'status', profile_record.invite_status
      )
    );
    RAISE WARNING '[INVITE] ❌ Token não confere. DB: %, Recebido: %', profile_record.invite_token::text, p_invite_token;
    RETURN result;
  END IF;
  
  -- Verificar status
  IF profile_record.invite_status NOT IN ('pending', 'invite_sent') THEN
    result := json_build_object(
      'success', false,
      'error', 'Status inválido: ' || profile_record.invite_status || '. Esperado: pending ou invite_sent'
    );
    RAISE WARNING '[INVITE] ❌ Status inválido: %', profile_record.invite_status;
    RETURN result;
  END IF;
  
  -- Tudo OK - fazer update
  RAISE NOTICE '[INVITE] ✅ Validações OK, fazendo update...';
  
  UPDATE public.profiles 
  SET 
    linked_auth_user_id = p_auth_user_id,
    invite_status = 'accepted',
    invite_token = NULL,
    temp_password = NULL
  WHERE id = p_profile_id;
  
  IF FOUND THEN
    result := json_build_object(
      'success', true,
      'message', 'Profile vinculado com sucesso',
      'profile_id', p_profile_id,
      'auth_user_id', p_auth_user_id,
      'user_name', profile_record.full_name
    );
    RAISE NOTICE '[INVITE] ✅ Profile % vinculado ao auth user %', p_profile_id, p_auth_user_id;
  ELSE
    result := json_build_object(
      'success', false,
      'error', 'Erro inesperado no UPDATE'
    );
    RAISE WARNING '[INVITE] ❌ UPDATE falhou inexplicavelmente';
  END IF;
  
  RAISE NOTICE '[INVITE] === FIM DEBUG ===';
  RETURN result;
END;
$$;