-- CRIAR ESTRUTURA ISOLADA PARA CONVITES
-- Manter handle_new_user() apenas para /register
-- Criar handle_invite_acceptance() apenas para convites

-- 1. VERIFICAR função handle_invite_acceptance atual (se existir)
SELECT prosrc FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'handle_invite_acceptance' AND n.nspname = 'public';

-- 2. RECRIAR função handle_invite_acceptance focada APENAS em convites
CREATE OR REPLACE FUNCTION public.handle_invite_acceptance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  invite_profile_id uuid;
BEGIN
  -- APENAS processar se for convite (tem is_invite = 'true')
  IF NEW.raw_user_meta_data ->> 'is_invite' = 'true' THEN
    
    invite_profile_id := (NEW.raw_user_meta_data ->> 'profile_id')::uuid;
    
    RAISE NOTICE '[INVITE] Processando convite para profile_id: %', invite_profile_id;
    
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
        RAISE NOTICE '[INVITE] ✅ Profile % vinculado ao auth user %', invite_profile_id, NEW.id;
      ELSE
        RAISE WARNING '[INVITE] ❌ Profile % não encontrado', invite_profile_id;
      END IF;
    ELSE
      RAISE WARNING '[INVITE] ❌ profile_id ausente nos metadados';
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. GARANTIR que trigger on_invite_acceptance existe e está configurado
DROP TRIGGER IF EXISTS on_invite_acceptance ON auth.users;

CREATE TRIGGER on_invite_acceptance
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_user_meta_data ->> 'is_invite' = 'true')  -- SÓ executa para convites
  EXECUTE FUNCTION public.handle_invite_acceptance();

-- 4. VERIFICAR ambos os triggers estão ativos
SELECT 
    trigger_name,
    action_statement,
    action_condition
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- Comentários
COMMENT ON FUNCTION public.handle_invite_acceptance() IS 'Processa APENAS convites aceitos - vincula usuário Auth ao profile existente';
COMMENT ON TRIGGER on_invite_acceptance ON auth.users IS 'Executa APENAS quando is_invite=true - isolado de registros normais';