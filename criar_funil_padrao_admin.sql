-- ============================================
-- CRIAR FUNIL PADRÃO PARA ADMIN + ETAPAS
-- ============================================

DO $$
DECLARE
    v_funnel_id UUID;
BEGIN
    -- 1. CRIAR FUNIL PADRÃO PARA O ADMIN PROBLEMÁTICO
    INSERT INTO funnels (
      id,
      name,
      description,
      is_active,
      created_by_user_id,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      'Funil Padrão - WhatsApp',
      'Funil automático criado para processar leads do WhatsApp',
      true,
      'e75375eb-37a8-4afa-8fa3-1f13e4855439',
      NOW(),
      NOW()
    ) RETURNING id INTO v_funnel_id;

    RAISE NOTICE 'Funil criado com ID: %', v_funnel_id;

    -- 2. CRIAR ETAPAS PADRÃO PARA O FUNIL

    -- Etapa 1: Entrada de Leads
    INSERT INTO kanban_stages (
      id,
      title,
      order_position,
      funnel_id,
      is_won,
      is_lost,
      color,
      created_by_user_id,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      'Entrada de Leads',
      1,
      v_funnel_id,
      false,
      false,
      '#3B82F6', -- Azul
      'e75375eb-37a8-4afa-8fa3-1f13e4855439',
      NOW(),
      NOW()
    );

    -- Etapa 2: Qualificação
    INSERT INTO kanban_stages (
      id,
      title,
      order_position,
      funnel_id,
      is_won,
      is_lost,
      color,
      created_by_user_id,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      'Qualificação',
      2,
      v_funnel_id,
      false,
      false,
      '#F59E0B', -- Amarelo
      'e75375eb-37a8-4afa-8fa3-1f13e4855439',
      NOW(),
      NOW()
    );

    -- Etapa 3: Negociação
    INSERT INTO kanban_stages (
      id,
      title,
      order_position,
      funnel_id,
      is_won,
      is_lost,
      color,
      created_by_user_id,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      'Negociação',
      3,
      v_funnel_id,
      false,
      false,
      '#EF4444', -- Vermelho
      'e75375eb-37a8-4afa-8fa3-1f13e4855439',
      NOW(),
      NOW()
    );

    -- Etapa 4: Ganho
    INSERT INTO kanban_stages (
      id,
      title,
      order_position,
      funnel_id,
      is_won,
      is_lost,
      color,
      created_by_user_id,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      'Ganho',
      4,
      v_funnel_id,
      true,  -- Etapa de vitória
      false,
      '#10B981', -- Verde
      'e75375eb-37a8-4afa-8fa3-1f13e4855439',
      NOW(),
      NOW()
    );

    -- Etapa 5: Perdido
    INSERT INTO kanban_stages (
      id,
      title,
      order_position,
      funnel_id,
      is_won,
      is_lost,
      color,
      created_by_user_id,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      'Perdido',
      5,
      v_funnel_id,
      false,
      true,  -- Etapa de perda
      '#6B7280', -- Cinza
      'e75375eb-37a8-4afa-8fa3-1f13e4855439',
      NOW(),
      NOW()
    );

END $$;

-- 3. VERIFICAR SE FOI CRIADO CORRETAMENTE
SELECT
  f.id as funil_id,
  f.name as funil_nome,
  f.is_active,
  COUNT(ks.id) as total_etapas
FROM funnels f
LEFT JOIN kanban_stages ks ON f.id = ks.funnel_id
WHERE f.created_by_user_id = 'e75375eb-37a8-4afa-8fa3-1f13e4855439'
GROUP BY f.id, f.name, f.is_active
ORDER BY f.created_at DESC;