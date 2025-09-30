-- ============================================
-- CORREÇÃO COMPLETA: PLANOS PAGOS E PADRONIZAÇÃO DE FUNIS
-- ============================================

-- ============================================
-- PARTE 1: CORRIGIR FUNÇÃO handle_new_user PARA TRATAR PLANOS PAGOS
-- ============================================

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

  -- ✅ CRIAR PERFIL PARA TODOS OS TIPOS DE PLANO (GRATUITO E PAGO)
  INSERT INTO profiles (
    id,
    full_name,
    username,
    document_id,
    whatsapp,
    role,
    selected_plan,
    email,                    -- ✅ INCLUIR EMAIL SEMPRE
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
    NEW.email,               -- ✅ EMAIL DO AUTH.USERS
    NEW.id,
    NOW(),
    NOW()
  );

  RAISE NOTICE '[handle_new_user] ✅ Perfil criado: % (role: %, plan: %)', NEW.email, v_role, v_selected_plan;

  -- ✅ CRIAR FUNIL PADRÃO PARA TODOS OS ADMINS (GRATUITO E PAGO)
  IF v_role = 'admin' THEN
    INSERT INTO funnels (name, description, is_active, created_by_user_id)
    VALUES ('Funil Padrão', 'Funil criado automaticamente', true, NEW.id)
    RETURNING id INTO funnel_id;

    -- ✅ PADRONIZAR FUNIL COM 7 ETAPAS (IGUAL AO create_default_funnel_for_admin)
    INSERT INTO kanban_stages (title, color, order_position, is_won, is_lost, is_fixed, funnel_id, created_by_user_id)
    VALUES
      ('Entrada de Leads',     '#3B82F6', 1, false, false, true,  funnel_id, NEW.id),  -- FIXA
      ('Em Atendimento',       '#F59E0B', 2, false, false, true,  funnel_id, NEW.id),  -- FIXA
      ('Orçamento',           '#8B5CF6', 3, false, false, false, funnel_id, NEW.id),
      ('Negociação',          '#EF4444', 4, false, false, false, funnel_id, NEW.id),
      ('Fechamento',          '#F97316', 5, false, false, false, funnel_id, NEW.id),
      ('Ganho',               '#10B981', 6, true,  false, true,  funnel_id, NEW.id),  -- FIXA
      ('Perdido',             '#6B7280', 7, false, true,  true,  funnel_id, NEW.id);  -- FIXA

    RAISE NOTICE '[handle_new_user] ✅ Funil padronizado (7 etapas) criado para: %', NEW.email;
  END IF;

  RAISE NOTICE '[handle_new_user] 🎉 Setup completo para: % (plano: %)', NEW.email, v_selected_plan;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '[handle_new_user] ❌ ERRO: % - %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PARTE 2: PADRONIZAR create_default_funnel_for_admin COM MESMA ESTRUTURA
-- ============================================

CREATE OR REPLACE FUNCTION public.create_default_funnel_for_admin()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_funnel_id UUID;
  v_stage_entrada_id UUID;
  v_stage_atendimento_id UUID;
  v_stage_orcamento_id UUID;
  v_stage_negociacao_id UUID;
  v_stage_fechamento_id UUID;
  v_stage_ganho_id UUID;
  v_stage_perdido_id UUID;
