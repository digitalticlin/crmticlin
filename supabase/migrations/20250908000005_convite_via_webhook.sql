-- ABORDAGEM ALTERNATIVA: Usar Database Webhook para processar convites
-- Já que não podemos criar triggers em auth.users, vamos usar outra estratégia

-- 1. CRIAR função que será chamada manualmente pelo AcceptInvite
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
  profile_exists boolean := false;
  result json;
BEGIN
  RAISE NOTICE '[INVITE] Processando convite aceito: auth_user=%, profile=%', p_auth_user_id, p_profile_id;
  
  -- Verificar se profile existe e está com convite pendente
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_profile_id 
    AND invite_token = p_invite_token 
    AND invite_status IN ('pending', 'invite_sent')
  ) INTO profile_exists;
  
  IF NOT profile_exists THEN
    result := json_build_object(
      'success', false,
      'error', 'Profile não encontrado ou convite inválido'
    );
    RAISE WARNING '[INVITE] ❌ Profile % não encontrado ou convite inválido', p_profile_id;
    RETURN result;
  END IF;
  
  -- Vincular usuário Auth ao profile existente
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
      'auth_user_id', p_auth_user_id
    );
    RAISE NOTICE '[INVITE] ✅ Profile % vinculado ao auth user %', p_profile_id, p_auth_user_id;
  ELSE
    result := json_build_object(
      'success', false,
      'error', 'Erro ao atualizar profile'
    );
    RAISE WARNING '[INVITE] ❌ Erro ao atualizar profile %', p_profile_id;
  END IF;
  
  RETURN result;
END;
$$;

-- 2. CRIAR política RLS para permitir execução dessa função
-- (se necessário, dependendo das políticas existentes)

-- Comentários
COMMENT ON FUNCTION public.process_accepted_invite(uuid, uuid, text) IS 'Processa convite aceito vinculando usuário Auth ao profile existente - chamada manual pelo frontend';

-- 3. TESTAR a função
SELECT public.process_accepted_invite(
  '00000000-0000-0000-0000-000000000000'::uuid,  -- auth_user_id fictício
  '00000000-0000-0000-0000-000000000000'::uuid,  -- profile_id fictício  
  'token-ficticio'                                -- token fictício
) as teste;