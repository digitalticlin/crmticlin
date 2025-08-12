-- Overloads para compatibilidade com chamadas RPC do Supabase
-- Cria duas versões de public.pgmq_send para aceitar nome/ordem diferentes

create extension if not exists pgmq cascade;

-- Versão 1: (queue_name text, msg jsonb) com nomes exatos
drop function if exists public.pgmq_send(queue_name text, msg jsonb) cascade;
create or replace function public.pgmq_send(
  queue_name text,
  msg jsonb
) returns bigint
language plpgsql
security definer
volatile
set search_path = public, pgmq
as $$
declare v_id bigint;
begin
  v_id := pgmq.send(queue_name, msg);
  return v_id;
end;
$$;

-- Versão 2: (msg jsonb, queue_name text) para atender a resolução por nomes usada pelo client
drop function if exists public.pgmq_send(msg jsonb, queue_name text) cascade;
create or replace function public.pgmq_send(
  msg jsonb,
  queue_name text
) returns bigint
language plpgsql
security definer
volatile
set search_path = public, pgmq
as $$
declare v_id bigint;
begin
  v_id := pgmq.send(queue_name, msg);
  return v_id;
end;
$$;

grant execute on function public.pgmq_send(queue_name text, msg jsonb) to service_role;
grant execute on function public.pgmq_send(msg jsonb, queue_name text) to service_role;


