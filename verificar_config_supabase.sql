-- SQL para investigar configurações do Supabase que podem afetar redirectTo

-- 1. Verificar configurações na tabela instances (pode ter configurações de email)
SELECT 
    'configuracoes_instances' as tipo,
    id,
    uuid,
    raw_base_config::text,
    created_at,
    updated_at
FROM auth.instances;

-- 2. Verificar se existe alguma configuração relacionada a URLs ou email
SELECT 
    'buscar_url_configs' as tipo,
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema IN ('auth', 'public')
AND (
    column_name ILIKE '%url%' OR 
    column_name ILIKE '%redirect%' OR 
    column_name ILIKE '%site%' OR
    column_name ILIKE '%email%' OR
    column_name ILIKE '%template%'
)
ORDER BY table_schema, table_name, column_name;

-- 3. Verificar tabela de configurações se existir
SELECT 
    'tabelas_com_config' as tipo,
    table_schema,
    table_name
FROM information_schema.tables 
WHERE table_name ILIKE '%config%' 
OR table_name ILIKE '%setting%'
ORDER BY table_schema, table_name;