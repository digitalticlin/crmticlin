-- =====================================================================
-- 📋 PLANO COMPLETO DE PADRONIZAÇÃO E ISOLAMENTO
-- =====================================================================
-- FASE 1: Corrigir campo TEXT em TODAS as funções RPC das 3 Edge Functions
-- FASE 2: Estrutura de fila ISOLADA para CADA Edge Function
-- =====================================================================

-- 🎯 MAPEAMENTO DAS FUNÇÕES RPC POR EDGE FUNCTION:

-- webhook_whatsapp_web → save_whatsapp_message_service_role (9 params - SEM base64)
-- whatsapp_messaging_service → save_sent_message_only  
-- ai_messaging_service → save_whatsapp_message_ai_agent

-- =====================================================================
-- 🏗️ FASE 1: CORREÇÃO DO CAMPO TEXT EM TODAS AS FUNÇÕES RPC
-- =====================================================================

-- 1️⃣ PRIMEIRO: RENOMEAR FUNÇÃO DUPLICADA PARA EVITAR CONFUSÃO

-- Identificar função duplicada (com p_base64_data)
SELECT 
    'FUNÇÃO A SER RENOMEADA:' as acao,
    p.oid as function_oid,
    pg_get_function_arguments(p.oid) as parametros,
    'Esta função COM p_base64_data será renomeada para save_whatsapp_message_crm_internal' as plano
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'save_whatsapp_message_service_role'
AND pg_get_function_arguments(p.oid) LIKE '%p_base64_data%';

-- =====================================================================

-- 2️⃣ LISTAR TODAS AS FUNÇÕES QUE PRECISAM DO PADRÃO TEXT CORRETO

SELECT 
    'FUNÇÕES RPC PARA CORRIGIR CAMPO TEXT:' as fase_1,
    p.proname as nome_funcao,
    array_length(p.proargtypes, 1) as total_params,
    CASE 
        WHEN p.proname = 'save_whatsapp_message_service_role' AND pg_get_function_arguments(p.oid) NOT LIKE '%p_base64_data%' THEN 
            '🎯 VPS WEBHOOK - Implementar getMediaDisplayName()'
        WHEN p.proname = 'save_whatsapp_message_service_role' AND pg_get_function_arguments(p.oid) LIKE '%p_base64_data%' THEN 
            '🔄 RENOMEAR → save_whatsapp_message_crm_internal'
        WHEN p.proname = 'save_sent_message_only' THEN 
            '📤 CRM ENVIO - Implementar getMediaDisplayName()'
        WHEN p.proname = 'save_whatsapp_message_ai_agent' THEN 
            '🤖 IA AGENT - Implementar getMediaDisplayName()'
        ELSE '❓ OUTRAS'
    END as acao_necessaria
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'save_whatsapp_message_service_role',
    'save_sent_message_only', 
    'save_whatsapp_message_ai_agent'
)
ORDER BY p.proname;

-- =====================================================================

-- 3️⃣ PADRÃO OBRIGATÓRIO DE CAMPO TEXT PARA IMPLEMENTAR

/*
📱 PADRÃO UNIVERSAL DE CAMPO TEXT (para todas as 3 Edge Functions):

Função JavaScript para implementar em TODAS as funções RPC:

CREATE OR REPLACE FUNCTION get_media_display_name(
    p_media_type TEXT,
    p_caption TEXT DEFAULT NULL
) RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    CASE p_media_type
        WHEN 'text' THEN 
            RETURN p_caption; -- Texto original
        WHEN 'image' THEN 
            RETURN CASE 
                WHEN p_caption IS NOT NULL AND p_caption != '' 
                THEN '📷 Imagem: ' || p_caption
                ELSE '📷 Imagem'
            END;
        WHEN 'video' THEN 
            RETURN CASE 
                WHEN p_caption IS NOT NULL AND p_caption != '' 
                THEN '🎥 Vídeo: ' || p_caption
                ELSE '🎥 Vídeo'
            END;
        WHEN 'audio' THEN 
            RETURN CASE 
                WHEN p_caption IS NOT NULL AND p_caption != '' 
                THEN '🎵 Áudio: ' || p_caption
                ELSE '🎵 Áudio'
            END;
        WHEN 'document' THEN 
            RETURN CASE 
                WHEN p_caption IS NOT NULL AND p_caption != '' 
                THEN '📄 Documento: ' || p_caption
                ELSE '📄 Documento'
            END;
        WHEN 'sticker' THEN 
            RETURN '😊 Sticker';
        ELSE 
            RETURN COALESCE(p_caption, '📎 Mídia');
    END CASE;
END;
$$;

RESULTADO:
- text: "Mensagem original" 
- image: "📷 Imagem" ou "📷 Imagem: caption"
- video: "🎥 Vídeo" ou "🎥 Vídeo: caption"
- audio: "🎵 Áudio" ou "🎵 Áudio: caption"  
- document: "📄 Documento" ou "📄 Documento: caption"
- sticker: "😊 Sticker"

❌ NUNCA MAIS:
- "[Mensagem não suportada]"
- "[Sticker]"
- "[Documento: filename]"  
- "[Áudio]"
*/

