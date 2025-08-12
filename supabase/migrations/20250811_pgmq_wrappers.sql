-- Garante a extensão e cria wrappers estáveis no schema public

create extension if not exists pgmq cascade;

-- Wrapper para enviar mensagens
drop function if exists public.pgmq_send(text, jsonb) cascade;
create or replace function public.pgmq_send(
  queue_name text,
  msg jsonb
) returns bigint
language plpgsql
security definer
stable
as $$
begin
  -- chamada posicional para evitar problemas com nomes de parâmetros
  return pgmq.send(queue_name, msg);
end;
$$;

-- Wrapper para ler mensagens
drop function if exists public.pgmq_read(text, integer, integer) cascade;
create or replace function public.pgmq_read(
  p_queue_name text,
  p_vt integer,
  p_qty integer
) returns table (
  msg_id bigint,
  read_ct integer,
  enqueued_at timestamptz,
  vt_at timestamptz,
  message jsonb
)
language plpgsql
security definer
stable
as $$
begin
  return query
  select r.msg_id, r.read_ct, r.enqueued_at, r.vt, r.message
  from pgmq.read(p_queue_name, p_vt, p_qty) as r(msg_id bigint, read_ct integer, enqueued_at timestamptz, vt timestamptz, message jsonb);
end;
$$;

-- Wrapper para deletar mensagens
drop function if exists public.pgmq_delete(text, bigint) cascade;
create or replace function public.pgmq_delete(
  queue_name text,
  msg_id bigint
) returns void
language plpgsql
security definer
stable
as $$
begin
  perform pgmq.delete(queue_name, msg_id);
end;
$$;

-- Permissões (ajuste conforme sua política)
grant execute on function public.pgmq_send(text, jsonb)  to service_role;
grant execute on function public.pgmq_read(text, integer, integer) to service_role;
grant execute on function public.pgmq_delete(text, bigint) to service_role;


