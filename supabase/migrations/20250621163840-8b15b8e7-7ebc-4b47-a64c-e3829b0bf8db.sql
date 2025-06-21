
-- Primeiro, vamos verificar o ID do usuário digitalticlin@gmail.com
-- e criar um funil padrão para ele

DO $$
DECLARE
  user_uuid UUID;
  funnel_uuid UUID;
BEGIN
  -- Buscar o ID do usuário pelo email
  SELECT id INTO user_uuid 
  FROM auth.users 
  WHERE email = 'digitalticlin@gmail.com';

  -- Verificar se o usuário existe
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'Usuário digitalticlin@gmail.com não encontrado';
  END IF;

  -- Criar funil padrão
  INSERT INTO public.funnels (name, description, created_by_user_id)
  VALUES (
    'Funil Principal',
    'Funil padrão criado automaticamente',
    user_uuid
  )
  RETURNING id INTO funnel_uuid;

  -- Criar estágios padrão
  INSERT INTO public.kanban_stages (title, color, order_position, funnel_id, created_by_user_id, is_fixed, is_won, is_lost) VALUES
    ('Entrada de Leads', '#3b82f6', 1, funnel_uuid, user_uuid, true, false, false),
    ('Em atendimento', '#8b5cf6', 2, funnel_uuid, user_uuid, false, false, false),
    ('Em negociação', '#f59e0b', 3, funnel_uuid, user_uuid, false, false, false),
    ('Entrar em contato', '#ef4444', 4, funnel_uuid, user_uuid, false, false, false),
    ('GANHO', '#10b981', 5, funnel_uuid, user_uuid, true, true, false),
    ('PERDIDO', '#6b7280', 6, funnel_uuid, user_uuid, true, false, true);

  -- Confirmar criação
  RAISE NOTICE 'Funil padrão criado com sucesso para o usuário digitalticlin@gmail.com';
  RAISE NOTICE 'Funil ID: %', funnel_uuid;
  RAISE NOTICE 'Usuário ID: %', user_uuid;

END $$;