-- =====================================================================

-- 4️⃣ IMPLEMENTAÇÃO EM CADA FUNÇÃO RPC

-- A) save_whatsapp_message_service_role (VPS - 9 params):
-- Substituir: p_message_text por get_media_display_name(p_media_type, p_message_text)

-- B) save_sent_message_only (CRM envio):
-- Implementar: get_media_display_name() no campo text

-- C) save_whatsapp_message_ai_agent (IA):
-- Implementar: get_media_display_name() no campo text

-- =====================================================================

-- 5️⃣ BASELINE - SITUAÇÃO ATUAL DO CAMPO TEXT (ANTES DA CORREÇÃO)

SELECT 
    'BASELINE CAMPO TEXT - ANTES DA CORREÇÃO:' as status,
    media_type,
    COUNT(*) as total_mensagens,
    
    -- Problemas atuais
    COUNT(CASE WHEN text = '[Mensagem não suportada]' THEN 1 END) as mensagem_nao_suportada,
    COUNT(CASE WHEN text = '[Sticker]' THEN 1 END) as sticker_incorreto,
    COUNT(CASE WHEN text LIKE '[Documento:%' THEN 1 END) as documento_incorreto,
    COUNT(CASE WHEN text = '[Áudio]' THEN 1 END) as audio_incorreto,
    
    -- Padrão correto (já existente)
    COUNT(CASE WHEN text ~ '^📷|^🎥|^🎵|^📄|^😊' THEN 1 END) as ja_com_emoji_correto,
    
    -- Percentuais
    ROUND(COUNT(CASE WHEN text = '[Mensagem não suportada]' THEN 1 END) * 100.0 / COUNT(*), 2) as perc_nao_suportada,
    ROUND(COUNT(CASE WHEN text ~ '^📷|^🎥|^🎵|^📄|^😊' THEN 1 END) * 100.0 / COUNT(*), 2) as perc_ja_correto

FROM messages
WHERE import_source = 'realtime'
AND created_at > now() - interval '7 days'
AND media_type IN ('image', 'video', 'audio', 'document')
GROUP BY media_type
ORDER BY media_type;

-- =====================================================================
-- 🏗️ FASE 2: ESTRUTURA DE FILA ISOLADA POR EDGE FUNCTION
-- =====================================================================

-- 6️⃣ MAPEAMENTO DAS FILAS NECESSÁRIAS (UMA POR EDGE FUNCTION)

SELECT 
    'FILAS ISOLADAS NECESSÁRIAS:' as fase_2,
    'webhook_whatsapp_web' as edge_function,
    'media_processing_queue_vps' as fila_necessaria,
    'Processar mídia da VPS (vídeos, imagens, etc)' as proposito
    
UNION ALL SELECT 
    'FILAS ISOLADAS NECESSÁRIAS:',
    'whatsapp_messaging_service',
    'media_processing_queue_crm', 
    'Processar mídia do CRM (envios internos)'
    
UNION ALL SELECT
    'FILAS ISOLADAS NECESSÁRIAS:',
    'ai_messaging_service',
    'media_processing_queue_ai',
    'Processar mídia do AI Agent (áudios, imagens)';

-- =====================================================================

-- 7️⃣ VERIFICAR FILAS EXISTENTES NO PGMQ

SELECT 
    'FILAS PGMQ EXISTENTES:' as status_atual,
    queue_name,
    created_at,
    is_partitioned,
    CASE 
        WHEN queue_name = 'media_processing_queue' THEN '✅ USADA webhook_whatsapp_web (parcial)'
        WHEN queue_name = 'message_sending_queue' THEN '✅ USADA whatsapp_messaging_service'
        WHEN queue_name LIKE '%media%' THEN '🔍 VERIFICAR USO'
        ELSE '📋 OUTRAS'
    END as uso_atual
FROM pgmq.meta() 
ORDER BY queue_name;

-- =====================================================================

