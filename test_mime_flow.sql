-- 🧪 Teste completo do fluxo MIME type → extensão

-- 1️⃣ Testar helper function com diferentes MIME types
SELECT
    'audio/ogg; codecs=opus' as mime_type,
    'audio' as media_type,
    get_file_extension_from_mime('audio/ogg; codecs=opus', 'audio') as extension_result,
    'ESPERADO: ogg' as expected;

SELECT
    'application/pdf' as mime_type,
    'document' as media_type,
    get_file_extension_from_mime('application/pdf', 'document') as extension_result,
    'ESPERADO: pdf' as expected;

SELECT
    'video/mp4' as mime_type,
    'video' as media_type,
    get_file_extension_from_mime('video/mp4', 'video') as extension_result,
    'ESPERADO: mp4' as expected;

SELECT
    'image/jpeg' as mime_type,
    'image' as media_type,
    get_file_extension_from_mime('image/jpeg', 'image') as extension_result,
    'ESPERADO: jpg' as expected;

-- 2️⃣ Testar com MIME NULL (fallback para media_type)
SELECT
    NULL as mime_type,
    'audio' as media_type,
    get_file_extension_from_mime(NULL, 'audio') as extension_result,
    'ESPERADO: ogg (fallback)' as expected;

-- 3️⃣ Verificar se a função RPC existe e tem o helper
SELECT
    proname as function_name,
    pronargs as param_count,
    prosrc LIKE '%get_file_extension_from_mime%' as uses_helper,
    prosrc LIKE '%v_file_extension%' as has_extension_var
FROM pg_proc
WHERE proname = 'save_received_message_webhook'
  AND pronamespace = 'public'::regnamespace;

-- 4️⃣ Testar construção do file_path
SELECT
    'webhook/' || '66ae98b4-1c72-49e4-a7e9-ab774db101ec' || '/' || 'ac02ab68-becc-473e-a4f1-a570de6f93e2' || '.' || get_file_extension_from_mime('audio/ogg; codecs=opus', 'audio') as file_path_generated,
    'ESPERADO: webhook/66ae98b4-1c72-49e4-a7e9-ab774db101ec/ac02ab68-becc-473e-a4f1-a570de6f93e2.ogg' as expected;
