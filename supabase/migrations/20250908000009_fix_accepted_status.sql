-- CORRIGIR função para aceitar status 'accepted' também
-- Caso: usuário foi criado mas vinculação falhou

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
  RAISE NOTICE '[INVITE] Processando: auth_user=%, profile=%, token=%', p_auth_user_id, p_profile_id, p_invite_token;
  
  -- Buscar profile pelo ID (mais seguro que pelo token)
  SELECT 
    id, 
    full_name, 
    email, 
    invite_token, 
    invite_status,
    linked_auth_user_id
  INTO profile_record
  FROM public.profiles 
  WHERE id = p_profile_id;
  
  IF NOT FOUND THEN
    result := json_build_object('success', false, 'error', 'Profile não encontrado');
    RETURN result;
  END IF;
  
  RAISE NOTICE '[INVITE] Profile: %, status: %, linked: %', 
    profile_record.full_name, profile_record.invite_status, profile_record.linked_auth_user_id;
  
  -- ACEITAR também status 'accepted' se não estiver vinculado ainda
  IF profile_record.invite_status NOT IN ('pending', 'invite_sent', 'accepted') THEN
    result := json_build_object('success', false, 'error', 'Status inválido: ' || profile_record.invite_status);
    RETURN result;
  END IF;
  
  -- Se já está vinculado a outro usuário, erro
  IF profile_record.linked_auth_user_id IS NOT NULL AND profile_record.linked_auth_user_id != p_auth_user_id THEN
    result := json_build_object('success', false, 'error', 'Profile já vinculado a outro usuário');
    RETURN result;
  END IF;
  
  -- Fazer vinculação (ou re-vinculação)
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
    result := json_build_object('success', false, 'error', 'Erro no UPDATE');
  END IF;
  
  RETURN result;
END;
$$;

-- RESETAR o status deste profile específico para testar
UPDATE profiles 
SET 
    invite_status = 'invite_sent',
    linked_auth_user_id = NULL,
    invite_token = '0612826f-d353-4156-8189-d7c4d5b95f73'
WHERE id = 'eb5f9314-edaa-44c5-859e-a76fd3fb3672';

-- Verificar se resetou
SELECT id, full_name, invite_status, linked_auth_user_id 
FROM profiles 
WHERE id = 'eb5f9314-edaa-44c5-859e-a76fd3fb3672';