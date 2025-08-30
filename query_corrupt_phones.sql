
SELECT 
  id,
  name,
  phone,
  created_at,
  import_source,
  updated_at
FROM leads 
WHERE phone ~ '^107|^10[^0-9]|length(phone) > 15|phone ~ '^[^5]'
ORDER BY created_at DESC 
LIMIT 10;

