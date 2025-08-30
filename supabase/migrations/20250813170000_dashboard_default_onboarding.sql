-- Onboarding: criar config padrão de dashboard e funil/estágios padrão para novos usuários

create or replace function public.handle_new_user()
returns trigger as $
declare
  funnel_id uuid;
begin
  raise notice '[handle_new_user] New user trigger called for user ID: %', new.id;
  raise notice '[handle_new_user] User metadata: %', new.raw_user_meta_data;
  
  -- Criar perfil do usuário (se não existir)
  raise notice '[handle_new_user] Creating profile for user';
  
  insert into public.profiles (id, full_name, role, created_by_user_id)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name','Usuário'), 'admin', new.id)
  on conflict (id) do nothing;
  
  raise notice '[handle_new_user] Profile creation completed';

  -- Criar funil padrão
  raise notice '[handle_new_user] Creating default funnel';
  
  insert into public.funnels (name, description, created_by_user_id)
  values ('Funil Principal', 'Funil padrão criado automaticamente', new.id)
  returning id into funnel_id;
  
  raise notice '[handle_new_user] Default funnel created with ID: %', funnel_id;

  -- Estágios padrão
  raise notice '[handle_new_user] Creating default stages';
  
  insert into public.kanban_stages (title, color, order_position, funnel_id, created_by_user_id, is_fixed, is_won, is_lost) values
    ('Entrada de Leads', '#3b82f6', 1, funnel_id, new.id, true, false, false),
    ('Em atendimento', '#8b5cf6', 2, funnel_id, new.id, false, false, false),
    ('Em negociação', '#f59e0b', 3, funnel_id, new.id, false, false, false),
    ('Entrar em contato', '#ef4444', 4, funnel_id, new.id, false, false, false),
    ('GANHO', '#10b981', 5, funnel_id, new.id, true, true, false),
    ('PERDIDO', '#6b7280', 6, funnel_id, new.id, true, false, true);
    
  raise notice '[handle_new_user] Default stages created';

  -- Dashboard default
  raise notice '[handle_new_user] Creating default dashboard config';
  
  insert into public.dashboard_configs (user_id, created_by_user_id, layout_config, updated_at)
  values (
    new.id,
    new.id,
    jsonb_build_object(
      'kpis', jsonb_build_object(
        'novos_leads', true,
        'total_leads', true,
        'taxa_conversao', true,
        'taxa_perda', true,
        'valor_pipeline', false,
        'ticket_medio', false
      ),
      'charts', jsonb_build_object(
        'funil_conversao', true,
        'performance_vendedores', true,
        'evolucao_temporal', true,
        'leads_etiquetas', false
      ),
      'layout', jsonb_build_object(
        'kpi_order', jsonb_build_array('novos_leads','total_leads','taxa_conversao','taxa_perda','valor_pipeline','ticket_medio'),
        'chart_order', jsonb_build_array('funil_conversao','performance_vendedores','evolucao_temporal','leads_etiquetas')
      ),
      'period_filter', '30'
    ),
    now()
  )
  on conflict (user_id) do update set layout_config = excluded.layout_config, updated_at = now();
  
  raise notice '[handle_new_user] Default dashboard config created/updated';

  return new;
end;
$ language plpgsql security definer;

-- Garantir o trigger em auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


