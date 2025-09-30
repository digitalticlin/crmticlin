-- ============================================
-- CORRIGIR FUNÇÃO activate_free_plan_on_register
-- Problema: usa status 'pending' que não existe
-- ============================================

CREATE OR REPLACE FUNCTION public.activate_free_plan_on_register()
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
      'active',  -- ✅ Plano gratuito ativa automaticamente
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

  ELSIF v_plan_type IN ('pro_5k', 'ultra_15k') THEN
    -- ✅ CORREÇÃO: Para planos pagos, usar 'trialing' em vez de 'pending'
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
      'trialing',  -- ✅ MUDANÇA: de 'pending' para 'trialing'
      CASE
        WHEN v_plan_type = 'pro_5k' THEN 3
        WHEN v_plan_type = 'ultra_15k' THEN 999
        ELSE 0
      END,
      NOW(),  -- Período de trial começa agora
      NOW() + INTERVAL '7 days'  -- 7 dias para completar pagamento
    )
    ON CONFLICT (user_id) DO NOTHING;

    RAISE NOTICE 'Plano pago % registrado como trialing para usuário %', v_plan_type, NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICAÇÃO APÓS CORREÇÃO
-- ============================================

-- Verificar se a função foi atualizada
SELECT
    routine_name,
    routine_definition LIKE '%trialing%' as usa_trialing,
    routine_definition LIKE '%pending%' as usa_pending
FROM information_schema.routines
WHERE routine_name = 'activate_free_plan_on_register';

-- ============================================
-- INSTRUÇÕES:
-- 1. Execute esta correção ANTES da parte 3 do arquivo principal
-- 2. Isso corrige o problema do status inválido
-- ============================================