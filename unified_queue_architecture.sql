-- =====================================================================
-- 🚀 ARQUITETURA UNIFICADA DE FILAS PGMQ PARA ESCALABILIDADE
-- =====================================================================
-- Garantir que TODAS as 3 Edge Functions operem em fila para:
-- 1. Escalabilidade máxima
-- 2. Resiliência a falhas
-- 3. Processamento assíncrono de mídia
-- 4. Uniformidade de comportamento
-- =====================================================================

-- 🎯 MAPEAMENTO ATUAL DAS FILAS PGMQ:

-- ✅ EXISTENTE: media_processing_queue (webhook_whatsapp_web - parcial)
-- ✅ EXISTENTE: message_sending_queue (whatsapp_messaging_service)
-- ❌ FALTANDO: ai_media_processing_queue (ai_messaging_service)
-- ❌ FALTANDO: webhook_media_queue (webhook_whatsapp_web - todos vídeos)

-- =====================================================================

-- 1️⃣ VERIFICAR FILAS EXISTENTES NO PGMQ
SELECT 
    'FILAS PGMQ EXISTENTES:' as status,
    queue_name,
    created_at,
    is_partitioned
FROM pgmq.meta() 
ORDER BY queue_name;

-- =====================================================================

-- 2️⃣ CRIAR NOVAS FILAS NECESSÁRIAS PARA UNIFICAÇÃO

-- Fila específica para AI messaging (mídia e envio)
SELECT pgmq.create('ai_media_processing_queue');

-- Fila específica para webhook mídia (forçar TODOS vídeos na fila)
SELECT pgmq.create('webhook_media_queue');

-- Fila unificada para todas as mídias (fallback universal)
SELECT pgmq.create('unified_media_queue');

-- =====================================================================

-- 3️⃣ ESTRUTURA PADRÃO DE MENSAGEM NA FILA
/*
📋 FORMATO PADRÃO PARA TODAS AS FILAS DE MÍDIA:

{
  "type": "process_media",
  "source": "webhook_whatsapp_web|whatsapp_messaging_service|ai_messaging_service",
  "messageId": "uuid-da-mensagem",
  "mediaData": {
    "base64Data": "base64-content", 
    "mediaType": "video|image|audio|document",
    "fileName": "nome-arquivo",
    "externalMessageId": "id-externo",
    "caption": "legenda-se-houver"
  },
  "priority": "high|normal|low",
  "timestamp": "2025-09-11T19:00:00Z",
  "retryCount": 0,
  "maxRetries": 3,
  "processingConfig": {
    "forceStorage": true,
    "generateThumbnail": false,
    "compressVideo": false
  }
}
*/

-- =====================================================================

-- 4️⃣ PROBLEMAS IDENTIFICADOS POR EDGE FUNCTION

-- WEBHOOK_WHATSAPP_WEB:
-- ❌ PROBLEMA: 93% vídeos falham no processamento síncrono
-- ✅ SOLUÇÃO: Forçar TODOS vídeos para fila (não só grandes)

SELECT 
    'WEBHOOK - VÍDEOS SEM PROCESSAMENTO:' as problema,
    COUNT(*) as total_videos_sem_url,
    COUNT(*) * 100.0 / (SELECT COUNT(*) FROM messages WHERE media_type = 'video' AND import_source = 'realtime') as percentual_falha
FROM messages
WHERE media_type = 'video' 
AND media_url IS NULL 
AND import_source = 'realtime'
AND created_at > now() - interval '7 days';

-- WHATSAPP_MESSAGING_SERVICE:
-- ✅ BOM: Upload síncrono funciona
-- ❌ PROBLEMA: Pode travar Edge Function com vídeos grandes

-- AI_MESSAGING_SERVICE:
-- ❌ PROBLEMA: Não usa fila, processamento síncrono apenas
-- ❌ PROBLEMA: Pode falhar com mídia grande

-- =====================================================================

-- 5️⃣ CONFIGURAÇÕES DE PERFORMANCE POR TIPO DE MÍDIA

CREATE TABLE IF NOT EXISTS public.media_processing_config (
    media_type TEXT PRIMARY KEY,
    max_sync_size_mb DECIMAL(10,2),
    force_queue BOOLEAN DEFAULT FALSE,
    compression_enabled BOOLEAN DEFAULT FALSE,
    thumbnail_enabled BOOLEAN DEFAULT FALSE,
    priority TEXT DEFAULT 'normal',
    max_retries INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 300
);

-- Configurações por tipo de mídia
INSERT INTO public.media_processing_config (media_type, max_sync_size_mb, force_queue, compression_enabled, priority) VALUES
('video', 2.0, TRUE, TRUE, 'high'),      -- Vídeos: sempre fila, compressão
('image', 5.0, FALSE, FALSE, 'normal'),  -- Imagens: síncrono até 5MB
('audio', 3.0, FALSE, TRUE, 'normal'),   -- Áudios: síncrono até 3MB
('document', 10.0, FALSE, FALSE, 'low')  -- Docs: síncrono até 10MB
ON CONFLICT (media_type) DO UPDATE SET
    max_sync_size_mb = EXCLUDED.max_sync_size_mb,
    force_queue = EXCLUDED.force_queue,
    compression_enabled = EXCLUDED.compression_enabled,
    priority = EXCLUDED.priority;

-- =====================================================================

-- 6️⃣ MONITORAMENTO DE FILAS

