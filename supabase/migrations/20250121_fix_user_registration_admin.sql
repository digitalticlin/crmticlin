-- Fix para garantir que usuários criados via /register sejam admin com funil padrão

-- 1. Atualizar função handle_new_user para garantir que funciona corretamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  funnel_id uuid;
  user_role text;
  user_full_name text;
BEGIN
  -- Ignorar usuários criados via convite
  IF NEW.raw_user_meta_data->>'is_invite' = 'true' THEN
    RAISE NOTICE '[handle_new_user] Ignorando usuário de convite: %', NEW.email;
    RETURN NEW;
  END IF;

  RAISE NOTICE '[handle_new_user] Processando novo usuário: %', NEW.email;
  RAISE NOTICE '[handle_new_user] Metadados recebidos: %', NEW.raw_user_meta_data;

  -- Extrair role dos metadados (SEMPRE admin para registro direto)
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  -- Verificar se o perfil já existe
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    RAISE NOTICE '[handle_new_user] Perfil já existe para: %', NEW.email;
    -- Atualizar o role para admin se necessário
    UPDATE public.profiles
    SET
      role = 'admin',
      created_by_user_id = NEW.id -- Admin se auto-referencia
    WHERE id = NEW.id AND role != 'admin';
    RETURN NEW;
  END IF;

  -- Criar perfil para usuário de registro como ADMIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    role,
    username,
    document_id,
    whatsapp,
    created_at,
    updated_at,
    created_by_user_id -- Admin se auto-referencia
  ) VALUES (
    NEW.id,
    user_full_name,
    NEW.email,
    'admin', -- SEMPRE admin para registro direto
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'document_id',
    NEW.raw_user_meta_data->>'whatsapp',
    NOW(),
    NOW(),
    NEW.id -- Admin é o próprio created_by_user_id
  );

  RAISE NOTICE '[handle_new_user] Perfil criado como ADMIN para: %', NEW.email;

  -- Criar funil principal para o admin
  INSERT INTO public.funnels (
    name,
    description,
    created_by_user_id,
    is_default
  ) VALUES (
    'Funil Principal',
    'Funil de vendas padrão criado automaticamente',
    NEW.id,
    true
  ) RETURNING id INTO funnel_id;

  -- Criar estágios padrão
  INSERT INTO public.kanban_stages (funnel_id, name, order_index, color, created_by_user_id) VALUES
    (funnel_id, 'Novo Lead', 1, '#3B82F6', NEW.id),
    (funnel_id, 'Contato Inicial', 2, '#F59E0B', NEW.id),
    (funnel_id, 'Qualificação', 3, '#EF4444', NEW.id),
    (funnel_id, 'Proposta', 4, '#8B5CF6', NEW.id),
    (funnel_id, 'Negociação', 5, '#F97316', NEW.id),
    (funnel_id, 'Fechado', 6, '#10B981', NEW.id);

  -- Criar configurações do dashboard
  INSERT INTO public.dashboard_configs (
    user_id,
    show_products_tutorial,
    show_services_tutorial,
    show_agents_tutorial
  ) VALUES (
    NEW.id,
    true,
    true,
    true
  ) ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE '[handle_new_user] Setup completo para ADMIN: % com funil ID: %', NEW.email, funnel_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '[handle_new_user] ERRO: % - %', SQLERRM, SQLSTATE;
    -- Tentar criar ao menos o perfil básico
    INSERT INTO public.profiles (id, full_name, email, role, created_by_user_id)
    VALUES (NEW.id, user_full_name, NEW.email, 'admin', NEW.id)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- 2. REATIVAR o trigger que foi desabilitado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Verificar se o trigger está ativo
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.triggers
    WHERE trigger_name = 'on_auth_user_created'
    AND event_object_schema = 'auth'
  ) THEN
    RAISE NOTICE '✅ Trigger on_auth_user_created está ATIVO';
  ELSE
    RAISE WARNING '❌ Trigger on_auth_user_created NÃO está ativo!';
  END IF;
END $$;

-- 4. Corrigir usuários existentes que foram criados como operational incorretamente
-- (isso corrige retroativamente usuários que podem ter sido criados com role errado)
UPDATE public.profiles p
SET
  role = 'admin',
  created_by_user_id = p.id
WHERE
  p.role = 'operational'
  AND p.created_by_user_id IS NULL
  AND NOT EXISTS (
    -- Não mudar se foi criado por outro admin (convite)
    SELECT 1 FROM public.profiles admin
    WHERE admin.id = p.created_by_user_id
    AND admin.role = 'admin'
    AND admin.id != p.id
  );

-- 5. Criar funis para admins que não têm funil
DO $$
DECLARE
  admin_record RECORD;
  funnel_id uuid;
BEGIN
  FOR admin_record IN
    SELECT p.id, p.email
    FROM public.profiles p
    WHERE p.role = 'admin'
    AND NOT EXISTS (
      SELECT 1 FROM public.funnels f
      WHERE f.created_by_user_id = p.id
    )
  LOOP
    -- Criar funil para este admin
    INSERT INTO public.funnels (
      name,
      description,
      created_by_user_id,
      is_default
    ) VALUES (
      'Funil Principal',
      'Funil de vendas padrão criado automaticamente',
      admin_record.id,
      true
    ) RETURNING id INTO funnel_id;

    -- Criar estágios padrão
    INSERT INTO public.kanban_stages (funnel_id, name, order_index, color, created_by_user_id) VALUES
      (funnel_id, 'Novo Lead', 1, '#3B82F6', admin_record.id),
      (funnel_id, 'Contato Inicial', 2, '#F59E0B', admin_record.id),
      (funnel_id, 'Qualificação', 3, '#EF4444', admin_record.id),
      (funnel_id, 'Proposta', 4, '#8B5CF6', admin_record.id),
      (funnel_id, 'Negociação', 5, '#F97316', admin_record.id),
      (funnel_id, 'Fechado', 6, '#10B981', admin_record.id);

    RAISE NOTICE 'Funil criado para admin: %', admin_record.email;
  END LOOP;
END $$;

-- Log final
DO $$
BEGIN
  RAISE NOTICE '=== CORREÇÃO APLICADA ===';
  RAISE NOTICE '1. Função handle_new_user atualizada para sempre criar admin com funil';
  RAISE NOTICE '2. Trigger on_auth_user_created REATIVADO';
  RAISE NOTICE '3. Usuários operational incorretos corrigidos para admin';
  RAISE NOTICE '4. Funis criados para admins que não tinham';
  RAISE NOTICE '========================';
END $$;