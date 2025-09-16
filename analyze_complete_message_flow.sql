-- =====================================================================
-- 🔍 ANÁLISE COMPLETA DO FLUXO DE MENSAGENS
-- =====================================================================
-- Analisar RPC + Edge Function + Storage para entender o problema dos vídeos
-- =====================================================================

-- 1️⃣ OBTER CÓDIGO FONTE DA FUNÇÃO RPC ATUAL
SELECT 
    'FUNÇÃO RPC ATUAL - save_whatsapp_message_service_role:' as info,
    pg_get_functiondef(p.oid) as codigo_fonte_completo
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'save_whatsapp_message_service_role';

-- =====================================================================

-- 2️⃣ ANALISAR PARÂMETROS DA FUNÇÃO RPC
SELECT 
    'PARÂMETROS DA FUNÇÃO RPC:' as info,
    p.ordinal_position as posicao,
    p.parameter_name as nome_parametro,
    p.data_type as tipo,
    p.parameter_default as valor_padrao,
    p.parameter_mode as modo
FROM information_schema.parameters p
WHERE p.specific_schema = 'public'
AND p.specific_name IN (
    SELECT r.specific_name
    FROM information_schema.routines r
    WHERE r.routine_schema = 'public'
    AND r.routine_name = 'save_whatsapp_message_service_role'
)
ORDER BY p.ordinal_position;

-- =====================================================================

-- 3️⃣ COMPARAR PROCESSAMENTO DE MÍDIA POR TIPO
SELECT 
    'ANÁLISE DE PROCESSAMENTO POR TIPO DE MÍDIA:' as analise,
    media_type,
    COUNT(*) as total_mensagens,
    COUNT(CASE WHEN media_url IS NOT NULL THEN 1 END) as com_media_url,
    COUNT(CASE WHEN media_url IS NULL THEN 1 END) as sem_media_url,
    ROUND(COUNT(CASE WHEN media_url IS NOT NULL THEN 1 END)::numeric * 100.0 / COUNT(*), 2) as percentual_com_url,
    
    -- Análise do campo TEXT
    COUNT(CASE WHEN text ~ '^📷|^🎥|^🎵|^📄|^😊|^🎤' THEN 1 END) as com_emoji_padrao,
    COUNT(CASE WHEN text = '[Mensagem não suportada]' THEN 1 END) as mensagem_nao_suportada,
    COUNT(CASE WHEN text = '[Sticker]' THEN 1 END) as sticker_text,
    COUNT(CASE WHEN text IS NULL OR text = '' THEN 1 END) as text_vazio,
    
    -- Exemplos de texto
    array_agg(DISTINCT substring(text, 1, 50)) FILTER (WHERE text IS NOT NULL) as exemplos_text
FROM messages
WHERE import_source = 'realtime'
  AND created_at > now() - interval '7 days'
  AND media_type IN ('image', 'video', 'audio', 'document')
GROUP BY media_type
ORDER BY media_type;

-- =====================================================================

-- 4️⃣ ANALISAR TABELA MEDIA_CACHE
SELECT 
    'ANÁLISE DA TABELA MEDIA_CACHE:' as info,
    COUNT(*) as total_registros_cache,
    COUNT(CASE WHEN cached_url IS NOT NULL THEN 1 END) as com_cached_url,
    COUNT(CASE WHEN original_url IS NOT NULL THEN 1 END) as com_original_url,
    COUNT(CASE WHEN base64_data IS NOT NULL THEN 1 END) as com_base64_data,
    COUNT(CASE WHEN processing_status = 'completed' THEN 1 END) as processamento_completo,
    array_agg(DISTINCT media_type) as tipos_de_midia_no_cache
FROM media_cache mc
WHERE created_at > now() - interval '7 days';

-- Detalhes por tipo de mídia no cache
SELECT 
    'MEDIA_CACHE POR TIPO:' as cache_detalhes,
    mc.media_type,
    COUNT(*) as total_no_cache,
    COUNT(CASE WHEN mc.cached_url LIKE '%supabase%' THEN 1 END) as com_url_storage,
    COUNT(CASE WHEN mc.cached_url LIKE 'data:%' THEN 1 END) as com_base64_url,
    COUNT(CASE WHEN mc.processing_status = 'completed' THEN 1 END) as processados_completos
FROM media_cache mc
WHERE mc.created_at > now() - interval '7 days'
GROUP BY mc.media_type
ORDER BY mc.media_type;

-- =====================================================================

