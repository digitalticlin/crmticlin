-- SQL para verificar se a trigger handle_new_user já tem a verificação is_invite
SELECT 
    proname as "Nome da Função",
    prosrc as "Código da Função"
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Se ainda não foi atualizada, execute este comando para atualizar:
/*
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer SET search_path = public
AS $$
DECLARE
  funnel_id UUID;
  profile_exists BOOLEAN;
BEGIN
  -- VERIFICAÇÃO DE CONVITE: Se é convite, deixar para trigger específico
  IF NEW.raw_user_meta_data->>'is_invite' = 'true' THEN
    RAISE NOTICE '[handle_new_user] É convite (is_invite=true), deixando para trigger específico';
    RETURN NEW;
  END IF;
  
  -- Log de início
  RAISE NOTICE '[handle_new_user] ========================================';
  RAISE NOTICE '[handle_new_user] NOVO USUARIO REGISTRADO (NÃO É CONVITE)';
  RAISE NOTICE '[handle_new_user] Email: %', NEW.email;
  RAISE NOTICE '[handle_new_user] ID: %', NEW.id;
  
  -- Verificar se já existe perfil (segurança)
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = NEW.id
  ) INTO profile_exists;
  
  IF profile_exists THEN
    RAISE NOTICE '[handle_new_user] Perfil ja existe, pulando criacao';
    RETURN NEW;
  END IF;
  
  -- CRIAR PERFIL COMO ADMIN (temporariamente sem created_by)
  INSERT INTO public.profiles (
    id, 
    full_name, 
    role, 
    created_by_user_id, -- Agora aponta para si mesmo
    email,
    linked_auth_user_id,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id, 
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      'Usuário'
    ),
    'admin'::user_role,
    NEW.id, -- Auto-referência: admin aponta para si mesmo
    NEW.email,
    NEW.id,
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '[handle_new_user] Perfil ADMIN criado com auto-referencia';

  -- CRIAR FUNIL PADRÃO
  INSERT INTO public.funnels (
    name, 
    description, 
    created_by_user_id,
    created_at,
    updated_at
  )
  VALUES (
    'Funil Principal',
    'Funil padrão criado automaticamente no registro',
    NEW.id,
    NOW(),
    NOW()
  )
  RETURNING id INTO funnel_id;
  
  RAISE NOTICE '[handle_new_user] Funil Principal criado - ID: %', funnel_id;

  -- CRIAR 6 ESTÁGIOS PADRÃO
  INSERT INTO public.kanban_stages (
    title, 
    color, 
    order_position, 
    funnel_id, 
    created_by_user_id, 
    is_fixed, 
    is_won, 
    is_lost,
    created_at,
    updated_at
  ) 
  VALUES
    ('Entrada de Leads', '#3b82f6', 1, funnel_id, NEW.id, true, false, false, NOW(), NOW()),
    ('Em atendimento', '#8b5cf6', 2, funnel_id, NEW.id, false, false, false, NOW(), NOW()),
    ('Em negociação', '#f59e0b', 3, funnel_id, NEW.id, false, false, false, NOW(), NOW()),
    ('Proposta Enviada', '#10b981', 4, funnel_id, NEW.id, false, false, false, NOW(), NOW()),
    ('GANHO', '#059669', 5, funnel_id, NEW.id, true, true, false, NOW(), NOW()),
    ('PERDIDO', '#6b7280', 6, funnel_id, NEW.id, true, false, true, NOW(), NOW());
    
  RAISE NOTICE '[handle_new_user] 6 estagios padrao criados';

  -- CRIAR CONFIGURAÇÃO DE DASHBOARD (se tabela existir)
  BEGIN
    INSERT INTO public.dashboard_configs (
      user_id,
      created_by_user_id,
      layout_config,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.id,
      jsonb_build_object(
        'widgets', jsonb_build_array(
          jsonb_build_object('id', 'welcome', 'type', 'welcome', 'visible', true, 'order', 0),
          jsonb_build_object('id', 'stats', 'type', 'stats', 'visible', true, 'order', 1),
          jsonb_build_object('id', 'funnel', 'type', 'funnel', 'visible', true, 'order', 2),
          jsonb_build_object('id', 'recent', 'type', 'recent', 'visible', true, 'order', 3)
        ),
        'columns', 2,
        'theme', 'light'
      ),
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE '[handle_new_user] Dashboard configurado';
  EXCEPTION
    WHEN undefined_table THEN
      RAISE NOTICE '[handle_new_user] Tabela dashboard_configs nao existe, pulando';
    WHEN OTHERS THEN
      RAISE NOTICE '[handle_new_user] Erro ao criar dashboard: %', SQLERRM;
  END;

  RAISE NOTICE '[handle_new_user] ========================================';
  RAISE NOTICE '[handle_new_user] SETUP COMPLETO PARA ADMIN: %', NEW.email;
  RAISE NOTICE '[handle_new_user] ========================================';

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '[handle_new_user] ERRO CRITICO: %', SQLERRM;
    RAISE NOTICE '[handle_new_user] DETALHES: %', SQLSTATE;
    RAISE;
END;
$$;
*/