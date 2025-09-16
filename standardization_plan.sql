-- =====================================================================
-- 📋 PLANO DE PADRONIZAÇÃO COMPLETA DAS FUNÇÕES RPC
-- =====================================================================
-- Garantir padrão uniforme em todas as Edge Functions para:
-- 1. Campo TEXT com emojis padrão
-- 2. Storage e media_url padronizados 
-- 3. Isolamento mantido entre funções
-- =====================================================================

-- 🎯 FUNÇÕES RPC MAPEADAS:
-- webhook_whatsapp_web → save_whatsapp_message_service_role (9 params - SEM base64)
-- whatsapp_messaging_service → save_sent_message_only
-- ai_messaging_service → save_whatsapp_message_ai_agent

-- =====================================================================

-- 1️⃣ RENOMEAR FUNÇÃO DUPLICADA PARA EVITAR CONFUSÃO
-- A função com p_base64_data será renomeada para diferenciação clara

-- STEP 1: Identificar qual função tem p_base64_data
SELECT 
    'IDENTIFICAÇÃO DA FUNÇÃO COM BASE64:' as acao,
    p.oid as function_oid,
    pg_get_function_arguments(p.oid) as parametros,
    CASE 
        WHEN pg_get_function_arguments(p.oid) LIKE '%p_base64_data%' THEN '🎯 ESTA SERÁ RENOMEADA'
        ELSE '✅ WEBHOOK VPS - MANTER NOME'
    END as acao_necessaria
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'save_whatsapp_message_service_role'
ORDER BY p.oid;

-- =====================================================================

-- 2️⃣ LISTAR TODAS AS FUNÇÕES RPC PARA PADRONIZAR
SELECT 
    'FUNÇÕES RPC PARA PADRONIZAR:' as categoria,
    p.proname as nome_funcao,
    array_length(p.proargtypes, 1) as total_params,
    CASE 
        WHEN p.proname = 'save_whatsapp_message_service_role' AND pg_get_function_arguments(p.oid) NOT LIKE '%p_base64_data%' THEN '🎯 VPS - CORRIGIR VÍDEOS + TEXT'
        WHEN p.proname = 'save_whatsapp_message_service_role' AND pg_get_function_arguments(p.oid) LIKE '%p_base64_data%' THEN '🔄 RENOMEAR PARA CRM'
        WHEN p.proname = 'save_sent_message_only' THEN '📤 ENVIOS CRM - PADRONIZAR TEXT'
        WHEN p.proname = 'save_whatsapp_message_ai_agent' THEN '🤖 IA AGENT - PADRONIZAR TEXT'
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
ORDER BY p.proname, array_length(p.proargtypes, 1);

-- =====================================================================

-- 3️⃣ PADRÃO DE CAMPO TEXT PARA TODAS AS FUNÇÕES
/*
📱 PADRÃO OBRIGATÓRIO PARA CAMPO TEXT:
- text: "Mensagem original do usuário"
- image: "📷 Imagem" ou "📷 Imagem: caption"
- video: "🎥 Vídeo" ou "🎥 Vídeo: caption"
- audio: "🎵 Áudio" ou "🎵 Áudio: caption"  
- document: "📄 Documento" ou "📄 Documento: caption"
- sticker: "😊 Sticker"

❌ NUNCA USAR:
- "[Mensagem não suportada]"
- "[Sticker]"  
- "[Documento: filename]"
- "[Áudio]"
*/

-- =====================================================================

-- 4️⃣ VERIFICAR SE OUTRAS FUNÇÕES SEGUEM PADRÃO CORRETO
SELECT 
    'VERIFICAR PADRÃO EM OUTRAS FUNÇÕES:' as check_padrao,
    p.proname as funcao,
    pg_get_functiondef(p.oid) LIKE '%getMediaDisplayName%' as tem_emoji_funcao,
    pg_get_functiondef(p.oid) LIKE '%📷%' as tem_emoji_hardcoded,
    pg_get_functiondef(p.oid) LIKE '%Mensagem não suportada%' as tem_problema_texto
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'save_sent_message_only',
    'save_whatsapp_message_ai_agent'
);

-- =====================================================================

-- 5️⃣ ESTATÍSTICAS ATUAIS PARA COMPARAÇÃO APÓS CORREÇÕES
SELECT 
    'BASELINE - ANTES DAS CORREÇÕES:' as baseline,
    media_type,
    COUNT(*) as total,
    COUNT(CASE WHEN media_url IS NOT NULL THEN 1 END) as com_media_url,
    COUNT(CASE WHEN text = '[Mensagem não suportada]' THEN 1 END) as mensagem_nao_suportada,
    COUNT(CASE WHEN text = '[Sticker]' THEN 1 END) as sticker_text,
    COUNT(CASE WHEN text ~ '^📷|^🎥|^🎵|^📄|^😊' THEN 1 END) as com_emoji_padrao
FROM messages
WHERE import_source = 'realtime'
AND created_at > now() - interval '7 days'
AND media_type IN ('image', 'video', 'audio', 'document')
GROUP BY media_type
ORDER BY media_type;

-- =====================================================================
-- 📋 PLANO DE EXECUÇÃO SEQUENCIAL
-- =====================================================================
/*
🎯 ORDEM DE EXECUÇÃO:

1. ✅ RENOMEAR FUNÇÃO DUPLICADA:
   - Função com p_base64_data → save_whatsapp_message_crm_internal
   - Manter função VPS como save_whatsapp_message_service_role

2. 🎥 CORRIGIR FUNÇÃO VPS (webhook_whatsapp_web):
   - Resolver problema dos vídeos sem media_url (93% → 100%)
   - Padronizar campo TEXT com emojis

3. 📤 ATUALIZAR save_sent_message_only:
   - Implementar padrão de emojis no TEXT
   - Garantir processamento correto de storage

4. 🤖 ATUALIZAR save_whatsapp_message_ai_agent:
   - Implementar padrão de emojis no TEXT
   - Garantir processamento correto de storage

5. ✅ VALIDAR RESULTADOS:
   - Confirmar 100% vídeos com media_url
   - Confirmar padrão TEXT em todas funções
   - Confirmar isolamento mantido

CRITÉRIO DE SUCESSO:
- Vídeos: 7.14% → 100% com media_url
- TEXT: 0 ocorrências de "[Mensagem não suportada]" ou "[Sticker]"
- Emoji padrão: 100% das mídias com emoji correto
*/