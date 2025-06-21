
-- Criar políticas RLS para todas as tabelas

-- Políticas para funnels
CREATE POLICY "Users can view their own funnels" ON public.funnels
  FOR SELECT USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can create their own funnels" ON public.funnels
  FOR INSERT WITH CHECK (created_by_user_id = auth.uid());

CREATE POLICY "Users can update their own funnels" ON public.funnels
  FOR UPDATE USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can delete their own funnels" ON public.funnels
  FOR DELETE USING (created_by_user_id = auth.uid());

-- Políticas para kanban_stages
CREATE POLICY "Users can view stages of their funnels" ON public.kanban_stages
  FOR SELECT USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can create stages for their funnels" ON public.kanban_stages
  FOR INSERT WITH CHECK (created_by_user_id = auth.uid());

CREATE POLICY "Users can update stages of their funnels" ON public.kanban_stages
  FOR UPDATE USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can delete stages of their funnels" ON public.kanban_stages
  FOR DELETE USING (created_by_user_id = auth.uid());

-- Políticas para leads
CREATE POLICY "Users can view their own leads" ON public.leads
  FOR SELECT USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can create their own leads" ON public.leads
  FOR INSERT WITH CHECK (created_by_user_id = auth.uid());

CREATE POLICY "Users can update their own leads" ON public.leads
  FOR UPDATE USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can delete their own leads" ON public.leads
  FOR DELETE USING (created_by_user_id = auth.uid());

-- Políticas para tags
CREATE POLICY "Users can view their own tags" ON public.tags
  FOR SELECT USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can create their own tags" ON public.tags
  FOR INSERT WITH CHECK (created_by_user_id = auth.uid());

CREATE POLICY "Users can update their own tags" ON public.tags
  FOR UPDATE USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can delete their own tags" ON public.tags
  FOR DELETE USING (created_by_user_id = auth.uid());

-- Políticas para lead_tags
CREATE POLICY "Users can view tags of their leads" ON public.lead_tags
  FOR SELECT USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can create tags for their leads" ON public.lead_tags
  FOR INSERT WITH CHECK (created_by_user_id = auth.uid());

CREATE POLICY "Users can delete tags from their leads" ON public.lead_tags
  FOR DELETE USING (created_by_user_id = auth.uid());

-- Políticas para deals
CREATE POLICY "Users can view their own deals" ON public.deals
  FOR SELECT USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can create their own deals" ON public.deals
  FOR INSERT WITH CHECK (created_by_user_id = auth.uid());

-- Atualizar a função handle_new_user para criar funil padrão
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  funnel_id UUID;
BEGIN
  -- Criar perfil do usuário
  INSERT INTO public.profiles (id, full_name, role, created_by_user_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    'admin',
    NEW.id
  );

  -- Criar funil padrão
  INSERT INTO public.funnels (name, description, created_by_user_id)
  VALUES (
    'Funil Principal',
    'Funil padrão criado automaticamente',
    NEW.id
  )
  RETURNING id INTO funnel_id;

  -- Criar estágios padrão
  INSERT INTO public.kanban_stages (title, color, order_position, funnel_id, created_by_user_id, is_fixed, is_won, is_lost) VALUES
    ('Entrada de Leads', '#3b82f6', 1, funnel_id, NEW.id, true, false, false),
    ('Em atendimento', '#8b5cf6', 2, funnel_id, NEW.id, false, false, false),
    ('Em negociação', '#f59e0b', 3, funnel_id, NEW.id, false, false, false),
    ('Entrar em contato', '#ef4444', 4, funnel_id, NEW.id, false, false, false),
    ('GANHO', '#10b981', 5, funnel_id, NEW.id, true, true, false),
    ('PERDIDO', '#6b7280', 6, funnel_id, NEW.id, true, false, true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
