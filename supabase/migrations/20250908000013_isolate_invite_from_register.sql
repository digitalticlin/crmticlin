-- ISOLAR estrutura de convite da estrutura de registro
-- A função handle_new_user() deve IGNORAR usuários criados via convite

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  funnel_id uuid;
  user_role text;
BEGIN
  -- ✅ CRUCIAL: IGNORAR usuários criados via convite
  IF NEW.raw_user_meta_data->>'is_invite' = 'true' THEN
    RAISE NOTICE '[handle_new_user] 🚫 IGNORANDO usuário de convite: %', NEW.email;
    RETURN NEW;
  END IF;

  RAISE NOTICE '[handle_new_user] 🚀 Processando usuário de REGISTRO: %', NEW.email;
  
  -- Extrair role dos metadados (default: admin para registro)
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');
  
  -- Verificar se o perfil já existe
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    RAISE NOTICE '[handle_new_user] ✅ Perfil já existe para: %', NEW.email;
    RETURN NEW;
  END IF;

  -- Criar perfil para usuário de registro
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    role,
    created_at,
    updated_at,
    created_by_user_id -- Auto-referência para admin
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    user_role,
    NOW(),
    NOW(),
    NEW.id -- Admin se auto-referencia
  );

  RAISE NOTICE '[handle_new_user] ✅ Perfil criado para registro: %', NEW.email;

  -- Apenas para admins: criar estrutura completa (funil, estágios, etc.)
  IF user_role = 'admin' THEN
    -- Criar funil principal
    INSERT INTO public.sales_funnels (
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
    INSERT INTO public.sales_stages (funnel_id, name, order_index, color, created_by_user_id) VALUES
      (funnel_id, 'Novo Lead', 1, '#3B82F6', NEW.id),
      (funnel_id, 'Contato Inicial', 2, '#F59E0B', NEW.id),
      (funnel_id, 'Qualificação', 3, '#EF4444', NEW.id),
      (funnel_id, 'Proposta', 4, '#8B5CF6', NEW.id),
      (funnel_id, 'Negociação', 5, '#F97316', NEW.id),
      (funnel_id, 'Fechado', 6, '#10B981', NEW.id);

    RAISE NOTICE '[handle_new_user] ✅ Funil e estágios criados para admin: %', NEW.email;
  END IF;

  RAISE NOTICE '[handle_new_user] 🎉 Setup completo para registro: %', NEW.email;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '[handle_new_user] ❌ ERRO: % - %', SQLERRM, SQLSTATE;
    RETURN NEW; -- Não falhar o processo de criação do usuário
END;
$$;