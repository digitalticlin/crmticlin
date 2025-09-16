-- Verificar onde a RPC está tentando usar stage_order

-- Verificar estrutura da tabela kanban_stages
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'kanban_stages'
ORDER BY ordinal_position;