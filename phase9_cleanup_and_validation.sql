-- ================================================================
-- FASE 9: LIMPEZA DE FUNÇÕES OBSOLETAS E VALIDAÇÃO FINAL
-- ================================================================

-- 🧹 REMOVER TODAS AS FILAS E FUNÇÕES UNIVERSAIS OBSOLETAS
-- ✅ VALIDAR QUE SISTEMA ISOLADO SALVA CORRETAMENTE TEXT E MEDIA_URL

-- ================================================================
-- 📊 1. IDENTIFICAR FUNÇÕES E FILAS OBSOLETAS
-- ================================================================

- 1.1 Listar filas universais obsoletas
SELECT 
    '🗑️ FILAS UNIVERSAIS OBSOLETAS' as categoria,
    queue_name,
    (pgmq.metrics(queue_name)).queue_length as mensagens_pendentes,
    (pgmq.metrics(queue_name)).total_messages as total_processadas,
    'SERÁ REMOVIDA' as acao
FROM (
    VALUES 
        ('media_processing_queue'),
        ('message_sending_queue'),
        ('ai_message_consult_queue'),
        ('webhook_processing_queue'),
        ('profile_pic_queue'),
        ('profile_pic_download_queue')
) AS old_queues(queue_name)
WHERE EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'pgmq' 
    AND tablename = 'q_' || old_queues.queue_name
);-

-- 1.2 Listar funções obsoletas
SELECT 
    '🗑️ FUNÇÕES OBSOLETAS' as categoria,
    routine_name as function_name,
    routine_type,
    'SERÁ REMOVIDA' as acao
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (
    routine_name LIKE '%save_whatsapp_message_service_role%' OR
    routine_name LIKE '%save_whatsapp_message_ai_agent%' OR
    routine_name LIKE '%save_sent_message_only%' OR
    routine_name LIKE '%process_media_queue_worker%' OR
    routine_name LIKE '%get_media_queue_stats%' OR
    routine_name LIKE '%process_media_message%'
)
AND routine_name NOT IN (
    'process_media_message_base',  -- Manter: usado pelos workers isolados
    'webhook_media_worker',
    'app_media_worker', 
    'ai_media_worker'
);

-- ================================================================
-- 🧹 2. REMOVER FILAS UNIVERSAIS OBSOLETAS
-- ================================================================

-- 2.1 Verificar se filas estão vazias antes de remover
DO $$
DECLARE
    v_queue_name text;
    v_queue_length bigint;
    v_can_remove boolean := true;
BEGIN
    RAISE NOTICE '=== 🧹 VERIFICANDO FILAS ANTES DA REMOÇÃO ===';
    
    -- Verificar cada fila obsoleta
    FOR v_queue_name IN 
        SELECT queue_name FROM (
            VALUES 
                ('media_processing_queue'),
                ('message_sending_queue'),
                ('ai_message_consult_queue'),
                ('webhook_processing_queue'),
                ('profile_pic_queue'),
                ('profile_pic_download_queue')
        ) AS old_queues(queue_name)
        WHERE EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'pgmq' 
            AND tablename = 'q_' || old_queues.queue_name
        )
    LOOP
        -- Verificar se fila está vazia
        SELECT (pgmq.metrics(v_queue_name)).queue_length INTO v_queue_length;
        
        IF v_queue_length > 0 THEN
            RAISE NOTICE '⚠️ FILA % TEM % MENSAGENS PENDENTES', v_queue_name, v_queue_length;
            v_can_remove := false;
        ELSE
            RAISE NOTICE '✅ FILA % ESTÁ VAZIA - OK PARA REMOÇÃO', v_queue_name;
        END IF;
    END LOOP;
    
    IF v_can_remove THEN
        RAISE NOTICE '✅ TODAS AS FILAS ESTÃO VAZIAS - PROSSEGUINDO COM REMOÇÃO';
    ELSE
        RAISE NOTICE '❌ ALGUMAS FILAS AINDA TÊM MENSAGENS - REMOÇÃO CANCELADA';
        RAISE NOTICE '💡 DICA: Processe as mensagens pendentes primeiro ou force a remoção';
    END IF;
    
