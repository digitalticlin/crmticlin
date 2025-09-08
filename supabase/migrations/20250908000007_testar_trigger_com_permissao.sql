-- TESTAR CRIAÇÃO DE TRIGGER agora que confirmamos permissões

-- 1. Criar função específica para convites (isolada)
CREATE OR REPLACE FUNCTION public.handle_invite_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  invite_profile_id uuid;
BEGIN
  -- APENAS processar se for convite
  IF NEW.raw_user_meta_data ->> 'is_invite' = 'true' THEN
    
    invite_profile_id := (NEW.raw_user_meta_data ->> 'profile_id')::uuid;
    
    RAISE NOTICE '[INVITE_TRIGGER] Processando convite para profile_id: %', invite_profile_id;
    
    IF invite_profile_id IS NOT NULL THEN
      -- Vincular usuário Auth ao profile existente
      UPDATE public.profiles 
      SET 
        linked_auth_user_id = NEW.id,
        invite_status = 'accepted',
        invite_token = NULL,
        temp_password = NULL
      WHERE id = invite_profile_id;
      
      IF FOUND THEN
        RAISE NOTICE '[INVITE_TRIGGER] ✅ Profile % vinculado ao auth user %', invite_profile_id, NEW.id;
      ELSE
        RAISE WARNING '[INVITE_TRIGGER] ❌ Profile % não encontrado', invite_profile_id;
      END IF;
    ELSE
      RAISE WARNING '[INVITE_TRIGGER] ❌ profile_id ausente nos metadados';
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. TENTAR criar trigger específico para convites
DROP TRIGGER IF EXISTS trigger_invite_acceptance ON auth.users;

CREATE TRIGGER trigger_invite_acceptance
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_user_meta_data ->> 'is_invite' = 'true')
  EXECUTE FUNCTION public.handle_invite_only();

-- 3. Verificar se funcionou
SELECT 
    trigger_name,
    action_statement,
    action_condition
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users'
  AND trigger_name = 'trigger_invite_acceptance';

-- Comentários
COMMENT ON FUNCTION public.handle_invite_only() IS 'Função EXCLUSIVA para processar convites via trigger - isolada da handle_new_user';
COMMENT ON TRIGGER trigger_invite_acceptance ON auth.users IS 'Trigger EXCLUSIVO para convites - executa apenas quando is_invite=true';