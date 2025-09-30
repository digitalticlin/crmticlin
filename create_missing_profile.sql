-- Criar profile manualmente para o usuário órfão
-- ID: 76f094e2-c33b-4110-b991-1cc48c53b576

DO $$
DECLARE
  v_user RECORD;
  v_full_name TEXT;
  v_username TEXT;
  v_document_id TEXT;
  v_whatsapp TEXT;
  v_role user_role;
  v_selected_plan TEXT;
  funnel_id UUID;
BEGIN
  -- Buscar usuário
  SELECT * INTO v_user
  FROM auth.users
  WHERE id = '76f094e2-c33b-4110-b991-1cc48c53b576';

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado!';
  END IF;

  RAISE NOTICE 'Processando usuário: %', v_user.email;
  RAISE NOTICE 'Metadata: %', v_user.raw_user_meta_data;

  -- Verificar se profile já existe
  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user.id) THEN
    RAISE NOTICE '⚠️ Profile já existe!';
    RETURN;
  END IF;

  -- Extrair dados do metadata
  v_full_name := COALESCE(v_user.raw_user_meta_data->>'full_name', 'Usuário');
  v_username := COALESCE(v_user.raw_user_meta_data->>'username', split_part(v_user.email, '@', 1));
  v_document_id := v_user.raw_user_meta_data->>'document_id';
  v_whatsapp := v_user.raw_user_meta_data->>'whatsapp';
  v_role := COALESCE((v_user.raw_user_meta_data->>'role')::user_role, 'admin');
  v_selected_plan := COALESCE(v_user.raw_user_meta_data->>'selected_plan', 'free_200');

  RAISE NOTICE 'Valores extraídos:';
  RAISE NOTICE '  full_name: %', v_full_name;
  RAISE NOTICE '  username: %', v_username;
  RAISE NOTICE '  document_id: %', v_document_id;
  RAISE NOTICE '  whatsapp: %', v_whatsapp;
  RAISE NOTICE '  role: %', v_role;
  RAISE NOTICE '  selected_plan: %', v_selected_plan;

  -- Criar perfil
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
    v_user.id,
    v_full_name,
    v_username,
    v_document_id,
    v_whatsapp,
    v_role,
    v_selected_plan,
    v_user.email,
    v_user.id,
    NOW(),
    NOW()
  );

  RAISE NOTICE '✅ Profile criado com sucesso!';

  -- Criar funil para admin
  IF v_role = 'admin' THEN
    INSERT INTO funnels (name, description, is_active, created_by_user_id)
    VALUES ('Funil Padrão', 'Funil criado automaticamente', true, v_user.id)
    RETURNING id INTO funnel_id;

    INSERT INTO kanban_stages (title, color, order_position, is_won, is_lost, is_fixed, funnel_id, created_by_user_id)
    VALUES
      ('Novo Lead', '#3b82f6', 0, false, false, true, funnel_id, v_user.id),
      ('Contato Inicial', '#8b5cf6', 1, false, false, false, funnel_id, v_user.id),
      ('Proposta Enviada', '#f59e0b', 2, false, false, false, funnel_id, v_user.id),
      ('Negociação', '#10b981', 3, false, false, false, funnel_id, v_user.id),
      ('Ganho', '#22c55e', 4, true, false, true, funnel_id, v_user.id),
      ('Perdido', '#ef4444', 5, false, true, true, funnel_id, v_user.id);

    RAISE NOTICE '✅ Funil criado com ID: %', funnel_id;
  END IF;

  RAISE NOTICE '🎉 Setup completo!';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ ERRO CAPTURADO:';
    RAISE NOTICE '  SQLSTATE: %', SQLSTATE;
    RAISE NOTICE '  SQLERRM: %', SQLERRM;
    RAISE EXCEPTION '%', SQLERRM;
END $$;

-- Verificar se foi criado
SELECT
  id,
  full_name,
  email,
  role,
  selected_plan,
  created_by_user_id,
  created_at
FROM profiles
WHERE id = '76f094e2-c33b-4110-b991-1cc48c53b576';