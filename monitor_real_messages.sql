-- ================================================================
-- MONITORAMENTO EM TEMPO REAL DAS MENSAGENS REAIS
-- ================================================================

-- 🎯 ACOMPANHAR MENSAGENS CHEGANDO EM TEMPO REAL
-- 📱 IDs reais: whatsapp_number_id: c3b6cfe7-bc4e-4b1f-9f18-4573f4232785

-- ================================================================
-- 📊 1. STATUS ATUAL DO SISTEMA
-- ================================================================

-- 1.1 Verificar instância real
SELECT 
    '🔍 INSTÂNCIA WHATSAPP REAL' as categoria,
    id,
    vps_instance_id,
    created_by_user_id,
    instance_name,
    phone_number,
    status,
    created_at
FROM whatsapp_instances 
WHERE id = 'c3b6cfe7-bc4e-4b1f-9f18-4573f4232785'::UUID;

-- 1.2 Verificar lead associado ao telefone de teste
SELECT 
    '👤 LEAD DE TESTE' as categoria,
    id,
    name,
    phone,
    last_message,
    last_message_time,
    unread_count,
    created_at
FROM leads 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID
AND whatsapp_number_id = 'c3b6cfe7-bc4e-4b1f-9f18-4573f4232785'::UUID
ORDER BY last_message_time DESC
LIMIT 5;

-- ================================================================
-- 📱 2. MENSAGENS RECENTES (ÚLTIMOS 5 MINUTOS)
-- ================================================================

SELECT 
    '📨 MENSAGENS RECENTES (5min)' as categoria,
    id,
    text,
    media_type,
    from_me,
    CASE 
        WHEN media_url IS NULL AND media_type = 'text' THEN '✅ Texto direto'
        WHEN media_url IS NULL AND media_type != 'text' THEN '🔄 Mídia na fila'
        WHEN media_url LIKE 'data:%' THEN '🔄 Base64 (processando)'
        WHEN media_url LIKE 'https://%.supabase.co/storage/%' THEN '✅ Storage URL'
        ELSE '❓ Status desconhecido'
    END as status_media,
    external_message_id,
    import_source,
    created_at,
    CASE 
        WHEN from_me THEN '📤 ENVIADO'
        ELSE '📥 RECEBIDO'
    END as direcao
FROM messages 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID
AND whatsapp_number_id = 'c3b6cfe7-bc4e-4b1f-9f18-4573f4232785'::UUID
AND created_at > now() - interval '5 minutes'
ORDER BY created_at DESC;

-- ================================================================
-- 📦 3. STATUS DAS FILAS
-- ================================================================

SELECT 
    '📦 FILAS DE PROCESSAMENTO' as categoria,
    queue_name,
    (pgmq.metrics(queue_name)).queue_length as mensagens_pendentes,
    (pgmq.metrics(queue_name)).total_messages as total_processadas
FROM (
    VALUES 
        ('webhook_message_queue'),
        ('app_message_queue'),
        ('ai_message_queue')
) AS queues(queue_name)
WHERE EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'pgmq' 
    AND tablename = 'q_' || queues.queue_name
);

-- ================================================================
-- 🔄 4. CONTROLE DE PROCESSAMENTO DE MÍDIA
-- ================================================================

SELECT 
    '🎬 PROCESSAMENTO DE MÍDIA' as categoria,
    qpc.id,
    qpc.queue_name,
    qpc.message_id,
    qpc.external_message_id,
    qpc.message_type,
    qpc.processing_status,
    qpc.source_edge,
    qpc.started_at,
    qpc.completed_at,
    CASE 
        WHEN qpc.processing_status = 'completed' THEN '✅ Processado'
        WHEN qpc.processing_status = 'processing' THEN '🔄 Processando'
        WHEN qpc.processing_status = 'failed' THEN '❌ Falhou'
        ELSE '❓ Status desconhecido'
    END as status_visual,
    qpc.error_message
FROM queue_processing_control qpc
WHERE qpc.started_at > now() - interval '10 minutes'
ORDER BY qpc.started_at DESC;

-- ================================================================
-- 📊 5. RESUMO POR TIPO DE MÍDIA (ÚLTIMOS 10 MINUTOS)
-- ================================================================

SELECT 
    '📊 RESUMO POR MÍDIA' as categoria,
    media_type,
    from_me,
    COUNT(*) as total_mensagens,
    COUNT(CASE WHEN media_url IS NULL AND media_type != 'text' THEN 1 END) as aguardando_processamento,
    COUNT(CASE WHEN media_url LIKE 'https://%' THEN 1 END) as com_storage_url,
    MAX(created_at) as ultima_mensagem
FROM messages 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID
AND whatsapp_number_id = 'c3b6cfe7-bc4e-4b1f-9f18-4573f4232785'::UUID
AND created_at > now() - interval '10 minutes'
GROUP BY media_type, from_me
ORDER BY media_type, from_me;

-- ================================================================
-- 🎯 6. MENSAGENS COM PROBLEMAS
-- ================================================================

SELECT 
    '⚠️ MENSAGENS COM PROBLEMAS' as categoria,
    id,
    text,
    media_type,
    media_url,
    external_message_id,
    created_at,
    CASE 
        WHEN text = 'Mensagem não suportada' THEN 'Tipo não suportado'
        WHEN media_type != 'text' AND media_url IS NULL AND created_at < now() - interval '2 minutes' THEN 'Mídia não processada'
        WHEN text IS NULL OR text = '' THEN 'Texto vazio'
        ELSE 'Outro problema'
    END as tipo_problema
FROM messages 
WHERE created_by_user_id = '712e7708-2299-4a00-9128-577c8f113ca4'::UUID
AND whatsapp_number_id = 'c3b6cfe7-bc4e-4b1f-9f18-4573f4232785'::UUID
AND created_at > now() - interval '10 minutes'
AND (
    text = 'Mensagem não suportada' OR
    text = '[Mensagem não suportada]' OR
    (media_type != 'text' AND media_url IS NULL AND created_at < now() - interval '2 minutes') OR
    text IS NULL OR text = ''
);

-- ================================================================
-- ✅ INSTRUÇÕES PARA TESTE
-- ================================================================

SELECT 
    '📝 INSTRUÇÕES PARA TESTE' as resultado,
    jsonb_build_object(
        '1_enviar_texto', 'Envie uma mensagem de texto normal',
        '2_enviar_imagem', 'Envie uma imagem qualquer',
        '3_enviar_video', 'Envie um vídeo curto',
        '4_enviar_audio', 'Envie um áudio/voice',
        '5_enviar_documento', 'Envie um documento (PDF, DOC, etc)',
        '6_enviar_sticker', 'Envie um sticker/figurinha',
        'reexecute_este_arquivo', 'Execute este arquivo após cada mensagem para monitorar',
        'ativar_workers', 'Se mídia ficar na fila, execute os workers'
    ) as instrucoes;