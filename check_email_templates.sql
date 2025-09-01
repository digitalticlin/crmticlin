-- Verificar templates de email existentes no Supabase Auth
-- Execute este comando no SQL Editor do Supabase Dashboard

-- Verificar se a tabela auth.email_templates existe
SELECT 
  table_schema, 
  table_name,
  'auth.email_templates table exists' as status
FROM information_schema.tables 
WHERE table_schema = 'auth' AND table_name = 'email_templates'

UNION ALL

-- Verificar templates existentes (se a tabela existir)
SELECT 
  'auth' as table_schema,
  'email_templates' as table_name,
  CONCAT('Template found: ', template_name, ' | Subject: ', left(subject, 50), '...') as status
FROM auth.email_templates
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'auth' AND table_name = 'email_templates'
);

-- Verificar configurações de auth
SELECT 
  'auth' as table_schema,
  'config' as table_name,
  'Auth config table exists - check Dashboard for SMTP settings' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'auth' AND table_name = 'config'
);

-- Verificar colunas da tabela profiles relacionadas a convites
SELECT 
  column_name,
  data_type,
  is_nullable,
  CONCAT('profiles.', column_name, ' (', data_type, ')') as status
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
  AND column_name LIKE '%invite%'
ORDER BY column_name;