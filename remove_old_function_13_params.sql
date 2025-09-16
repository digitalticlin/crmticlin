-- ================================================================
-- 🧹 REMOVER FUNÇÃO ANTIGA COM 13 PARÂMETROS
-- ================================================================

-- Remover a versão antiga sem source_edge (13 params)
DROP FUNCTION IF EXISTS public.save_received_message_webhook(
    p_vps_instance_id UUID,
    p_phone TEXT,
    p_message_text TEXT,
    p_from_me BOOLEAN,
    p_media_type TEXT,
    p_media_url TEXT,
    p_external_message_id TEXT,
    p_contact_name TEXT,
    p_profile_pic_url TEXT,
    p_base64_data TEXT,
    p_mime_type TEXT,
    p_file_name TEXT,
    p_whatsapp_number_id UUID
);

-- Verificar que restou apenas 1 (com 14 params)
SELECT 
    '✅ DEVE RESTAR APENAS 1 FUNÇÃO' as status,
    COUNT(*) as total_funcoes,
    array_agg(pronargs) as params_count
FROM pg_proc
WHERE proname = 'save_received_message_webhook'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');