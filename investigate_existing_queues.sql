-- ================================================================
-- INVESTIGAR FILAS PGMQ EXISTENTES
-- ================================================================

-- 1. Verificar se PGMQ está instalado e funcionando
SELECT 
    'PGMQ STATUS' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgmq') 
        THEN 'INSTALADO' 
        ELSE 'NÃO INSTALADO' 
    END as status;

-- 2. Listar todas as filas existentes
SELECT 
    'FILAS EXISTENTES' as info,
    pgmq.list_queues() as queue_name;

-- 3. Verificar tabelas de fila existentes no schema pgmq
SELECT 
    'TABELAS DE FILA' as info,
    schemaname,
    tablename,
    CASE 
        WHEN tablename LIKE 'q_%' THEN SUBSTRING(tablename FROM 3)
        ELSE tablename
    END as queue_name
FROM pg_tables
WHERE schemaname = 'pgmq'
AND tablename LIKE 'q_%'
ORDER BY tablename;

-- 4. Verificar se existem as filas que vimos no código das edges
DO $$
DECLARE
    queue_exists boolean;
    msg_count integer;
    queue_metrics record;
BEGIN
    RAISE NOTICE '=== VERIFICANDO FILAS MENCIONADAS NO CÓDIGO ===';
    
    -- Verificar media_processing_queue
    SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'pgmq' 
        AND tablename = 'q_media_processing_queue'
    ) INTO queue_exists;
    
    IF queue_exists THEN
        EXECUTE 'SELECT COUNT(*) FROM pgmq.q_media_processing_queue' INTO msg_count;
        SELECT * FROM pgmq.metrics('media_processing_queue') INTO queue_metrics;
        RAISE NOTICE 'media_processing_queue: EXISTS - % mensagens - %', msg_count, queue_metrics;
    ELSE
        RAISE NOTICE 'media_processing_queue: NÃO EXISTE';
    END IF;
    
    -- Verificar message_sending_queue
    SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'pgmq' 
        AND tablename = 'q_message_sending_queue'
    ) INTO queue_exists;
    
    IF queue_exists THEN
        EXECUTE 'SELECT COUNT(*) FROM pgmq.q_message_sending_queue' INTO msg_count;
        SELECT * FROM pgmq.metrics('message_sending_queue') INTO queue_metrics;
        RAISE NOTICE 'message_sending_queue: EXISTS - % mensagens - %', msg_count, queue_metrics;
    ELSE
        RAISE NOTICE 'message_sending_queue: NÃO EXISTE';
    END IF;
    
END $$;

-- 5. Verificar todas as funções relacionadas a filas
SELECT 
    'FUNÇÕES PGMQ' as tipo,
    routine_name,
    routine_type,
    routine_schema
FROM information_schema.routines
WHERE routine_schema = 'pgmq'
ORDER BY routine_name;

-- 6. Verificar se existem workers ou processadores
SELECT 
    'FUNÇÕES DE PROCESSAMENTO' as tipo,
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (
    routine_name LIKE '%queue%' 
    OR routine_name LIKE '%worker%' 
    OR routine_name LIKE '%process%'
)
ORDER BY routine_name;

-- 7. Verificar configurações e permissões do PGMQ
SELECT 
    'PERMISSÕES PGMQ' as info,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.schema_privileges
WHERE table_schema = 'pgmq'
ORDER BY grantee, privilege_type;

-- 8. PROPOSTA DE FILAS ISOLADAS (3 FILAS SEPARADAS)
SELECT 
    'PROPOSTA DE FILAS ISOLADAS' as titulo,
    jsonb_build_object(
        'webhook_message_queue', jsonb_build_object(
            'purpose', 'Processar mensagens recebidas da VPS via webhook',
            'priority', 'high',
            'retention', '24 hours',
            'max_retries', 3
        ),
        'app_message_queue', jsonb_build_object(
            'purpose', 'Processar mensagens enviadas pelo app',
            'priority', 'normal', 
            'retention', '12 hours',
            'max_retries', 2
        ),
        'ai_message_queue', jsonb_build_object(
            'purpose', 'Processar mensagens do AI/N8N',
            'priority', 'normal',
            'retention', '6 hours', 
            'max_retries', 2
        )
    ) as queue_structure;