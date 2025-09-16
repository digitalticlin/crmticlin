-- ================================================================
-- ANÁLISE DE PADRÕES DE SALVAMENTO DE MENSAGENS
-- ================================================================

-- 1. AMOSTRA DE CADA TIPO DE MÍDIA COM PROBLEMAS
WITH message_samples AS (
    SELECT 
        id,
        lead_id,
        text,
        media_type,
        media_url,
        from_me,
        external_message_id,
        ai_description,
        created_at,
        CASE 
            WHEN media_url IS NULL AND media_type != 'text' THEN 'PROBLEMA: Mídia sem URL'
            WHEN text = '[Mensagem não suportada]' THEN 'PROBLEMA: Mensagem não suportada'
            WHEN media_url LIKE 'data:%' THEN 'PROBLEMA: Base64 na media_url'
            WHEN media_url LIKE '%supabase%/storage%' THEN 'OK: Storage URL'
            WHEN media_type = 'text' AND media_url IS NULL THEN 'OK: Texto sem mídia'
            ELSE 'VERIFICAR'
        END as status_salvamento
    FROM messages
    WHERE created_at > NOW() - INTERVAL '7 days'
)
SELECT 
    media_type,
    status_salvamento,
    COUNT(*) as total,
    array_agg(DISTINCT 
        jsonb_build_object(
            'id', id,
            'text', LEFT(text, 50),
            'media_url', CASE 
                WHEN media_url LIKE 'data:%' THEN 'data:...(base64)'
                ELSE LEFT(media_url, 100)
            END,
            'from_me', from_me
        ) 
        ORDER BY id DESC
    )[:3] as exemplos
FROM message_samples
GROUP BY media_type, status_salvamento
ORDER BY media_type, status_salvamento;

-- 2. ANÁLISE ESPECÍFICA DE VÍDEOS
SELECT 
    'ANÁLISE DE VÍDEOS' as categoria,
    COUNT(*) as total_videos,
    COUNT(CASE WHEN media_url IS NULL THEN 1 END) as videos_sem_url,
    COUNT(CASE WHEN media_url LIKE 'data:%' THEN 1 END) as videos_base64,
    COUNT(CASE WHEN media_url LIKE '%storage%' THEN 1 END) as videos_storage,
    COUNT(CASE WHEN text = '[Mensagem não suportada]' THEN 1 END) as videos_nao_suportados
FROM messages
WHERE media_type = 'video'
AND created_at > NOW() - INTERVAL '7 days';

-- 3. ANÁLISE DE MENSAGENS NÃO SUPORTADAS
SELECT 
    media_type,
    from_me,
    COUNT(*) as total_nao_suportadas,
    array_agg(DISTINCT external_message_id)[:5] as message_ids_exemplo
FROM messages
WHERE text = '[Mensagem não suportada]'
AND created_at > NOW() - INTERVAL '7 days'
GROUP BY media_type, from_me
ORDER BY total_nao_suportadas DESC;

-- 4. PADRÕES DE SALVAMENTO POR TIPO DE MÍDIA
SELECT 
    media_type,
    from_me,
    CASE 
        WHEN media_url IS NULL THEN 'sem_url'
        WHEN media_url LIKE 'data:image%' THEN 'base64_image'
        WHEN media_url LIKE 'data:video%' THEN 'base64_video'
        WHEN media_url LIKE 'data:audio%' THEN 'base64_audio'
        WHEN media_url LIKE 'data:application%' THEN 'base64_document'
        WHEN media_url LIKE '%storage.googleapis%' THEN 'google_storage'
        WHEN media_url LIKE '%supabase%/storage%' THEN 'supabase_storage'
        WHEN media_url LIKE 'http%' THEN 'url_externa'
        ELSE 'outro'
    END as tipo_storage,
    COUNT(*) as total,
    MAX(created_at) as ultima_mensagem
FROM messages
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY media_type, from_me, tipo_storage
ORDER BY media_type, from_me, total DESC;

-- 5. VERIFICAR TABELA MEDIA_CACHE
SELECT 
    'ANÁLISE MEDIA_CACHE' as categoria,
    COUNT(*) as total_registros,
    COUNT(DISTINCT message_id) as mensagens_unicas,
    COUNT(CASE WHEN base64_data IS NOT NULL THEN 1 END) as com_base64,
    COUNT(CASE WHEN cached_url LIKE '%storage%' THEN 1 END) as com_storage_url,
    COUNT(CASE WHEN processing_status = 'completed' THEN 1 END) as processamento_completo,
    COUNT(CASE WHEN processing_status = 'pending' THEN 1 END) as processamento_pendente,
    COUNT(CASE WHEN processing_status = 'failed' THEN 1 END) as processamento_falhou
FROM media_cache
WHERE created_at > NOW() - INTERVAL '7 days';

-- 6. RELACIONAMENTO MESSAGES x MEDIA_CACHE
SELECT 
    m.media_type,
    COUNT(DISTINCT m.id) as total_mensagens,
    COUNT(DISTINCT mc.message_id) as com_cache,
    COUNT(DISTINCT m.id) - COUNT(DISTINCT mc.message_id) as sem_cache,
    ROUND(
        (COUNT(DISTINCT mc.message_id)::numeric / NULLIF(COUNT(DISTINCT m.id), 0)) * 100, 
        2
    ) as percentual_com_cache
FROM messages m
LEFT JOIN media_cache mc ON m.id = mc.message_id
WHERE m.created_at > NOW() - INTERVAL '7 days'
AND m.media_type != 'text'
GROUP BY m.media_type
ORDER BY m.media_type;

-- 7. AMOSTRA REAL DE MENSAGENS (ÚLTIMAS 20)
SELECT 
    id,
    lead_id,
    LEFT(text, 100) as text_preview,
    media_type,
    CASE 
        WHEN media_url IS NULL THEN 'NULL'
        WHEN media_url LIKE 'data:%' THEN 'BASE64_DATA'
        WHEN media_url LIKE '%storage%' THEN 'STORAGE_URL'
        ELSE 'OTHER_URL'
    END as url_type,
    from_me,
    created_at
FROM messages
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 20;

-- 8. DIAGNÓSTICO DO PROBLEMA PRINCIPAL
SELECT 
    'DIAGNÓSTICO' as analise,
    jsonb_build_object(
        'problema_videos', (
            SELECT COUNT(*) 
            FROM messages 
            WHERE media_type = 'video' 
            AND (media_url IS NULL OR media_url NOT LIKE '%storage%')
            AND created_at > NOW() - INTERVAL '7 days'
        ),
        'problema_mensagens_nao_suportadas', (
            SELECT COUNT(*) 
            FROM messages 
            WHERE text = '[Mensagem não suportada]'
            AND created_at > NOW() - INTERVAL '7 days'
        ),
        'problema_base64_direto', (
            SELECT COUNT(*) 
            FROM messages 
            WHERE media_url LIKE 'data:%'
            AND created_at > NOW() - INTERVAL '7 days'
        ),
        'total_sem_storage', (
            SELECT COUNT(*) 
            FROM messages 
            WHERE media_type != 'text'
            AND (media_url IS NULL OR media_url NOT LIKE '%storage%')
            AND created_at > NOW() - INTERVAL '7 days'
        )
    ) as problemas_encontrados;