BEGIN
  -- ✅ CONDIÇÃO ATUALIZADA: Só executa se handle_new_user NÃO criou funil
  -- Isso evita duplicação de funis
  IF NEW.created_by_user_id IS NULL AND NEW.role = 'admin' THEN

    -- Verificar se já existe funil criado pelo handle_new_user
    IF EXISTS (
      SELECT 1 FROM funnels
      WHERE created_by_user_id = NEW.id
        AND name = 'Funil Padrão'
    ) THEN
      RAISE NOTICE '[create_default_funnel] ⚠️ Funil já existe, pulando criação para: %', NEW.id;
      RETURN NEW;
    END IF;

    RAISE NOTICE '[create_default_funnel] 🚀 Criando funil padrão para admin: %', NEW.id;

    -- Gerar IDs únicos
    v_funnel_id := gen_random_uuid();
    v_stage_entrada_id := gen_random_uuid();
    v_stage_atendimento_id := gen_random_uuid();
    v_stage_orcamento_id := gen_random_uuid();
    v_stage_negociacao_id := gen_random_uuid();
    v_stage_fechamento_id := gen_random_uuid();
    v_stage_ganho_id := gen_random_uuid();
    v_stage_perdido_id := gen_random_uuid();

    -- Criar o funil padrão
    INSERT INTO funnels (
      id,
      name,
      description,
      is_active,
      created_by_user_id,
      created_at,
      updated_at
    ) VALUES (
      v_funnel_id,
      'Funil Padrão - WhatsApp',
      'Funil automático criado para processar leads do WhatsApp',
      true,
      NEW.id,
      NOW(),
      NOW()
    );

    -- ✅ CRIAR MESMA ESTRUTURA DE 7 ETAPAS
    INSERT INTO kanban_stages (
      id, title, order_position, funnel_id, is_won, is_lost, color, is_fixed, created_by_user_id, created_at, updated_at
    ) VALUES
      (v_stage_entrada_id,     'Entrada de Leads',   1, v_funnel_id, false, false, '#3B82F6', true,  NEW.id, NOW(), NOW()),
      (v_stage_atendimento_id, 'Em Atendimento',     2, v_funnel_id, false, false, '#F59E0B', true,  NEW.id, NOW(), NOW()),
      (v_stage_orcamento_id,   'Orçamento',         3, v_funnel_id, false, false, '#8B5CF6', false, NEW.id, NOW(), NOW()),
      (v_stage_negociacao_id,  'Negociação',        4, v_funnel_id, false, false, '#EF4444', false, NEW.id, NOW(), NOW()),
      (v_stage_fechamento_id,  'Fechamento',        5, v_funnel_id, false, false, '#F97316', false, NEW.id, NOW(), NOW()),
      (v_stage_ganho_id,       'Ganho',             6, v_funnel_id, true,  false, '#10B981', true,  NEW.id, NOW(), NOW()),
      (v_stage_perdido_id,     'Perdido',           7, v_funnel_id, false, true,  '#6B7280', true,  NEW.id, NOW(), NOW());

    RAISE NOTICE '[create_default_funnel] ✅ Funil padrão padronizado criado com sucesso: %', v_funnel_id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PARTE 2.5: CORRIGIR FUNÇÃO trigger_paid_plan_checkout
-- Problema: usa 'pending_checkout' que não existe
-- ============================================

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
      'trialing', -- ✅ MUDANÇA: usar 'trialing' em vez de 'pending_checkout'
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
      status = 'trialing',  -- ✅ MUDANÇA: usar 'trialing'
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

-- ============================================
-- PARTE 3: CORRIGIR SITUAÇÃO DO USUÁRIO DE TESTE
-- ============================================

-- 3.1 Criar profile manualmente para o usuário de teste
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
    au.email,  -- ✅ EMAIL INCLUÍDO
    au.id,
    NOW(),
    NOW()
FROM auth.users au
WHERE au.email = 'inaciojrdossantos@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = au.id);

-- 3.2 Criar funil para o usuário de teste (7 etapas padronizadas)
DO $$
DECLARE
    v_user_id UUID;
    v_funnel_id UUID;
BEGIN
    -- Buscar ID do usuário
    SELECT id INTO v_user_id
    FROM profiles
    WHERE email = 'inaciojrdossantos@gmail.com';

    IF v_user_id IS NOT NULL THEN
        -- Criar funil se não existir
        IF NOT EXISTS (SELECT 1 FROM funnels WHERE created_by_user_id = v_user_id) THEN
            INSERT INTO funnels (name, description, is_active, created_by_user_id)
            VALUES ('Funil Padrão', 'Funil criado automaticamente', true, v_user_id)
            RETURNING id INTO v_funnel_id;

            -- Criar 7 etapas padronizadas
            INSERT INTO kanban_stages (title, color, order_position, is_won, is_lost, is_fixed, funnel_id, created_by_user_id)
            VALUES
              ('Entrada de Leads',     '#3B82F6', 1, false, false, true,  v_funnel_id, v_user_id),
              ('Em Atendimento',       '#F59E0B', 2, false, false, true,  v_funnel_id, v_user_id),
              ('Orçamento',           '#8B5CF6', 3, false, false, false, v_funnel_id, v_user_id),
              ('Negociação',          '#EF4444', 4, false, false, false, v_funnel_id, v_user_id),
              ('Fechamento',          '#F97316', 5, false, false, false, v_funnel_id, v_user_id),
              ('Ganho',               '#10B981', 6, true,  false, true,  v_funnel_id, v_user_id),
              ('Perdido',             '#6B7280', 7, false, true,  true,  v_funnel_id, v_user_id);

            RAISE NOTICE 'Funil criado para usuário de teste: %', v_funnel_id;
        END IF;
    END IF;
