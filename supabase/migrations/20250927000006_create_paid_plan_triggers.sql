-- ============================================
-- MIGRATION: Triggers específicos para PLANOS PAGOS
-- Data: 2025-09-27
-- ============================================

-- ============================================
-- PARTE 1: Separar criação de profile por tipo de plano
-- ============================================

-- Atualizar função handle_new_user para identificar plano pago vs gratuito
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_invite BOOLEAN;
  v_full_name TEXT;
  v_username TEXT;
  v_document_id TEXT;
  v_whatsapp TEXT;
  v_role user_role;
  v_selected_plan TEXT;
  funnel_id UUID;
BEGIN
  -- Verificar se é convite (se tiver invite_token = é convite)
  v_is_invite := (NEW.raw_user_meta_data->>'invite_token') IS NOT NULL;

  IF v_is_invite THEN
    RAISE NOTICE '[handle_new_user] 🚫 IGNORANDO usuário de convite: %', NEW.email;
    RETURN NEW;
  END IF;

  v_selected_plan := COALESCE(NEW.raw_user_meta_data->>'selected_plan', 'free_200');

  -- Identificar tipo de plano no log
  IF v_selected_plan = 'free_200' THEN
    RAISE NOTICE '[handle_new_user] 🆓 PLANO GRATUITO - Processando usuário: %', NEW.email;
  ELSE
    RAISE NOTICE '[handle_new_user] 💳 PLANO PAGO (%) - Processando usuário: %', v_selected_plan, NEW.email;
  END IF;

  -- Verificar se perfil já existe
  IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
    RAISE NOTICE '[handle_new_user] ✅ Perfil já existe para: %', NEW.email;
    RETURN NEW;
  END IF;

  -- Extrair dados do metadata
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário');
  v_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  v_document_id := NEW.raw_user_meta_data->>'document_id';
  v_whatsapp := NEW.raw_user_meta_data->>'whatsapp';
  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'admin');

  -- Criar perfil COM EMAIL E CREATED_BY_USER_ID
  INSERT INTO profiles (
    id,
    full_name,
    username,
    document_id,
    whatsapp,
    role,
    selected_plan,
    email,
    created_by_user_id,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    v_full_name,
    v_username,
    v_document_id,
    v_whatsapp,
    v_role,
    v_selected_plan,
    NEW.email,
    NEW.id,
    NOW(),
    NOW()
  );

  RAISE NOTICE '[handle_new_user] ✅ Perfil criado: % (role: %, plan: %)', NEW.email, v_role, v_selected_plan;

  -- Criar funil e estágios padrão apenas para ADMIN
  IF v_role = 'admin' THEN
    INSERT INTO funnels (name, description, is_active, created_by_user_id)
    VALUES ('Funil Padrão', 'Funil criado automaticamente', true, NEW.id)
    RETURNING id INTO funnel_id;

    INSERT INTO kanban_stages (title, color, order_position, is_won, is_lost, is_fixed, funnel_id, created_by_user_id)
    VALUES
      ('Novo Lead', '#3b82f6', 0, false, false, true, funnel_id, NEW.id),
      ('Contato Inicial', '#8b5cf6', 1, false, false, false, funnel_id, NEW.id),
      ('Proposta Enviada', '#f59e0b', 2, false, false, false, funnel_id, NEW.id),
      ('Negociação', '#10b981', 3, false, false, false, funnel_id, NEW.id),
      ('Ganho', '#22c55e', 4, true, false, true, funnel_id, NEW.id),
      ('Perdido', '#ef4444', 5, false, true, true, funnel_id, NEW.id);

    RAISE NOTICE '[handle_new_user] ✅ Funil e estágios criados para admin: %', NEW.email;
  END IF;

  RAISE NOTICE '[handle_new_user] 🎉 Setup completo para: %', NEW.email;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '[handle_new_user] ❌ ERRO: % - %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PARTE 2: Criar função e trigger para redirecionar plano PAGO
-- ============================================

-- Função que registra necessidade de checkout (será processado pelo frontend)
CREATE OR REPLACE FUNCTION public.trigger_paid_plan_checkout()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_type TEXT;
BEGIN
  -- Pegar o plano selecionado
  v_plan_type := NEW.selected_plan;

  -- Verificar se é plano PAGO (não gratuito)
  IF v_plan_type IS NOT NULL AND v_plan_type != 'free_200' THEN
    RAISE NOTICE '[trigger_paid_plan_checkout] 💳 Plano pago detectado: % para usuário: %', v_plan_type, NEW.email;

    -- Criar registro em plan_subscriptions como 'pending_checkout'
    -- Isso indica que o usuário precisa ser redirecionado para pagamento
    INSERT INTO plan_subscriptions (
      user_id,
      plan_type,
      status,
      member_limit,
      current_period_start,
      current_period_end,
      created_at
    ) VALUES (
      NEW.id,
      v_plan_type,
      'pending_checkout', -- Status especial para indicar que precisa checkout
      CASE
        WHEN v_plan_type = 'pro_5k' THEN 3
        WHEN v_plan_type = 'ultra_15k' THEN 999
        ELSE 0
      END,
      NULL,
      NULL,
      NOW()
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      plan_type = EXCLUDED.plan_type,
      status = 'pending_checkout',
      member_limit = EXCLUDED.member_limit,
      updated_at = NOW();

    RAISE NOTICE '[trigger_paid_plan_checkout] ✅ Registro de checkout criado para: %', NEW.email;
  ELSE
    RAISE NOTICE '[trigger_paid_plan_checkout] 🆓 Plano gratuito detectado, ignorando checkout: %', NEW.email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger que executa APÓS o trigger de ativação de plano
DROP TRIGGER IF EXISTS trigger_paid_plan_checkout_redirect ON public.profiles;

CREATE TRIGGER trigger_paid_plan_checkout_redirect
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_paid_plan_checkout();

-- Comentários
COMMENT ON FUNCTION trigger_paid_plan_checkout() IS
'Trigger que detecta planos pagos e cria registro para indicar necessidade de checkout no Mercado Pago';

-- ============================================
-- PARTE 3: Ajustar ordem de execução dos triggers
-- ============================================

-- Os triggers serão executados em ordem alfabética:
-- 1. trigger_activate_plan_on_register (ativa plano gratuito)
-- 2. trigger_paid_plan_checkout_redirect (registra checkout para plano pago)

-- FIM DA MIGRATION