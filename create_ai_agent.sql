-- SQL para ver todos os campos da tabela ai_agents
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'ai_agents' AND table_schema = 'public'
ORDER BY ordinal_position;

-- SQL para criar o agente de IA
INSERT INTO public.ai_agents (
  name,
  type,
  status,
  funnel_id,
  whatsapp_number_id,
  messages_count,
  created_by_user_id
) VALUES (
  'Agente de Vendas',  -- Altere o nome conforme necessário
  'sales',  -- Opções: 'attendance', 'sales', 'support', 'custom'
  'active',  -- 'active' ou 'inactive'
  'af47dcaa-3981-407c-92c6-0b450fcb5de7',
  '988273f7-819f-4584-b4b4-c60f229d34e2',
  0,
  'e75375eb-37a8-4afa-8fa3-1f13e4855439'
) RETURNING *;