END $$;

-- 3.3 Criar plan_subscription manualmente para plano pago
-- NOTA: Como não há status 'pending_checkout', vamos usar 'trialing' temporariamente
-- O webhook do Mercado Pago atualizará para 'active' após pagamento
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
    'trialing',  -- ✅ VALOR VÁLIDO: representa aguardando pagamento
    3,
    NOW(),  -- Período começa agora
    NOW() + INTERVAL '7 days',  -- 7 dias para completar pagamento
    NOW()
FROM profiles p
WHERE p.email = 'inaciojrdossantos@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM plan_subscriptions
    WHERE user_id = p.id
  );

-- ============================================
-- PARTE 4: VERIFICAÇÕES FINAIS
-- ============================================

-- 4.1 Verificar se profile foi criado com email
SELECT
    p.id,
    p.email,
    p.full_name,
    p.selected_plan,
    p.created_at,
    CASE
        WHEN p.email IS NOT NULL THEN '✅ EMAIL_INCLUIDO'
        ELSE '❌ EMAIL_AUSENTE'
    END as status_email
FROM profiles p
WHERE p.email = 'inaciojrdossantos@gmail.com';

-- 4.2 Verificar se funil foi criado com 7 etapas
SELECT
    f.id as funnel_id,
    f.name as funnel_name,
    COUNT(ks.id) as total_stages,
    STRING_AGG(ks.title, ' | ' ORDER BY ks.order_position) as stages_list
FROM profiles p
JOIN funnels f ON f.created_by_user_id = p.id
LEFT JOIN kanban_stages ks ON ks.funnel_id = f.id
WHERE p.email = 'inaciojrdossantos@gmail.com'
GROUP BY f.id, f.name;

-- 4.3 Status completo após correções
SELECT
    'USUARIO_TESTE_CORRIGIDO' as secao,
    p.id as profile_id,
    p.email,
    p.selected_plan,
    f.name as funnel_name,
    COUNT(ks.id) as total_stages,
    CASE
        WHEN p.id IS NOT NULL THEN '✅ PROFILE_CRIADO'
        ELSE '❌ PROFILE_AUSENTE'
    END as status_profile,
    CASE
        WHEN f.id IS NOT NULL THEN '✅ FUNIL_CRIADO'
        ELSE '❌ FUNIL_AUSENTE'
    END as status_funil,
    CASE
        WHEN COUNT(ks.id) = 7 THEN '✅ FUNIL_PADRONIZADO_7_ETAPAS'
        ELSE CONCAT('⚠️ FUNIL_COM_', COUNT(ks.id), '_ETAPAS')
    END as status_padronizacao
FROM profiles p
LEFT JOIN funnels f ON f.created_by_user_id = p.id
LEFT JOIN kanban_stages ks ON ks.funnel_id = f.id
WHERE p.email = 'inaciojrdossantos@gmail.com'
GROUP BY p.id, p.email, p.selected_plan, f.id, f.name;

-- ============================================
-- PARTE 5: VERIFICAR SE TODAS AS CORREÇÕES FORAM APLICADAS
-- ============================================

-- 5.1 Verificar se funções não usam mais 'pending' ou 'pending_checkout'
SELECT
    routine_name,
    CASE
        WHEN routine_definition LIKE '%pending_checkout%' THEN '❌ AINDA USA pending_checkout'
        WHEN routine_definition LIKE '%''pending''%' THEN '❌ AINDA USA pending'
        ELSE '✅ CORRIGIDO'
    END as status_correcao
FROM information_schema.routines
WHERE routine_name IN (
    'activate_free_plan_on_register',
    'trigger_paid_plan_checkout'
);

-- ============================================
-- INSTRUÇÕES DE EXECUÇÃO:
-- 1. Execute na ordem: PARTE 1, 2, 2.5, 3
-- 2. As funções serão atualizadas para usar 'trialing' em vez de 'pending'
-- 3. O usuário de teste será corrigido manualmente
-- 4. Funis serão padronizados com 7 etapas iguais
-- 5. Verifique com a PARTE 5 se tudo foi corrigido
-- 6. Após isso, teste novamente a criação de conta com plano pago
-- ============================================