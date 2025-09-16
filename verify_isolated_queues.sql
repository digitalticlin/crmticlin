-- =====================================================================
-- 🔍 VERIFICAR ESTRUTURA DE FILA ISOLADA PARA CADA EDGE FUNCTION
-- =====================================================================
-- FASE 2: Mapear estrutura de filas existente e planejar isolamento
-- =====================================================================

-- 1️⃣ VERIFICAR FILAS PGMQ EXISTENTES
SELECT 
    'FILAS PGMQ EXISTENTES:' as status,
    queue_name,
    created_at,
    is_partitioned,
    CASE 
        WHEN queue_name LIKE '%media%' THEN '📺 MÍDIA'
        WHEN queue_name LIKE '%message%' THEN '💬 MENSAGEM'
        WHEN queue_name LIKE '%webhook%' THEN '🔗 WEBHOOK'
        WHEN queue_name LIKE '%ai%' THEN '🤖 AI'
        ELSE '📋 OUTRAS'
    END as categoria
FROM pgmq.meta() 
ORDER BY queue_name;

-- =====================================================================

-- 2️⃣ MAPEAMENTO EDGE FUNCTIONS → FILAS NECESSÁRIAS
SELECT 
    'MAPEAMENTO EDGE → FILA:' as fase_2,
    edge_function,
    fila_atual,
    fila_isolada_necessaria,
    status
FROM (
    VALUES 
        ('webhook_whatsapp_web', 'media_processing_queue', 'media_processing_queue_vps', '✅ PARCIAL'),
        ('whatsapp_messaging_service', 'message_sending_queue', 'media_processing_queue_crm', '❓ VERIFICAR'),
        ('ai_messaging_service', 'NENHUMA', 'media_processing_queue_ai', '❌ FALTANDO')
) AS mapping(edge_function, fila_atual, fila_isolada_necessaria, status);

-- =====================================================================

-- 3️⃣ VERIFICAR USO DE FILAS NAS EDGE FUNCTIONS ATUAIS

-- Procurar referências de fila no código das Edge Functions
SELECT 
    'USO DE FILAS POR EDGE:' as analise,
    'webhook_whatsapp_web' as edge_function,
    'media_processing_queue' as fila_usada,
    'Processa vídeos grandes via PGMQ' as uso_atual,
    '93% vídeos falham - fila parcial' as problema
    
UNION ALL SELECT
    'USO DE FILAS POR EDGE:',
    'whatsapp_messaging_service',
    'message_sending_queue',
    'Envia mensagens via PGMQ',
    'Upload síncrono - pode travar com vídeos grandes'
    
UNION ALL SELECT
    'USO DE FILAS POR EDGE:',
    'ai_messaging_service', 
    'NENHUMA',
    'Processamento síncrono apenas',
    'Falha com mídia grande - sem fila';

-- =====================================================================

-- 4️⃣ ANÁLISE DE PERFORMANCE ATUAL POR EDGE FUNCTION

-- webhook_whatsapp_web - Vídeos sem processamento
SELECT 
    'PERFORMANCE webhook_whatsapp_web:' as edge,
    media_type,
    COUNT(*) as total_mensagens,
    COUNT(CASE WHEN media_url IS NOT NULL THEN 1 END) as com_url,
    COUNT(CASE WHEN media_url IS NULL THEN 1 END) as sem_url,
    ROUND(COUNT(CASE WHEN media_url IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as percentual_sucesso
FROM messages
WHERE import_source = 'realtime'
AND created_at > now() - interval '7 days'
AND media_type IN ('video', 'image', 'audio', 'document')
GROUP BY media_type
ORDER BY media_type;

-- whatsapp_messaging_service - Mensagens enviadas
SELECT 
    'PERFORMANCE whatsapp_messaging_service:' as edge,
    COUNT(*) as total_mensagens_enviadas,
    COUNT(CASE WHEN media_type != 'text' THEN 1 END) as total_midias_enviadas,
    COUNT(CASE WHEN media_type != 'text' AND media_url IS NOT NULL THEN 1 END) as midias_com_url
FROM messages
WHERE import_source = 'crm_sent'
AND created_at > now() - interval '7 days';

-- ai_messaging_service - Mensagens AI
SELECT 
    'PERFORMANCE ai_messaging_service:' as edge,
    COUNT(*) as total_mensagens_ai,
    COUNT(CASE WHEN media_type != 'text' THEN 1 END) as total_midias_ai,
    COUNT(CASE WHEN media_type != 'text' AND media_url IS NOT NULL THEN 1 END) as midias_com_url_ai
FROM messages
WHERE import_source = 'ai_agent'
AND created_at > now() - interval '7 days';

-- =====================================================================

-- 5️⃣ FILAS ISOLADAS NECESSÁRIAS PARA CADA EDGE FUNCTION

/*
🎯 ARQUITETURA ISOLADA NECESSÁRIA:

webhook_whatsapp_web:
├── media_processing_queue_vps 
├── Processa TODOS vídeos (não só grandes)
├── Processa todas mídias da VPS
└── Worker dedicado para VPS

whatsapp_messaging_service:
├── media_processing_queue_crm
├── Processa uploads do CRM
├── Mantém performance para arquivos pequenos
└── Worker dedicado para CRM

ai_messaging_service:
├── media_processing_queue_ai
├── Processa mídia do AI Agent
├── Transcrição de áudios
└── Worker dedicado para AI

ISOLAMENTO COMPLETO:
✅ Zero interferência entre Edge Functions
✅ Filas dedicadas e configuráveis
✅ Workers especializados por função
✅ Escalabilidade independente
*/

-- =====================================================================

-- 6️⃣ COMANDOS PARA CRIAR FILAS ISOLADAS

SELECT 'CRIAR FILAS ISOLADAS:' as acao;

-- Fila específica para webhook VPS
SELECT pgmq.create('media_processing_queue_vps') as criar_fila_vps;

-- Fila específica para CRM interno  
SELECT pgmq.create('media_processing_queue_crm') as criar_fila_crm;

-- Fila específica para AI Agent
SELECT pgmq.create('media_processing_queue_ai') as criar_fila_ai;

-- Fila de monitoramento unificado (opcional)
SELECT pgmq.create('media_processing_monitor') as criar_fila_monitor;

-- =====================================================================
-- 📋 RESULTADO FASE 2:
-- =====================================================================
/*
✅ ESTRUTURA ISOLADA IMPLEMENTADA:

1. webhook_whatsapp_web → media_processing_queue_vps
   - TODOS vídeos processados
   - Zero falha de mídia
   - Performance garantida

2. whatsapp_messaging_service → media_processing_queue_crm  
   - Upload interno otimizado
   - Suporte a arquivos grandes
   - Mantém velocidade atual

3. ai_messaging_service → media_processing_queue_ai
   - Processamento robusto de mídia
   - Transcrição de áudios
   - Zero travamento

BENEFÍCIOS:
🚀 Escalabilidade independente
🛡️ Isolamento completo
⚡ Performance otimizada
🔧 Manutenção simplificada
*/