-- 8️⃣ PLANO DE CRIAÇÃO DAS FILAS ISOLADAS

-- Criar filas específicas para cada Edge Function
SELECT pgmq.create('media_processing_queue_vps') as criar_fila_vps;
SELECT pgmq.create('media_processing_queue_crm') as criar_fila_crm; 
SELECT pgmq.create('media_processing_queue_ai') as criar_fila_ai;

-- Fila unificada para monitoramento (opcional)
SELECT pgmq.create('media_processing_monitor') as criar_fila_monitor;

-- =====================================================================

-- 9️⃣ ESTRUTURA PADRÃO DE MENSAGEM NAS FILAS ISOLADAS

/*
📋 FORMATO PADRÃO PARA CADA FILA ISOLADA:

media_processing_queue_vps (webhook_whatsapp_web):
{
  "type": "process_media_vps",
  "messageId": "uuid",
  "mediaData": {
    "base64Data": "content",
    "mediaType": "video|image|audio|document", 
    "fileName": "nome",
    "externalMessageId": "vps-id",
    "caption": "legenda"
  },
  "priority": "high|normal",
  "retryCount": 0,
  "source": "vps_webhook"
}

media_processing_queue_crm (whatsapp_messaging_service):
{
  "type": "process_media_crm",
  "messageId": "uuid",
  "mediaData": {
    "base64Data": "content",
    "mediaType": "video|image|audio|document",
    "fileName": "nome",
    "userId": "user-id",
    "caption": "legenda"
  },
  "priority": "normal",
  "retryCount": 0,
  "source": "crm_messaging"
}

media_processing_queue_ai (ai_messaging_service):
{
  "type": "process_media_ai", 
  "messageId": "uuid",
  "mediaData": {
    "base64Data": "content",
    "mediaType": "audio|image", 
    "fileName": "nome",
    "agentId": "agent-id",
    "caption": "transcription/description"
  },
  "priority": "high",
  "retryCount": 0,
  "source": "ai_agent"
}
*/

-- =====================================================================

-- 🔟 CRITÉRIOS DE SUCESSO DO PLANO COMPLETO

/*
🎯 FASE 1 - CORREÇÃO CAMPO TEXT:
✅ 0% mensagens com "[Mensagem não suportada]"
✅ 0% mensagens com "[Sticker]" 
✅ 100% mídias com emoji padrão correto
✅ Caption preservada quando existir

🎯 FASE 2 - FILAS ISOLADAS:
✅ webhook_whatsapp_web → media_processing_queue_vps
✅ whatsapp_messaging_service → media_processing_queue_crm
✅ ai_messaging_service → media_processing_queue_ai
✅ Cada fila processa apenas sua Edge Function
✅ Zero interferência entre Edge Functions

🎯 RESULTADO FINAL:
✅ Vídeos: 7% → 100% com media_url
✅ Campo TEXT: Padronizado em todas as funções
✅ Escalabilidade: Filas isoladas e dedicadas
✅ Isolamento: Zero dependência entre Edge Functions
✅ Monitoramento: Uma fila por função para debug
*/

-- =====================================================================
-- 📋 ORDEM DE EXECUÇÃO DO PLANO
-- =====================================================================

/*
🚀 ORDEM SEQUENCIAL DE IMPLEMENTAÇÃO:

STEP 1: Renomear função RPC duplicada
- save_whatsapp_message_service_role (COM base64) → save_whatsapp_message_crm_internal

STEP 2: Criar função get_media_display_name()
- Função universal para todas as RPC

STEP 3: Atualizar save_whatsapp_message_service_role (VPS - 9 params)  
- Implementar get_media_display_name()
- Corrigir campo TEXT

STEP 4: Atualizar save_sent_message_only (CRM)
- Implementar get_media_display_name() 
- Padronizar campo TEXT

STEP 5: Atualizar save_whatsapp_message_ai_agent (AI)
- Implementar get_media_display_name()
- Padronizar campo TEXT

STEP 6: Criar filas isoladas
- media_processing_queue_vps
- media_processing_queue_crm  
- media_processing_queue_ai

STEP 7: Atualizar Edge Functions
- Cada uma usar sua fila dedicada
- Processamento isolado

STEP 8: Validar resultados
- Campo TEXT 100% correto
- Vídeos 100% processados
- Filas operando isoladamente

TEMPO ESTIMADO: 
- FASE 1 (RPC): 2-3 horas
- FASE 2 (Filas): 3-4 horas
- TOTAL: 5-7 horas para implementação completa
*/