-- 5️⃣ BUSCAR VÍDEOS QUE ESTÃO NO CACHE MAS NÃO TÊM MEDIA_URL NA MESSAGE
SELECT 
    'VÍDEOS: CACHE vs MESSAGE:' as investigacao,
    m.id as message_id,
    m.text as message_text,
    m.media_url as message_media_url,
    mc.cached_url as cache_url,
    mc.processing_status as cache_status,
    m.created_at as message_time,
    mc.created_at as cache_time
FROM messages m
LEFT JOIN media_cache mc ON mc.message_id = m.id
WHERE m.media_type = 'video'
  AND m.import_source = 'realtime'
  AND m.created_at > now() - interval '3 days'
ORDER BY m.created_at DESC
LIMIT 10;

-- =====================================================================

-- 6️⃣ VERIFICAR EXTERNAL_MESSAGE_ID nos vídeos
SELECT 
    'VÍDEOS - EXTERNAL_MESSAGE_ID:' as external_ids,
    COUNT(*) as total_videos,
    COUNT(CASE WHEN external_message_id IS NOT NULL THEN 1 END) as com_external_id,
    COUNT(CASE WHEN external_message_id IS NULL THEN 1 END) as sem_external_id,
    COUNT(CASE WHEN media_url IS NOT NULL THEN 1 END) as com_media_url,
    COUNT(CASE WHEN media_url IS NULL THEN 1 END) as sem_media_url
FROM messages
WHERE media_type = 'video'
  AND import_source = 'realtime'
  AND created_at > now() - interval '7 days';

-- =====================================================================

-- 7️⃣ VERIFICAR ORIGEM DAS MENSAGENS (FROM_ME)
SELECT 
    'ANÁLISE POR ORIGEM (from_me):' as origem,
    media_type,
    from_me,
    COUNT(*) as total,
    COUNT(CASE WHEN media_url IS NOT NULL THEN 1 END) as com_url,
    COUNT(CASE WHEN media_url IS NULL THEN 1 END) as sem_url,
    ROUND(COUNT(CASE WHEN media_url IS NOT NULL THEN 1 END)::numeric * 100.0 / COUNT(*), 2) as perc_com_url
FROM messages
WHERE media_type IN ('image', 'video', 'audio', 'document')
  AND import_source = 'realtime'
  AND created_at > now() - interval '7 days'
GROUP BY media_type, from_me
ORDER BY media_type, from_me;

-- =====================================================================

-- 8️⃣ VERIFICAR INSTÂNCIAS E USUÁRIOS
SELECT 
    'ANÁLISE POR INSTÂNCIA:' as por_instancia,
    wi.vps_instance_id,
    wi.connection_status,
    COUNT(m.*) as total_mensagens,
    COUNT(CASE WHEN m.media_type = 'video' THEN 1 END) as total_videos,
    COUNT(CASE WHEN m.media_type = 'video' AND m.media_url IS NULL THEN 1 END) as videos_sem_url,
    COUNT(CASE WHEN m.media_type = 'image' AND m.media_url IS NOT NULL THEN 1 END) as imagens_com_url
FROM messages m
JOIN whatsapp_instances wi ON wi.id = m.whatsapp_number_id
WHERE m.import_source = 'realtime'
  AND m.created_at > now() - interval '7 days'
  AND m.media_type IN ('image', 'video')
GROUP BY wi.vps_instance_id, wi.connection_status
ORDER BY total_videos DESC;

-- =====================================================================

-- 9️⃣ TIMELINE DAS MENSAGENS DE VÍDEO
SELECT 
    'TIMELINE VÍDEOS - Últimas 24h:' as timeline,
    date_trunc('hour', created_at) as hora,
    COUNT(*) as total_videos,
    COUNT(CASE WHEN media_url IS NOT NULL THEN 1 END) as com_url,
    COUNT(CASE WHEN media_url IS NULL THEN 1 END) as sem_url,
    string_agg(DISTINCT substring(text, 1, 30), ' | ') as exemplos_text
FROM messages
WHERE media_type = 'video'
  AND import_source = 'realtime'
  AND created_at > now() - interval '24 hours'
GROUP BY date_trunc('hour', created_at)
ORDER BY hora DESC;

-- =====================================================================
-- 📋 OBJETIVO DESTA ANÁLISE
-- =====================================================================
/*
🎯 ESTA ANÁLISE VAI REVELAR:

1. 📄 Código fonte completo da função RPC atual
2. 📊 Como cada tipo de mídia está sendo processado
3. 🗃️ Estado da tabela media_cache
4. 🎥 Por que vídeos não têm media_url
5. 🔄 Se o problema é no processamento ou no salvamento
6. 📱 Se afeta apenas vídeos ou outros tipos também
7. 🏢 Se é específico de algumas instâncias
8. 📈 Quando o problema começou

Com estes dados, saberemos exatamente onde fazer a correção cirúrgica!
*/