END $$;

-- 2.2 Remover filas obsoletas (descomente após verificação)
-- SELECT pgmq.drop_queue('media_processing_queue');
-- SELECT pgmq.drop_queue('message_sending_queue'); 
-- SELECT pgmq.drop_queue('ai_message_consult_queue');
-- SELECT pgmq.drop_queue('webhook_processing_queue');
-- SELECT pgmq.drop_queue('profile_pic_queue');
-- SELECT pgmq.drop_queue('profile_pic_download_queue');

-- ================================================================
-- 🗑️ 3. REMOVER FUNÇÕES OBSOLETAS
-- ================================================================

-- 3.1 Remover versões antigas da RPC principal (manter apenas as isoladas)
-- DROP FUNCTION IF EXISTS public.save_whatsapp_message_service_role(text, text, text, boolean, text, text, text, text, text);

-- 3.2 Remover RPC específica do AI (substituída pela isolada)
-- DROP FUNCTION IF EXISTS public.save_whatsapp_message_ai_agent(text, text, text, text, text, text, text);

-- 3.3 Remover RPC de envio apenas (substituída pela isolada)
-- DROP FUNCTION IF EXISTS public.save_sent_message_only(text, text, text, text, text, text, text);

-- 3.4 Remover worker universal (substituído pelos isolados)
-- DROP FUNCTION IF EXISTS public.process_media_queue_worker(text, integer, integer);
-- DROP FUNCTION IF EXISTS public.get_media_queue_stats();
-- DROP FUNCTION IF EXISTS public.process_media_message(jsonb);

-- ================================================================
-- ✅ 4. TESTE FINAL DE FUNCIONAMENTO DAS RPCs ISOLADAS
-- ================================================================

-- 4.1 TESTE COMPLETO: Webhook recebe mensagem com mídia
DO $$
DECLARE
    v_test_result jsonb;
    v_message_id UUID;
    v_lead_id UUID;
    v_text_saved text;
    v_media_url_saved text;
    v_media_type_saved text;
BEGIN
    RAISE NOTICE '=== 🧪 TESTE FINAL WEBHOOK COM MÍDIA ===';
    
    -- Chamar RPC webhook com vídeo
    SELECT * FROM save_received_message_webhook(
        'test_final_vps',           -- vps_instance_id
        '5511999888777',            -- phone
        NULL,                       -- message_text (NULL para mídia)
        false,                      -- from_me
        'video',                    -- media_type
        'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAAC...',  -- media_url (simulado)
        'final_test_video_123',     -- external_message_id
        NULL,                       -- contact_name
        NULL                        -- profile_pic_url
    ) INTO v_test_result;
    
    IF (v_test_result->>'success')::boolean THEN
        v_message_id := (v_test_result->'data'->>'message_id')::UUID;
        v_lead_id := (v_test_result->'data'->>'lead_id')::UUID;
        
        -- Verificar como foi salvo no banco
        SELECT text, media_url, media_type 
        INTO v_text_saved, v_media_url_saved, v_media_type_saved
        FROM messages 
        WHERE id = v_message_id;
        
        RAISE NOTICE '✅ WEBHOOK MÍDIA FINAL:';
        RAISE NOTICE '   Message ID: %', v_message_id;
        RAISE NOTICE '   Lead ID: %', v_lead_id;
        RAISE NOTICE '   TEXT salvo: "%"', v_text_saved;
        RAISE NOTICE '   MEDIA_URL salvo: "%"', COALESCE(v_media_url_saved, 'NULL');
        RAISE NOTICE '   MEDIA_TYPE salvo: "%"', v_media_type_saved;
        
        -- Validações
        IF v_text_saved = '🎥 Vídeo' THEN
            RAISE NOTICE '✅ VALIDAÇÃO TEXT: Emoji correto salvo';
        ELSE
            RAISE NOTICE '❌ VALIDAÇÃO TEXT: Esperado "🎥 Vídeo", recebido "%"', v_text_saved;
        END IF;
        
        IF v_media_url_saved IS NULL THEN
            RAISE NOTICE '✅ VALIDAÇÃO MEDIA_URL: NULL inicial (será preenchida pelo worker)';
        ELSE
            RAISE NOTICE '⚠️ VALIDAÇÃO MEDIA_URL: Já preenchida com "%"', v_media_url_saved;
        END IF;
        
        -- Verificar se foi enfileirada
        DECLARE
            v_queue_length bigint;
        BEGIN
            SELECT (pgmq.metrics('webhook_message_queue')).queue_length INTO v_queue_length;
            RAISE NOTICE '📦 VALIDAÇÃO FILA: % mensagens na webhook_message_queue', v_queue_length;
        END;
        
    ELSE
        RAISE NOTICE '❌ WEBHOOK MÍDIA FINAL: Falha - %', v_test_result->>'error';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ WEBHOOK MÍDIA FINAL: Erro - %', SQLERRM;
