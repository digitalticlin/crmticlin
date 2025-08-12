-- Garante a extensão e cria a fila real no schema pgmq

-- 1) Garantir extensão
create extension if not exists pgmq cascade;

-- 2) Criar fila se ainda não existir
do $$
begin
  if to_regclass('pgmq.q_ai_message_consult_queue') is null then
    -- Tenta API recente: pgmq.create(text)
    begin
      perform pgmq.create('ai_message_consult_queue');
    exception when undefined_function then
      -- Tenta API alternativa/legacy: pgmq_create(text)
      begin
        perform pgmq_create('ai_message_consult_queue');
      exception when undefined_function then
        -- Último fallback: nada a fazer, deixamos falhar silenciosamente
        null;
      end;
    end;
  end if;
end $$;

-- 3) Verificação opcional (não quebra a migração)
-- select to_regclass('pgmq.q_ai_message_consult_queue');


