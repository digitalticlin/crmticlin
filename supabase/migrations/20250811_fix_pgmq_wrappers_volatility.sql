-- Ajusta volatilidade dos wrappers do PGMQ para permitir escrita
-- send/delete fazem DML, portanto precisam ser VOLATILE

create extension if not exists pgmq cascade;

-- pgmq_send (VOLATILE)
drop function if exists public.pgmq_send(text, jsonb) cascade;
create or replace function public.pgmq_send(
  p_queue_name text,
  p_msg jsonb
) returns bigint
language plpgsql
security definer
volatile
set search_path = public, pgmq
as $$
declare
  v_msg_id bigint;
begin
  -- chamada posicional ao PGMQ
  v_msg_id := pgmq.send(p_queue_name, p_msg);
  return v_msg_id;
end;
$$;

-- pgmq_delete (VOLATILE)
drop function if exists public.pgmq_delete(text, bigint) cascade;
create or replace function public.pgmq_delete(
  p_queue_name text,
  p_msg_id bigint
) returns void
language plpgsql
security definer
volatile
set search_path = public, pgmq
as $$
begin
  perform pgmq.delete(p_queue_name, p_msg_id);
end;
$$;

-- pgmq_read pode permanecer STABLE (somente SELECT)
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
set search_path = public, pgmq
as $$
begin
  return query
  select r.msg_id, r.read_ct, r.enqueued_at, r.vt, r.message
  from pgmq.read(p_queue_name, p_vt, p_qty) as r(msg_id bigint, read_ct integer, enqueued_at timestamptz, vt timestamptz, message jsonb);
end;
$$;

-- Permissões
grant execute on function public.pgmq_send(text, jsonb)  to service_role;
grant execute on function public.pgmq_read(text, integer, integer) to service_role;
grant execute on function public.pgmq_delete(text, bigint) to service_role;