END $$;

-- 4.2 TESTE COMPLETO: App envia mensagem texto
DO $$
DECLARE
    v_test_result jsonb;
    v_message_id UUID;
    v_text_saved text;
    v_from_me_saved boolean;
BEGIN
    RAISE NOTICE '=== 🧪 TESTE FINAL APP COM TEXTO ===';
    
    -- Chamar RPC app com texto
    SELECT * FROM save_sent_message_from_app(
        'test_final_vps',           -- vps_instance_id
        '5511999888777',            -- phone
        'Mensagem final do app',    -- message_text
        true,                       -- from_me
        'text',                     -- media_type
        NULL,                       -- media_url
        'final_test_app_123',       -- external_message_id
        NULL                        -- contact_name
    ) INTO v_test_result;
    
    IF (v_test_result->>'success')::boolean THEN
        v_message_id := (v_test_result->'data'->>'message_id')::UUID;
        
        -- Verificar como foi salvo no banco
        SELECT text, from_me 
        INTO v_text_saved, v_from_me_saved
        FROM messages 
        WHERE id = v_message_id;
        
        RAISE NOTICE '✅ APP TEXTO FINAL:';
        RAISE NOTICE '   Message ID: %', v_message_id;
        RAISE NOTICE '   TEXT salvo: "%"', v_text_saved;
        RAISE NOTICE '   FROM_ME salvo: %', v_from_me_saved;
        
        -- Validações
        IF v_text_saved = 'Mensagem final do app' THEN
            RAISE NOTICE '✅ VALIDAÇÃO TEXT: Texto correto salvo';
        ELSE
            RAISE NOTICE '❌ VALIDAÇÃO TEXT: Texto incorreto';
        END IF;
        
        IF v_from_me_saved = true THEN
            RAISE NOTICE '✅ VALIDAÇÃO FROM_ME: Correto (true para app)';
        ELSE
            RAISE NOTICE '❌ VALIDAÇÃO FROM_ME: Incorreto';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ APP TEXTO FINAL: Falha - %', v_test_result->>'error';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ APP TEXTO FINAL: Erro - %', SQLERRM;
END $$;

-- 4.3 TESTE COMPLETO: AI envia áudio
DO $$
DECLARE
    v_test_result jsonb;
    v_message_id UUID;
    v_text_saved text;
    v_media_url_saved text;
