-- SIMPLIFICAR função removendo conversões UUID/TEXT desnecessárias
-- Frontend já envia string UUID válida, PostgreSQL converte automaticamente

CREATE OR REPLACE FUNCTION public.process_accepted_invite(
  p_auth_user_id uuid,
  p_profile_id uuid,
  p_invite_token text -- Frontend envia string, PostgreSQL converte automaticamente
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  profile_record RECORD;
  result json;
BEGIN
  RAISE NOTICE '[INVITE] Processando convite: profile=%, token=%', p_profile_id, p_invite_token;
  
  -- Buscar profile - PostgreSQL faz conversão automática de string para UUID
  SELECT 
    id, 
    full_name, 
    email, 
    invite_status,
    linked_auth_user_id
  INTO profile_record
  FROM public.profiles 
  WHERE id = p_profile_id 
    AND invite_token = p_invite_token  -- Conversão automática string → UUID
    AND invite_status IN ('pending', 'invite_sent', 'accepted'); -- Aceitar 'accepted' também
  
  IF NOT FOUND THEN
    -- Debug: buscar profile só pelo ID para ver o que tem
    SELECT invite_token, invite_status INTO profile_record
    FROM public.profiles WHERE id = p_profile_id;
    
    result := json_build_object(
      'success', false,
      'error', 'Token ou status inválido',
      'debug', json_build_object(
        'profile_id', p_profile_id,
        'received_token', p_invite_token,
        'db_token', profile_record.invite_token,
        'db_status', profile_record.invite_status
      )
    );
    RETURN result;
  END IF;
  
  -- Se já vinculado a outro usuário, erro
  IF profile_record.linked_auth_user_id IS NOT NULL 
     AND profile_record.linked_auth_user_id != p_auth_user_id THEN
    result := json_build_object(
      'success', false, 
      'error', 'Profile já vinculado a outro usuário'
    );
    RETURN result;
  END IF;
  
  -- Vincular usuário ao profile
  UPDATE public.profiles 
  SET 
    linked_auth_user_id = p_auth_user_id,
    invite_status = 'accepted',
    invite_token = NULL -- Limpar token usado
  WHERE id = p_profile_id;
  
  result := json_build_object(
    'success', true,
    'message', 'Profile vinculado com sucesso',
    'user_name', profile_record.full_name
  );
  
  RAISE NOTICE '[INVITE] ✅ Sucesso: % vinculado', profile_record.full_name;
  RETURN result;
END;
$$;

-- Comentário
COMMENT ON FUNCTION public.process_accepted_invite(uuid, uuid, text) 
IS 'Versão simplificada - PostgreSQL converte string UUID automaticamente';