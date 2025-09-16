-- ================================================================
-- 🧹 REMOVER APENAS AS 2 FUNÇÕES OBSOLETAS
-- ================================================================

-- 1️⃣ Remover função com 10 parâmetros (com timestamp, sem whatsapp_number_id)
DROP FUNCTION IF EXISTS public.save_received_message_webhook(
    p_vps_instance_id uuid,
    p_phone text,
    p_message_text text,
    p_from_me boolean,
    p_media_type text,
    p_external_message_id text,
    p_timestamp bigint,
    p_base64_data text,
    p_mime_type text,
    p_file_name text
);

-- 2️⃣ Remover função com 13 parâmetros (ordem alfabética, sem whatsapp_number_id)
DROP FUNCTION IF EXISTS public.save_received_message_webhook(
    p_vps_instance_id uuid,
    p_phone text,
    p_message_text text,
    p_from_me boolean,
    p_media_type text,
    p_external_message_id text,
    p_timestamp bigint,
    p_base64_data text,
    p_mime_type text,
    p_file_name text,
    p_contact_name text,
    p_media_url text,
    p_profile_pic_url text
);

-- ✅ MANTER APENAS ESTA (que a Edge Function usa):
-- p_vps_instance_id uuid, p_phone text, p_message_text text, p_from_me boolean, 
-- p_media_type text, p_media_url text, p_external_message_id text, p_contact_name text, 
-- p_profile_pic_url text, p_base64_data text, p_mime_type text, p_file_name text, p_whatsapp_number_id uuid

-- Verificar que restou apenas 1
SELECT 
    '✅ DEVE RESTAR APENAS 1 FUNÇÃO' as status,
    COUNT(*) as total_funcoes,
    array_agg(pronargs) as params_count
FROM pg_proc
WHERE proname = 'save_received_message_webhook'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');