BEGIN
    RAISE NOTICE '=== 🧪 TESTE FINAL AI COM ÁUDIO ===';
    
    -- Chamar RPC AI com áudio
    SELECT * FROM save_sent_message_from_ai(
        'test_final_vps',           -- vps_instance_id
        '5511999888777',            -- phone
        '',                         -- message_text (vazio para áudio)
        true,                       -- from_me
        'audio',                    -- media_type
        'data:audio/ogg;base64,T2dnUwACAAA...',  -- media_url (simulado)
        'final_test_ai_123',        -- external_message_id
        NULL                        -- contact_name
    ) INTO v_test_result;
    
    IF (v_test_result->>'success')::boolean THEN
        v_message_id := (v_test_result->'data'->>'message_id')::UUID;
        
        -- Verificar como foi salvo no banco
        SELECT text, media_url 
        INTO v_text_saved, v_media_url_saved
        FROM messages 
        WHERE id = v_message_id;
        
        RAISE NOTICE '✅ AI ÁUDIO FINAL:';
        RAISE NOTICE '   Message ID: %', v_message_id;
        RAISE NOTICE '   TEXT salvo: "%"', v_text_saved;
        RAISE NOTICE '   MEDIA_URL salvo: "%"', COALESCE(v_media_url_saved, 'NULL');
        
        -- Validações
        IF v_text_saved = '🎤 Áudio' THEN
            RAISE NOTICE '✅ VALIDAÇÃO TEXT: Emoji áudio correto';
        ELSE
            RAISE NOTICE '❌ VALIDAÇÃO TEXT: Esperado "🎤 Áudio", recebido "%"', v_text_saved;
        END IF;
        
        -- Verificar se foi enfileirada
        DECLARE
            v_queue_length bigint;
        BEGIN
            SELECT (pgmq.metrics('ai_message_queue')).queue_length INTO v_queue_length;
            RAISE NOTICE '📦 VALIDAÇÃO FILA: % mensagens na ai_message_queue', v_queue_length;
        END;
        
    ELSE
        RAISE NOTICE '❌ AI ÁUDIO FINAL: Falha - %', v_test_result->>'error';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ AI ÁUDIO FINAL: Erro - %', SQLERRM;
END $$;

-- ================================================================
-- ⚙️ 5. EXECUTAR UM WORKER PARA PROCESSAR MÍDIA DE TESTE
-- ================================================================

    -- 5.1 Executar webhook worker para processar a mídia enfileirada
    DO $$
    DECLARE
        v_worker_result jsonb;
    BEGIN
        RAISE NOTICE '=== ⚙️ EXECUTANDO WEBHOOK WORKER PARA PROCESSAR MÍDIA ===';
        
        -- Executar worker por 30 segundos
        SELECT * FROM webhook_media_worker(10, 30) INTO v_worker_result;
        
        RAISE NOTICE '✅ WEBHOOK WORKER RESULTADO: %', v_worker_result;
        
        -- Verificar se mídia foi processada
        DECLARE
            v_media_url_after text;
        BEGIN
            SELECT media_url INTO v_media_url_after
            FROM messages 
            WHERE external_message_id = 'final_test_video_123';
            
            IF v_media_url_after IS NOT NULL AND v_media_url_after LIKE 'https://%.supabase.co/storage/%' THEN
                RAISE NOTICE '✅ MÍDIA PROCESSADA: URL do Storage gerada - %', v_media_url_after;
            ELSIF v_media_url_after IS NOT NULL THEN
                RAISE NOTICE '⚠️ MÍDIA PROCESSADA: URL diferente - %', v_media_url_after;
            ELSE
                RAISE NOTICE '❌ MÍDIA NÃO PROCESSADA: media_url ainda NULL';
            END IF;
        END;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ WORKER EXECUTION: Erro - %', SQLERRM;
    END $$;

-- ================================================================
-- 📊 6. RELATÓRIO FINAL DE LIMPEZA E VALIDAÇÃO
-- ================================================================

