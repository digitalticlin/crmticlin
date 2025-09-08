-- Criar função para buscar dados do convite pelo confirmation_token

CREATE OR REPLACE FUNCTION get_invite_data_by_token(confirmation_token_param TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY definer
AS $$
DECLARE
  auth_user_record RECORD;
  profile_record RECORD;
  result JSON;
BEGIN
  -- Buscar usuário pelo confirmation_token
  SELECT 
    id, 
    email, 
    raw_user_meta_data,
    email_confirmed_at,
    created_at
  INTO auth_user_record
  FROM auth.users 
  WHERE confirmation_token = confirmation_token_param
  AND email_confirmed_at IS NULL; -- Só usuários não confirmados
  
  -- Se não encontrou usuário
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Token de convite não encontrado ou já foi usado'
    );
  END IF;
  
  -- Buscar profile usando o profile_id dos metadados
  SELECT 
    id,
    full_name,
    email,
    role,
    invite_status,
    created_by_user_id,
    created_at
  INTO profile_record
  FROM public.profiles 
  WHERE id = (auth_user_record.raw_user_meta_data->>'profile_id')::uuid;
  
  -- Se não encontrou profile
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Dados do convite não encontrados'
    );
  END IF;
  
  -- Se convite já foi aceito
  IF profile_record.invite_status = 'accepted' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Este convite já foi aceito',
      'redirect', '/login'
    );
  END IF;
  
  -- Retornar dados do convite
  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'id', profile_record.id,
      'full_name', profile_record.full_name,
      'email', profile_record.email,
      'role', profile_record.role,
      'invite_status', profile_record.invite_status,
      'created_by_user_id', profile_record.created_by_user_id
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Erro interno: ' || SQLERRM
    );
END;
$$;