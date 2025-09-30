-- ============================================
-- MIGRATION: Ativação automática de plano gratuito
-- Data: 2025-09-27
-- ============================================

-- 1. ADICIONAR COLUNA selected_plan EM profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS selected_plan TEXT;

-- 2. ADICIONAR CONSTRAINTS UNIQUE NAS TABELAS DE PLANO
-- Garantir que user_id seja único em free_trial_usage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'free_trial_usage_user_id_key'
  ) THEN
    ALTER TABLE public.free_trial_usage
      ADD CONSTRAINT free_trial_usage_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Garantir que user_id seja único em plan_subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'plan_subscriptions_user_id_key'
  ) THEN
    ALTER TABLE public.plan_subscriptions
      ADD CONSTRAINT plan_subscriptions_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Garantir que user_id seja único em message_usage_tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'message_usage_tracking_user_id_key'
  ) THEN
    ALTER TABLE public.message_usage_tracking
      ADD CONSTRAINT message_usage_tracking_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 3. CRIAR FUNÇÃO PARA ATIVAR PLANO GRATUITO AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION activate_free_plan_on_register()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_type TEXT;
BEGIN
  -- Pegar o plano selecionado dos metadados do usuário
  v_plan_type := COALESCE(NEW.selected_plan, 'free_200');

  -- Se for plano gratuito, ativar imediatamente
  IF v_plan_type = 'free_200' THEN
    -- Criar registro em free_trial_usage
    INSERT INTO free_trial_usage (
      user_id,
      activated_at,
      expires_at,
      messages_limit,
      consumed_messages
    ) VALUES (
      NEW.id,
      NOW(),
      NOW() + INTERVAL '30 days',
      200,
      0
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- Criar registro em plan_subscriptions
    INSERT INTO plan_subscriptions (
      user_id,
      plan_type,
      status,
      member_limit,
      current_period_start,
      current_period_end,
      has_used_free_trial
    ) VALUES (
      NEW.id,
      'free_200',
      'active',
      0,
      NOW(),
      NOW() + INTERVAL '30 days',
      TRUE
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- Criar registro em message_usage_tracking
    INSERT INTO message_usage_tracking (
      user_id,
      plan_limit,
      period_start,
      period_end,
      messages_sent_count,
      messages_received_count,
      total_messages_count,
      ai_messages_sent,
      status
    ) VALUES (
      NEW.id,
      200,
      NOW(),
      NOW() + INTERVAL '30 days',
      0,
      0,
      0,
      0,
      'active'
    )
    ON CONFLICT (user_id) DO NOTHING;

    RAISE NOTICE 'Plano gratuito ativado automaticamente para usuário %', NEW.id;
  ELSE
    -- Para planos pagos, apenas criar registro pendente
    INSERT INTO plan_subscriptions (
      user_id,
      plan_type,
      status,
      member_limit,
      current_period_start,
      current_period_end
    ) VALUES (
      NEW.id,
      v_plan_type,
      'pending',
      CASE
        WHEN v_plan_type = 'pro_5k' THEN 3
        WHEN v_plan_type = 'ultra_15k' THEN 999
        ELSE 0
      END,
      NULL,
      NULL
    )
    ON CONFLICT (user_id) DO NOTHING;

    RAISE NOTICE 'Plano pago % registrado como pendente para usuário %', v_plan_type, NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. CRIAR TRIGGER PARA EXECUTAR APÓS INSERT EM profiles
DROP TRIGGER IF EXISTS trigger_activate_plan_on_register ON public.profiles;

CREATE TRIGGER trigger_activate_plan_on_register
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION activate_free_plan_on_register();

-- 5. CRIAR ÍNDICE NA COLUNA selected_plan
CREATE INDEX IF NOT EXISTS idx_profiles_selected_plan
  ON public.profiles(selected_plan);

-- FIM DA MIGRATION