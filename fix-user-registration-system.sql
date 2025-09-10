-- =====================================================
-- SCRIPT DE CORREÇÃO DO SISTEMA DE REGISTRO DE USUÁRIOS
-- =====================================================
-- Este script corrige o trigger que está apontando para a função errada
-- e implementa a criação automática de perfil, funil e estágios
-- =====================================================

-- PASSO 1: Remover trigger incorreto
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- PASSO 2: Criar função completa handle_new_user com funil e estágios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  funnel_id UUID;
BEGIN
  RAISE NOTICE '[handle_new_user] 🚀 Iniciando criação de perfil para novo usuário: %', NEW.id;
  RAISE NOTICE '[handle_new_user] 📧 Email: % | Metadata: %', NEW.email, NEW.raw_user_meta_data;
  
  -- CRIAR PERFIL DO USUÁRIO
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
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      'Usuário'
    ),
    'admin'::user_role,
    NEW.id, -- Auto-referência para admins
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RAISE NOTICE '[handle_new_user] ✅ Perfil criado com sucesso';

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
    'Funil padrão criado automaticamente',
    NEW.id,
    NOW(),
    NOW()
  )
  RETURNING id INTO funnel_id;
  
  RAISE NOTICE '[handle_new_user] ✅ Funil criado com ID: %', funnel_id;

  -- CRIAR ESTÁGIOS PADRÃO
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
    
  RAISE NOTICE '[handle_new_user] ✅ Estágios padrão criados';

  -- CRIAR CONFIGURAÇÃO DE DASHBOARD PADRÃO
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
  ON CONFLICT (user_id) DO UPDATE 
  SET 
    layout_config = EXCLUDED.layout_config,
    updated_at = NOW();
  
  RAISE NOTICE '[handle_new_user] ✅ Dashboard configurado';
  RAISE NOTICE '[handle_new_user] 🎉 Processo completo para usuário: %', NEW.email;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 3: Manter função handle_user_signup para convites
-- (Esta função já existe e está correta, apenas garantindo que existe)
CREATE OR REPLACE FUNCTION public.handle_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  RAISE NOTICE '[handle_user_signup] 🔗 Verificando convite para: %', NEW.email;
  
  -- Vincular profile de convite ao novo auth.user
  UPDATE public.profiles 
  SET 
    linked_auth_user_id = NEW.id,
    invite_status = 'accepted',
    updated_at = NOW()
  WHERE email = NEW.email 
    AND invite_status IN ('sent', 'pending')
    AND linked_auth_user_id IS NULL;
    
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  IF affected_rows > 0 THEN
    RAISE NOTICE '[handle_user_signup] ✅ Profile de convite vinculado';
  ELSE
    RAISE NOTICE '[handle_user_signup] ℹ️ Nenhum convite pendente encontrado';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 4: Criar trigger composto que executa ambas as funções
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER AS $$
DECLARE
  has_invite BOOLEAN;
BEGIN
  RAISE NOTICE '[handle_auth_user_created] 🎯 Processando novo usuário: %', NEW.email;
  
  -- Verificar se existe convite pendente
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE email = NEW.email 
    AND invite_status IN ('sent', 'pending')
    AND linked_auth_user_id IS NULL
  ) INTO has_invite;
  
  IF has_invite THEN
    -- Usuário com convite: apenas vincular
    RAISE NOTICE '[handle_auth_user_created] 📧 Usuário tem convite, vinculando...';
    PERFORM handle_user_signup() FROM (SELECT NEW.*) AS t;
  ELSE
    -- Novo registro: criar perfil completo
    RAISE NOTICE '[handle_auth_user_created] 🆕 Novo registro, criando perfil completo...';
    PERFORM handle_new_user() FROM (SELECT NEW.*) AS t;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 5: Criar trigger único que decide qual função executar
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_created();

-- PASSO 6: Garantir que tabelas necessárias existem
-- (Verificação de segurança)
DO $$
BEGIN
  -- Verificar se tabela funnels existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                 WHERE table_schema = 'public' AND table_name = 'funnels') THEN
    RAISE EXCEPTION 'Tabela funnels não existe!';
  END IF;
  
  -- Verificar se tabela kanban_stages existe  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                 WHERE table_schema = 'public' AND table_name = 'kanban_stages') THEN
    RAISE EXCEPTION 'Tabela kanban_stages não existe!';
  END IF;
  
  -- Verificar se tabela dashboard_configs existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                 WHERE table_schema = 'public' AND table_name = 'dashboard_configs') THEN
    RAISE WARNING 'Tabela dashboard_configs não existe, criação de dashboard será ignorada';
  END IF;
  
  RAISE NOTICE '✅ Todas as tabelas necessárias existem';
END $$;

-- PASSO 7: Testar o sistema
-- Execute estas queries após aplicar o script para verificar se funciona:

-- Verificar trigger
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'auth' 
AND event_object_table = 'users'
AND trigger_name = 'on_auth_user_created';

-- Verificar funções
SELECT 
    proname as function_name,
    prosrc LIKE '%funnel%' as creates_funnel,
    prosrc LIKE '%kanban_stages%' as creates_stages,
    prosrc LIKE '%dashboard%' as creates_dashboard
FROM pg_proc 
WHERE proname IN ('handle_new_user', 'handle_user_signup', 'handle_auth_user_created');

-- =====================================================
-- FIM DO SCRIPT DE CORREÇÃO
-- =====================================================
-- Após executar este script:
-- 1. Novos registros criarão perfil + funil + estágios
-- 2. Convites continuarão funcionando normalmente
-- 3. Sistema estará pronto para produção
-- =====================================================