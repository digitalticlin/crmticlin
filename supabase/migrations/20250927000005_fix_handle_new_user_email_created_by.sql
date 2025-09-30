-- ============================================
-- FIX: Adicionar email e created_by_user_id ao criar profile
-- Data: 2025-09-27
-- ============================================

-- Atualizar função handle_new_user para preencher email e created_by_user_id
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

  RAISE NOTICE '[handle_new_user] 🚀 Processando usuário de REGISTRO: %', NEW.email;

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
  v_selected_plan := COALESCE(NEW.raw_user_meta_data->>'selected_plan', 'free_200');

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

  RAISE NOTICE '[handle_new_user] ✅ Perfil criado para registro: % (role: %, plan: %)', NEW.email, v_role, v_selected_plan;

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

  RAISE NOTICE '[handle_new_user] 🎉 Setup completo para registro: %', NEW.email;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '[handle_new_user] ❌ ERRO: % - %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- FIM DA MIGRATION