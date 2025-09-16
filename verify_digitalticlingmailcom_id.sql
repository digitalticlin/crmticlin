-- ================================================================
-- 🔍 VERIFICAR SE digitalticlingmailcom EXISTE COMO ID
-- ================================================================

-- 1️⃣ Buscar exatamente como a Edge Function faz
SELECT 
    '🔍 BUSCA EXATA DA EDGE FUNCTION' as busca,
    id,
    created_by_user_id,
    name,
    phone,
    vps_instance_id,
    connection_status
FROM public.whatsapp_instances
WHERE id = 'digitalticlingmailcom'::text;

-- 2️⃣ Ver todos os registros para identificar o problema
SELECT 
    '📋 TODOS OS REGISTROS whatsapp_instances' as info,
    id,
    created_by_user_id,
    name,
    phone,
    vps_instance_id,
    connection_status,
    created_at
FROM public.whatsapp_instances
ORDER BY created_at DESC
LIMIT 10;

-- 3️⃣ Buscar por qualquer campo que contenha digitalticling
SELECT 
    '🕵️ BUSCA POR digitalticling EM QUALQUER CAMPO' as busca_ampla,
    id,
    created_by_user_id,
    name,
    phone,
    vps_instance_id
FROM public.whatsapp_instances
WHERE id::text ILIKE '%digitalticling%'
   OR name ILIKE '%digitalticling%'
   OR phone ILIKE '%digitalticling%'
   OR vps_instance_id ILIKE '%digitalticling%';

-- 4️⃣ Se não encontrar, criar o registro correto
INSERT INTO public.whatsapp_instances (
    id,
    created_by_user_id,
    name,
    vps_instance_id,
    connection_status,
    web_status,
    created_at,
    updated_at
)
VALUES (
    'digitalticlingmailcom'::text,  -- ID como string (não UUID)
    '712e7708-2299-4a00-9128-577c8f113ca4'::uuid,
    'digitalticlingmailcom',
    'digitalticlingmailcom',
    'connected',
    'connected',
    now(),
    now()
)
ON CONFLICT (id) DO UPDATE SET
    created_by_user_id = EXCLUDED.created_by_user_id,
    name = EXCLUDED.name,
    vps_instance_id = EXCLUDED.vps_instance_id,
    connection_status = EXCLUDED.connection_status,
    web_status = EXCLUDED.web_status,
    updated_at = now();

-- 5️⃣ Verificar se agora existe
SELECT 
    '✅ VERIFICAÇÃO FINAL' as resultado,
    id,
    created_by_user_id,
    name,
    CASE 
        WHEN id = 'digitalticlingmailcom' THEN '✅ ID CORRETO'
        ELSE '❌ ID INCORRETO'
    END as id_status
FROM public.whatsapp_instances
WHERE id = 'digitalticlingmailcom';