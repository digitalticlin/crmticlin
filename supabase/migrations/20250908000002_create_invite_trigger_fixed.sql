-- LIMPAR TRIGGERS EXISTENTES PRIMEIRO
-- Verificar triggers existentes na tabela auth.users
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- Remover triggers antigos se existirem (alguns podem não existir, ignore erros)
DROP TRIGGER IF EXISTS on_invite_user_created ON auth.users;
DROP TRIGGER IF EXISTS process_invite_on_signup ON auth.users;

-- Remover função antiga se existir
DROP FUNCTION IF EXISTS public.handle_invite_acceptance();

-- ABORDAGEM ALTERNATIVA: Modificar o trigger existente handle_new_user
-- para detectar e processar convites

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  existing_profile_id uuid;
  invite_profile_id uuid;
  is_invite_signup boolean;
BEGIN
  -- Verificar se é um convite
  is_invite_signup := (NEW.raw_user_meta_data ->> 'is_invite' = 'true');
  
  IF is_invite_signup THEN
    -- CASO CONVITE: Vincular ao profile existente
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
      
      -- Verificar se funcionou
      IF NOT FOUND THEN
        RAISE WARNING '[INVITE] Profile % não encontrado para user %', invite_profile_id, NEW.id;
      END IF;
    ELSE
      RAISE WARNING '[INVITE] profile_id ausente nos metadados para user %', NEW.id;
    END IF;
    
  ELSE
    -- CASO NORMAL: Criar novo profile para admin
    -- Verificar se já existe profile com esse ID
    SELECT id INTO existing_profile_id 
    FROM public.profiles 
    WHERE id = NEW.id;
    
    IF existing_profile_id IS NULL THEN
      INSERT INTO public.profiles (
        id, 
        full_name, 
        role, 
        created_by_user_id,
        linked_auth_user_id,
        invite_status,
        created_at,
        updated_at
      )
      VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email, 'Usuário'),
        'admin'::user_role, 
        NEW.id,
        NEW.id,
        'active',
        NOW(),
        NOW()
      );
      
      RAISE NOTICE '[REGISTER] Novo admin criado: %', NEW.id;
    ELSE
      RAISE NOTICE '[REGISTER] Profile % já existe', existing_profile_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- O trigger on_auth_user_created já deve existir, então não precisamos recriar
-- Apenas garantir que a função foi atualizada

-- Verificar se trigger existe
SELECT 
    trigger_name,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created' 
  AND event_object_schema = 'auth';