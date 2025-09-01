-- Buscar o template de "Invite Team" existente no Supabase
-- Execute no SQL Editor do Supabase Dashboard

-- Método 1: Verificar templates na tabela auth.email_templates
SELECT 
  template_name,
  subject,
  length(body) as body_length,
  created_at,
  updated_at
FROM auth.email_templates 
WHERE template_name ILIKE '%invite%' 
   OR subject ILIKE '%team%'
   OR subject ILIKE '%invite%'
ORDER BY template_name;

-- Método 2: Mostrar o template completo (se existir)
SELECT 
  template_name,
  subject,
  body
FROM auth.email_templates 
WHERE template_name = 'invite'
   OR template_name = 'invite_team'
   OR template_name ILIKE '%team%'
LIMIT 1;

-- Método 3: Buscar todas as configurações de template disponíveis
SELECT 
  schemaname,
  tablename,
  'Check this table for email templates' as note
FROM pg_tables 
WHERE schemaname = 'auth' 
  AND (tablename LIKE '%email%' OR tablename LIKE '%template%' OR tablename LIKE '%mail%');

-- Método 4: Verificar metadados do Supabase sobre templates
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'auth' 
  AND table_name = 'email_templates'
ORDER BY ordinal_position;