
-- Verificar se o trigger existe e está ativo
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.event_object_table,
    t.action_statement,
    t.action_timing
FROM information_schema.triggers t
WHERE t.trigger_name = 'on_auth_user_created'
AND t.event_object_schema = 'auth';

-- Verificar se a função handle_new_user existe
SELECT 
    p.proname,
    p.prosrc
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'handle_new_user'
AND n.nspname = 'public';

-- Criar/recriar o trigger se necessário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  -- Inserir perfil automaticamente quando usuário é criado
  INSERT INTO public.profiles (
    id, 
    full_name, 
    role, 
    created_by_user_id,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email, 'Usuário'),
    'admin'::user_role, 
    NEW.id,  -- O próprio usuário é o created_by_user_id
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$;

-- Recriar o trigger para garantir que está ativo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