-- Função para monitorar todas as filas de mídia
CREATE OR REPLACE FUNCTION public.monitor_media_queues()
RETURNS TABLE (
    queue_name TEXT,
    total_messages BIGINT,
    pending_messages BIGINT,
    failed_messages BIGINT,
    avg_processing_time_seconds NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.queue_name,
        m.total_messages,
        COALESCE(pending.count, 0) as pending_messages,
        COALESCE(failed.count, 0) as failed_messages,
        COALESCE(avg_time.avg_seconds, 0) as avg_processing_time_seconds
    FROM pgmq.meta() m
    LEFT JOIN (
        SELECT queue_name, COUNT(*) as count
        FROM pgmq.metrics_all()
        WHERE read_ct = 0
        GROUP BY queue_name
    ) pending ON m.queue_name = pending.queue_name
    LEFT JOIN (
        SELECT queue_name, COUNT(*) as count  
        FROM pgmq.metrics_all()
        WHERE read_ct >= 3
        GROUP BY queue_name
    ) failed ON m.queue_name = failed.queue_name
    LEFT JOIN (
        SELECT queue_name, AVG(EXTRACT(epoch FROM (now() - enqueued_at))) as avg_seconds
        FROM pgmq.metrics_all()
        WHERE read_ct > 0
        GROUP BY queue_name
    ) avg_time ON m.queue_name = avg_time.queue_name
    WHERE m.queue_name LIKE '%media%' OR m.queue_name LIKE '%message%';
END;
$$;

-- =====================================================================

-- 7️⃣ PLANO DE MIGRAÇÃO PARA ARQUITETURA UNIFICADA

/*
🎯 FASES DE MIGRAÇÃO:

FASE 1 - CORREÇÃO URGENTE (webhook_whatsapp_web):
✅ Forçar TODOS vídeos para media_processing_queue
✅ Não processar vídeos síncronos (falha 93%)
✅ Aguardar worker processar e atualizar media_url

FASE 2 - PADRONIZAÇÃO (whatsapp_messaging_service):
🔄 Manter upload síncrono para arquivos pequenos
🔄 Usar fila para arquivos > configuração por tipo
🔄 Padronizar campo TEXT com emojis

FASE 3 - EXPANSÃO (ai_messaging_service):
🚀 Implementar processamento em fila
🚀 Usar mesma configuração que outras Edge Functions
🚀 Padronizar campo TEXT com emojis

FASE 4 - OTIMIZAÇÃO:
⚡ Worker dedicado para cada tipo de mídia
⚡ Compressão automática de vídeos
⚡ Thumbnails automáticos
⚡ Retry inteligente por tipo

CRITÉRIOS DE SUCESSO:
- Vídeos: 7% → 100% com media_url
- Performance: <2s para Edge Functions
- Escalabilidade: Suportar 1000+ mídias/hora
- Resiliência: 0% perda de mídia
*/

-- =====================================================================

-- 8️⃣ QUERIES DE VALIDAÇÃO PÓS-IMPLEMENTAÇÃO

-- Verificar se vídeos estão sendo processados corretamente
SELECT 
    'VALIDAÇÃO VÍDEOS APÓS MIGRAÇÃO:' as check_status,
    media_type,
    COUNT(*) as total,
    COUNT(CASE WHEN media_url IS NOT NULL THEN 1 END) as com_url,
    COUNT(CASE WHEN media_url IS NULL THEN 1 END) as sem_url,
    ROUND(COUNT(CASE WHEN media_url IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as percentual_sucesso
FROM messages
WHERE import_source = 'realtime'
AND created_at > now() - interval '1 day'
AND media_type IN ('video', 'image', 'audio', 'document')
GROUP BY media_type
ORDER BY media_type;

-- Verificar campo TEXT padronizado
SELECT 
    'VALIDAÇÃO TEXT APÓS MIGRAÇÃO:' as check_text,
    media_type,
    COUNT(*) as total,
    COUNT(CASE WHEN text ~ '^📷|^🎥|^🎵|^📄|^😊' THEN 1 END) as com_emoji_padrao,
    COUNT(CASE WHEN text = '[Mensagem não suportada]' THEN 1 END) as mensagem_nao_suportada,
    COUNT(CASE WHEN text = '[Sticker]' THEN 1 END) as sticker_text
FROM messages
WHERE import_source = 'realtime'
AND created_at > now() - interval '1 day'
AND media_type IN ('video', 'image', 'audio', 'document')
GROUP BY media_type
ORDER BY media_type;

-- =====================================================================
-- 📋 RESUMO DA ARQUITETURA UNIFICADA
-- =====================================================================
/*
🎯 BENEFÍCIOS DA UNIFICAÇÃO:

1. 📈 ESCALABILIDADE:
   - Edge Functions sempre rápidas (<2s)
   - Workers processam mídia pesada
   - Filas absorvem picos de tráfego

2. 🛡️ RESILIÊNCIA:
   - Retry automático para falhas
   - Zero perda de mídia
   - Monitoramento completo

3. ⚡ PERFORMANCE:
   - Processamento paralelo
   - Compressão inteligente
   - Cache otimizado

4. 🔧 MANUTENÇÃO:
   - Código unificado
   - Configuração centralizada  
   - Debugging simplificado

IMPACTO:
- webhook_whatsapp_web: 93% → 100% vídeos processados
- whatsapp_messaging_service: Mantém performance atual
- ai_messaging_service: Ganha processamento robusto de mídia
- Sistema: Preparado para escala enterprise
*/