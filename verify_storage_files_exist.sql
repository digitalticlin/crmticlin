-- ================================================================
-- 🔍 VERIFICAR SE ARQUIVOS EXISTEM REALMENTE NO STORAGE
-- ================================================================

-- ================================================================
-- 1️⃣ TESTAR URLS GERADAS
-- ================================================================

-- Verificar algumas URLs específicas
SELECT 
    '🧪 TESTE URLs ESPECÍFICAS' as teste,
    id,
    media_type,
    media_url,
    created_at
FROM public.messages
WHERE media_type != 'text' 
AND source_edge = 'webhook_whatsapp_web'
AND created_at > now() - interval '4 hours'
ORDER BY created_at DESC
LIMIT 5;

-- ================================================================
-- 2️⃣ FUNÇÃO PARA TESTAR SE URL EXISTE (SE EXTENSÃO HTTP DISPONÍVEL)
-- ================================================================

CREATE OR REPLACE FUNCTION public.test_storage_url_exists(
    p_url TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_response jsonb;
    v_status_code INTEGER;
BEGIN
    -- Verificar se extensão HTTP está disponível
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http') THEN
        RETURN jsonb_build_object(
            'url', p_url,
            'accessible', null,
            'error', 'HTTP extension not available'
        );
    END IF;
    
    BEGIN
        -- Fazer HEAD request para verificar se arquivo existe
        SELECT status_code INTO v_status_code
        FROM http_head(p_url);
        
        RETURN jsonb_build_object(
            'url', p_url,
            'status_code', v_status_code,
            'accessible', v_status_code = 200,
            'exists_in_storage', CASE 
                WHEN v_status_code = 200 THEN '✅ ARQUIVO EXISTE'
                WHEN v_status_code = 404 THEN '❌ ARQUIVO NÃO ENCONTRADO'
                ELSE '⚠️ STATUS: ' || v_status_code
            END
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            RETURN jsonb_build_object(
                'url', p_url,
                'accessible', false,
                'error', SQLERRM
            );
    END;
END;
$$;

-- ================================================================
-- 3️⃣ VERIFICAR EXTENSÕES PRIMEIRO
-- ================================================================

-- Ver quais extensões temos
SELECT 
    '🔌 EXTENSÕES INSTALADAS' as info,
    extname,
    extversion,
    CASE 
        WHEN extname = 'http' THEN '✅ PODE TESTAR URLs'
        ELSE '📋 OUTRA'
    END as funcionalidade
FROM pg_extension 
ORDER BY extname;

-- Tentar instalar HTTP se não estiver
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS http;
    RAISE NOTICE '✅ HTTP extension available';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Cannot install HTTP extension: %', SQLERRM;
END $$;

-- ================================================================
-- 4️⃣ TESTAR ALGUMAS URLs DE MÍDIA
-- ================================================================

-- Testar se documento específico existe
DO $$
DECLARE
    v_test_url TEXT := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/webhook/document/2025-09-14/msg_f63ad4b5_1757879422.028389.pdf';
    v_result jsonb;
BEGIN
    SELECT test_storage_url_exists(v_test_url) INTO v_result;
    RAISE NOTICE '🧪 TESTE URL DOCUMENTO: %', v_result;
END $$;

-- Testar várias URLs em lote
DO $$
DECLARE
    v_message RECORD;
    v_result jsonb;
    v_count INTEGER := 0;
    v_exists INTEGER := 0;
BEGIN
    RAISE NOTICE '🧪 TESTANDO URLs EM LOTE...';
    
    FOR v_message IN 
        SELECT id, media_type, media_url 
        FROM public.messages
        WHERE media_type != 'text' 
        AND media_url IS NOT NULL
        AND source_edge = 'webhook_whatsapp_web'
        AND created_at > now() - interval '2 hours'
        ORDER BY created_at DESC
        LIMIT 5
    LOOP
        v_count := v_count + 1;
        
        SELECT test_storage_url_exists(v_message.media_url) INTO v_result;
        
        IF (v_result->>'accessible')::boolean IS TRUE THEN
            v_exists := v_exists + 1;
        END IF;
        
        RAISE NOTICE '[%/5] %: % - %', 
            v_count, 
            v_message.media_type, 
            v_message.id, 
            v_result->>'exists_in_storage';
        
    END LOOP;
    
    RAISE NOTICE '📊 RESULTADO: %/% arquivos existem no Storage', v_exists, v_count;
END $$;

-- ================================================================
-- 5️⃣ ANÁLISE DO PROBLEMA
-- ================================================================

-- Se arquivos não existirem, o problema é:
-- 1. Worker gera URL mas não faz upload real
-- 2. Base64 não está chegando na fila
-- 3. Processo de upload falha silenciosamente

-- Verificar se há Base64 na fila para processar
SELECT 
    '📦 VERIFICAR FILA WEBHOOK' as info,
    queue_name,
    queue_length,
    total_messages,
    CASE 
        WHEN queue_length > 0 THEN '⚠️ TEM MENSAGENS PENDENTES'
        ELSE '✅ FILA VAZIA'
    END as status_fila
FROM pgmq.metrics('webhook_message_queue');

-- Ver algumas mensagens na fila
SELECT 
    '🔍 SAMPLE DA FILA' as info,
    msg_id,
    message->>'message_id' as message_id,
    message->>'media_type' as media_type,
    CASE 
        WHEN message->>'base64_data' IS NOT NULL THEN '✅ TEM BASE64'
        ELSE '❌ SEM BASE64'
    END as tem_base64,
    length(message->>'base64_data') as tamanho_base64,
    enqueued_at
FROM pgmq.read('webhook_message_queue', 1, 10)
ORDER BY enqueued_at DESC
LIMIT 5;

-- ================================================================
-- 6️⃣ SUGESTÃO DE PRÓXIMO PASSO
-- ================================================================

-- Se arquivos não existirem no Storage, próximos passos:
-- 1. Implementar upload real usando Edge Function auxiliar
-- 2. Usar pg_net ou extensão HTTP
-- 3. Criar endpoint dedicado para upload

SELECT 
    '💡 PRÓXIMOS PASSOS' as sugestao,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http') 
        THEN '🚀 Implementar upload HTTP direto no worker'
        ELSE '🔔 Criar Edge Function auxiliar para upload'
    END as estrategia_recomendada;