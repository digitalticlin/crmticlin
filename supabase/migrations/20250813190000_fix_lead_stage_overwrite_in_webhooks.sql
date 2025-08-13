-- Corrigir sobrescrita indevida do kanban_stage_id nas funções de webhook/mensageria
-- Trocar:  kanban_stage_id = COALESCE(v_stage_id, kanban_stage_id)
-- Por:     kanban_stage_id = COALESCE(kanban_stage_id, v_stage_id)

-- Função 1 (versão otimizada) - ajuste por replace
create or replace function public.save_whatsapp_message_complete(
  p_user_id uuid,
  p_instance_id uuid,
  p_formatted_phone text,
  p_contact_name text,
  p_message_text text,
  p_media_type text,
  p_media_url text,
  p_from_me boolean,
  p_external_message_id text
) returns void as $$
declare
  v_user_id uuid := p_user_id;
  v_instance_id uuid := p_instance_id;
  v_formatted_phone text := p_formatted_phone;
  v_contact_name text := p_contact_name;
  v_message_text text := p_message_text;
  v_media_type text := p_media_type;
  v_media_url text := p_media_url;
  v_funnel_id uuid;
  v_stage_id uuid;
  v_lead_id uuid;
begin
  -- Buscar funil padrão
  select id into v_funnel_id
  from public.funnels
  where created_by_user_id = v_user_id
  order by created_at asc
  limit 1;

  -- Buscar primeiro estágio do funil
  if v_funnel_id is not null then
    select id into v_stage_id
    from public.kanban_stages
    where funnel_id = v_funnel_id
    order by order_position asc
    limit 1;
  end if;

  -- Buscar ou criar lead
  select id into v_lead_id
  from public.leads
  where phone = v_formatted_phone
    and created_by_user_id = v_user_id;

  if v_lead_id is null then
    insert into public.leads (
      phone, name, whatsapp_number_id, created_by_user_id, funnel_id, kanban_stage_id,
      last_message_time, last_message, import_source, unread_count
    ) values (
      v_formatted_phone, v_contact_name, v_instance_id, v_user_id, v_funnel_id, v_stage_id,
      now(), v_message_text, 'realtime', case when p_from_me then 0 else 1 end
    ) returning id into v_lead_id;
  else
    update public.leads
    set
      name = coalesce(nullif(v_contact_name, ''), name),
      whatsapp_number_id = v_instance_id,
      funnel_id = coalesce(v_funnel_id, funnel_id),
      -- Correção AQUI: preservar estágio atual quando já definido
      kanban_stage_id = coalesce(kanban_stage_id, v_stage_id),
      last_message_time = now(),
      last_message = v_message_text,
      unread_count = case when p_from_me then unread_count else coalesce(unread_count,0) + 1 end,
      updated_at = now()
    where id = v_lead_id;
  end if;

  -- Inserir mensagem (implementação original)
  insert into public.messages (
    lead_id, whatsapp_number_id, text, from_me, timestamp, status, created_by_user_id,
    media_type, media_url, import_source, external_message_id
  ) values (
    v_lead_id, v_instance_id, v_message_text, p_from_me, now(),
    case when p_from_me then 'sent'::message_status else 'received'::message_status end,
    v_user_id,
    coalesce(p_media_type::media_type, 'text'::media_type),
    p_media_url,
    'realtime',
    p_external_message_id
  );
end;
$$ language plpgsql security definer;

-- Observação: se existirem outras funções com a mesma lógica, aplicar a mesma troca do COALESCE nelas.


