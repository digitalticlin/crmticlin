-- Criar trigger específico para processar convites aceitos

CREATE OR REPLACE FUNCTION public.handle_invite_acceptance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  invite_profile_id uuid;
BEGIN
  -- Só processar se for um convite (tem is_invite = 'true' nos metadados)
  IF NEW.raw_user_meta_data ->> 'is_invite' = 'true' THEN
    
    invite_profile_id := (NEW.raw_user_meta_data ->> 'profile_id')::uuid;
    
    IF invite_profile_id IS NOT NULL THEN
      -- Vincular o usuário Auth ao profile existente
      UPDATE public.profiles 
      SET 
        linked_auth_user_id = NEW.id,
        invite_status = 'accepted',
        invite_token = NULL,
        temp_password = NULL
      WHERE id = invite_profile_id;
      
      -- Log para debug
      RAISE NOTICE '[INVITE] Profile % vinculado ao auth user %', invite_profile_id, NEW.id;
      
      -- Verificar se a atualização funcionou
      IF NOT FOUND THEN
        RAISE WARNING '[INVITE] Profile % não encontrado para vincular ao user %', invite_profile_id, NEW.id;
      END IF;
    ELSE
      RAISE WARNING '[INVITE] profile_id não encontrado nos metadados do convite para user %', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger que executa APÓS inserção no auth.users
DROP TRIGGER IF EXISTS on_invite_user_created ON auth.users;

CREATE TRIGGER on_invite_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_user_meta_data ->> 'is_invite' = 'true')  -- Só executa para convites
  EXECUTE FUNCTION public.handle_invite_acceptance();

-- Comentário explicativo
COMMENT ON FUNCTION public.handle_invite_acceptance() IS 'Processa convites aceitos vinculando usuário Auth ao profile existente';
COMMENT ON TRIGGER on_invite_user_created ON auth.users IS 'Trigger específico para processar apenas usuários criados via convite';