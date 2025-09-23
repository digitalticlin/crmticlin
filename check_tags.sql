-- Verificar estrutura das tabelas de tags
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%tag%';

-- Verificar colunas das tabelas de tags
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('tags', 'lead_tags')
ORDER BY table_name, ordinal_position;

-- Verificar se existem tags no sistema
SELECT COUNT(*) as total_tags FROM public.tags;

-- Verificar se existem relações lead_tags
SELECT COUNT(*) as total_lead_tags FROM public.lead_tags;

-- Mostrar algumas tags de exemplo
SELECT id, name, color FROM public.tags LIMIT 5;

-- Mostrar alguns leads com suas tags
SELECT
    l.id as lead_id,
    l.name as lead_name,
    COUNT(lt.tag_id) as tag_count
FROM public.leads l
LEFT JOIN public.lead_tags lt ON l.id = lt.lead_id
GROUP BY l.id, l.name
HAVING COUNT(lt.tag_id) > 0
LIMIT 5;