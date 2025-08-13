-- Create table to persist dashboard customization
create table if not exists public.dashboard_configs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid null,
  layout_config jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.dashboard_configs enable row level security;

-- Allow users to manage their own dashboard configuration
do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
      and tablename = 'dashboard_configs' 
      and policyname = 'Allow select own config'
  ) then
    create policy "Allow select own config"
      on public.dashboard_configs
      for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
      and tablename = 'dashboard_configs' 
      and policyname = 'Allow insert own config'
  ) then
    create policy "Allow insert own config"
      on public.dashboard_configs
      for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
      and tablename = 'dashboard_configs' 
      and policyname = 'Allow update own config'
  ) then
    create policy "Allow update own config"
      on public.dashboard_configs
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;