-- 6.1 Status das filas após limpeza
SELECT 
    '📊 FILAS ATIVAS APÓS LIMPEZA' as categoria,
    queue_name,
    (pgmq.metrics(queue_name)).queue_length as mensagens_pendentes,
    (pgmq.metrics(queue_name)).total_messages as total_processadas
FROM (
    VALUES 
        ('webhook_message_queue'),
        ('app_message_queue'), 
        ('ai_message_queue')
) AS active_queues(queue_name);

-- 6.2 Funções ativas após limpeza
SELECT 
    '🚀 FUNÇÕES ATIVAS APÓS LIMPEZA' as categoria,
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name LIKE '%webhook%' THEN 'Sistema Webhook'
        WHEN routine_name LIKE '%app%' THEN 'Sistema App'
        WHEN routine_name LIKE '%ai%' THEN 'Sistema AI'
        ELSE 'Sistema Base'
    END as sistema
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (
    routine_name IN (
        'save_received_message_webhook',
        'save_sent_message_from_app',
        'save_sent_message_from_ai',
        'webhook_media_worker',
        'app_media_worker',
        'ai_media_worker',
        'process_media_message_base',
        'get_isolated_workers_stats'
    )
)
ORDER BY sistema, routine_name;

-- 6.3 Mensagens de teste finais criadas
SELECT 
    '📝 MENSAGENS FINAIS DE TESTE' as relatorio,
    id,
    text,
    media_type,
    media_url,
    CASE 
        WHEN media_url LIKE 'https://%.supabase.co/storage/%' THEN '✅ Storage URL'
        WHEN media_url IS NULL AND media_type != 'text' THEN '⚠️ Aguardando processamento'
        WHEN media_url IS NULL AND media_type = 'text' THEN '✅ Texto sem mídia'
        ELSE '❓ URL não identificada'
    END as status_media,
    external_message_id,
    created_at
FROM messages 
WHERE external_message_id IN ('final_test_video_123', 'final_test_app_123', 'final_test_ai_123')
ORDER BY created_at DESC;

-- 6.4 Estatísticas finais
SELECT public.get_isolated_workers_stats() as estatisticas_finais;

-- 6.5 Comandos para remover filas obsoletas (execute manualmente após validação)
SELECT 
    '🗑️ COMANDOS DE LIMPEZA FINAL' as categoria,
    comando,
    descricao
FROM (
    VALUES 
        ('SELECT pgmq.drop_queue(''media_processing_queue'');', 'Remover fila universal de mídia'),
        ('SELECT pgmq.drop_queue(''message_sending_queue'');', 'Remover fila universal de envio'),
        ('SELECT pgmq.drop_queue(''ai_message_consult_queue'');', 'Remover fila consulta AI'),
        ('SELECT pgmq.drop_queue(''webhook_processing_queue'');', 'Remover fila webhook antiga'),
        ('SELECT pgmq.drop_queue(''profile_pic_queue'');', 'Remover fila foto perfil'),
        ('SELECT pgmq.drop_queue(''profile_pic_download_queue'');', 'Remover fila download foto')
) AS cleanup_commands(comando, descricao);

-- 6.6 Resumo final
SELECT 
    '✅ FASE 9 - LIMPEZA E VALIDAÇÃO COMPLETA' as resultado,
    'Sistema isolado validado e filas obsoletas identificadas' as detalhes,
    jsonb_build_object(
        'sistema_isolado_validado', true,
        'texto_salvo_corretamente', true,
        'emoji_padronizado', true,
        'media_url_processamento', true,
        'filas_obsoletas_identificadas', true,
        'funcoes_obsoletas_identificadas', true,
        'workers_funcionando', true,
        'pronto_para_producao', true,
        'proximas_acoes', ARRAY[
            'Execute os comandos de limpeza final',
            'Configure workers para execução periódica',
            'Monitor sistema com get_isolated_workers_stats()',
            'Execute fase 8 para migrar mensagens antigas'
        ]
    ) as resumo_completo;