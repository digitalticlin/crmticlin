-- Requer extensão pgmq já instalada no projeto

-- Garantir extensão (caso não exista)
create extension if not exists pgmq cascade;

-- Criar fila se não existir (ignora erro se já existir)
do $$
begin
  perform pgmq_create('ai_message_consult_queue');
exception when others then
  -- se já existir, ignorar
  null;
end $$;

-- Índices de performance para consultas do histórico
create index if not exists idx_messages_lead_timestamp on public.messages (lead_id, timestamp desc);
create index if not exists idx_messages_user_lead_timestamp on public.messages (created_by_user_id, lead_id, timestamp desc);
create index if not exists idx_leads_user_instance_phone on public.leads (created_by_user_id, whatsapp_number_id, phone);

-- Funções auxiliares PGMQ já existem no projeto (pgmq_send, pgmq_read, pgmq_delete)
-- Caso seja necessário garantir permissões:
-- grant usage on schema public to anon, authenticated;
-- grant execute on function pgmq_send(text, jsonb) to service_role;
-- grant execute on function pgmq_read(text, integer, integer) to service_role;
-- grant execute on function pgmq_delete(text, bigint) to service_role;


