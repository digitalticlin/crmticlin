-- =========================================================
-- PASSO 1: ATIVAR REGISTRO DE NOVO USUÁRIO (ADMIN)
-- =========================================================
-- Este script ativa o fluxo: 
-- /register → Email confirmação → Login como ADMIN → Funil criado
-- =========================================================

-- 1️⃣ REMOVER TRIGGER INCORRETO
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2️⃣ CRIAR/ATUALIZAR FUNÇÃO handle_new_user COM FUNIL E ESTÁGIOS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  funnel_id UUID;
  profile_exists BOOLEAN;
BEGIN
  -- Log de início
  RAISE NOTICE '[handle_new_user] ========================================';
  RAISE NOTICE '[handle_new_user] NOVO USUARIO REGISTRADO';
  RAISE NOTICE '[handle_new_user] Email: %', NEW.email;
  RAISE NOTICE '[handle_new_user] ID: %', NEW.id;
  RAISE NOTICE '[handle_new_user] Metadata: %', NEW.raw_user_meta_data;
  
  -- Verificar se já existe perfil (segurança)
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = NEW.id
  ) INTO profile_exists;
  
  IF profile_exists THEN
    RAISE NOTICE '[handle_new_user] Perfil ja existe, pulando criacao';
    RETURN NEW;
  END IF;
  
  -- CRIAR PERFIL COMO ADMIN (auto-referência)
  INSERT INTO public.profiles (
    id, 
    full_name, 
    role, 
    created_by_user_id, -- Auto-referência para admin
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
    'admin'::user_role, -- SEMPRE admin para novo registro
    NEW.id, -- Auto-referência: admin é criado por si mesmo
    NEW.email,
    NEW.id, -- linked_auth_user_id = próprio ID
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3️⃣ CRIAR TRIGGER PARA NOVOS REGISTROS
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- FLUXO 1 ATIVADO: Registro de novo usuário admin

-- =========================================================
-- VERIFICAÇÃO DO FLUXO 1
-- =========================================================

-- Verificar se trigger foi criado corretamente
SELECT 
    'TRIGGER CRIADO' as status,
    trigger_name,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'auth' 
AND event_object_table = 'users'
AND trigger_name = 'on_auth_user_created';

-- Verificar se função está completa
SELECT 
    'FUNÇÃO ATUALIZADA' as status,
    proname as function_name,
    prosrc LIKE '%Funil Principal%' as cria_funil,
    prosrc LIKE '%kanban_stages%' as cria_estagios,
    prosrc LIKE '%admin::user_role%' as define_como_admin
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- =========================================================
-- TESTE DO FLUXO 1
-- =========================================================
-- Após executar este script:
-- 1. Acesse /register
-- 2. Crie uma conta nova
-- 3. Confirme o email
-- 4. Verifique se foi criado:
--    - Perfil como ADMIN
--    - Funil Principal
--    - 6 estágios
-- =========================================================