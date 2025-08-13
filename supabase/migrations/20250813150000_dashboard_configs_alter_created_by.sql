-- Alter dashboard_configs: drop company_id, add created_by_user_id

alter table public.dashboard_configs
  add column if not exists created_by_user_id uuid;

-- Preencher created_by_user_id com user_id existente
update public.dashboard_configs
  set created_by_user_id = user_id
where created_by_user_id is null;

-- Tornar not null após preenchimento
alter table public.dashboard_configs
  alter column created_by_user_id set not null;

-- Remover company_id se existir
do $$ begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'dashboard_configs' and column_name = 'company_id'
  ) then
    alter table public.dashboard_configs drop column company_id;
  end if;
end $$;

-- Index útil para auditorias/consultas por criador
create index if not exists dashboard_configs_created_by_idx
  on public.dashboard_configs (created_by_user_id);

-- Atualizar RLS para usar created_by_user_id
do $$ begin
  if exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'dashboard_configs' and policyname = 'Allow select own config'
  ) then
    drop policy "Allow select own config" on public.dashboard_configs;
  end if;
  create policy "Allow select own config"
    on public.dashboard_configs
    for select
    using (auth.uid() = created_by_user_id);
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'dashboard_configs' and policyname = 'Allow insert own config'
  ) then
    drop policy "Allow insert own config" on public.dashboard_configs;
  end if;
  create policy "Allow insert own config"
    on public.dashboard_configs
    for insert
    with check (auth.uid() = created_by_user_id);
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'dashboard_configs' and policyname = 'Allow update own config'
  ) then
    drop policy "Allow update own config" on public.dashboard_configs;
  end if;
  create policy "Allow update own config"
    on public.dashboard_configs
    for update
    using (auth.uid() = created_by_user_id)
    with check (auth.uid() = created_by_user_id);
end $$;


