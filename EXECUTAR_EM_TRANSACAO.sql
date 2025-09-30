-- ============================================
-- EXECUTAR EM TRANSAÇÃO PARA EVITAR ERRO DE PENDING TRIGGERS
-- ============================================

-- Iniciar transação
BEGIN;

-- ============================================
-- PRIMEIRO: Corrigir as funções que usam status inválidos
-- ============================================

-- 1. Corrigir função trigger_paid_plan_checkout
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

    -- Criar registro em plan_subscriptions como 'trialing' (aguardando pagamento)
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
      'trialing', -- ✅ USAR 'trialing' em vez de 'pending_checkout'
      CASE
        WHEN v_plan_type = 'pro_5k' THEN 3
        WHEN v_plan_type = 'ultra_15k' THEN 999
        ELSE 0
      END,
      NOW(),  -- Período começa agora
      NOW() + INTERVAL '7 days',  -- 7 dias para completar pagamento
      NOW()
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      plan_type = EXCLUDED.plan_type,
      status = 'trialing',  -- ✅ USAR 'trialing'
      member_limit = EXCLUDED.member_limit,
      current_period_start = NOW(),
      current_period_end = NOW() + INTERVAL '7 days',
      updated_at = NOW();

    RAISE NOTICE '[trigger_paid_plan_checkout] ✅ Registro de checkout criado para: %', NEW.email;
  ELSE
    RAISE NOTICE '[trigger_paid_plan_checkout] 🆓 Plano gratuito detectado, ignorando checkout: %', NEW.email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Corrigir função activate_free_plan_on_register
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
    -- ✅ Para planos pagos, usar 'trialing' em vez de 'pending'
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
      'trialing',  -- ✅ USAR 'trialing' em vez de 'pending'
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
-- SEGUNDO: Criar dados do usuário teste (se necessário)
-- ============================================

-- Verificar e criar profile se não existir
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
)
SELECT
    au.id,
    au.raw_user_meta_data->>'full_name',
    split_part(au.email, '@', 1),
    au.raw_user_meta_data->>'document_id',
    au.raw_user_meta_data->>'whatsapp',
    'admin'::user_role,
    au.raw_user_meta_data->>'selected_plan',
    au.email,
    au.id,
    NOW(),
    NOW()
FROM auth.users au
WHERE au.email = 'inaciojrdossantos@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = au.id);

-- Criar plan_subscription se não existir
INSERT INTO plan_subscriptions (
    user_id,
    plan_type,
    status,
    member_limit,
    current_period_start,
    current_period_end,
    created_at
)
SELECT
    p.id,
    'pro_5k',
    'trialing',
    3,
    NOW(),
    NOW() + INTERVAL '7 days',
    NOW()
FROM profiles p
WHERE p.email = 'inaciojrdossantos@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM plan_subscriptions
    WHERE user_id = p.id
  );

-- ============================================
-- TERCEIRO: Verificar resultados
-- ============================================

-- Verificar status final
SELECT
    'VERIFICAÇÃO FINAL' as secao,
    p.id as profile_id,
    p.email,
    p.selected_plan,
    ps.status as subscription_status,
    ps.plan_type,
    ps.current_period_end,
    CASE
        WHEN p.id IS NOT NULL THEN '✅ PROFILE OK'
        ELSE '❌ PROFILE FALTANDO'
    END as status_profile,
    CASE
        WHEN ps.status = 'trialing' THEN '✅ SUBSCRIPTION OK (AGUARDANDO PAGAMENTO)'
        WHEN ps.status = 'active' THEN '✅ SUBSCRIPTION ATIVA'
        ELSE '❌ SUBSCRIPTION PROBLEMA'
    END as status_subscription
FROM profiles p
LEFT JOIN plan_subscriptions ps ON ps.user_id = p.id
WHERE p.email = 'inaciojrdossantos@gmail.com';

-- Confirmar transação
COMMIT;

-- ============================================
-- INSTRUÇÕES:
-- 1. Execute este arquivo COMPLETO de uma vez
-- 2. Ele corrige as funções e cria os dados em uma única transação
-- 3. Isso evita o erro de "pending trigger events"
-- ============================================