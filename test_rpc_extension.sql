-- Teste para verificar se a migração V3_URGENT foi aplicada corretamente

-- 1. Testar função helper
SELECT get_file_extension_from_mime('audio/ogg; codecs=opus', 'audio') as audio_ogg;
SELECT get_file_extension_from_mime('application/pdf', 'document') as pdf;
SELECT get_file_extension_from_mime('image/jpeg', 'image') as image_jpg;
SELECT get_file_extension_from_mime('video/mp4', 'video') as video_mp4;

-- 2. Verificar se a função RPC tem 15 parâmetros
SELECT
    proname,
    pronargs as num_params,
    pg_get_function_arguments(oid) as params
FROM pg_proc
WHERE proname = 'save_received_message_webhook'
  AND pronamespace = 'public'::regnamespace;

-- 3. Ver o corpo da função (procurar por 'get_file_extension_from_mime')
SELECT
    proname,
    prosrc LIKE '%get_file_extension_from_mime%' as usa_helper_function
FROM pg_proc
WHERE proname = 'save_received_message_webhook'
  AND pronamespace = 'public'::regnamespace;
