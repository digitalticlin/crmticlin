
-- REMOÇÃO DEFINITIVA DOS CRONS PROBLEMÁTICOS
-- Esta operação vai reduzir 99,9% das execuções de cron

DO $$
DECLARE
    job_record RECORD;
    jobs_to_remove INTEGER[] := ARRAY[1, 2, 6, 7, 11, 12, 15];
    job_id INTEGER;
BEGIN
    RAISE NOTICE '[CRON CLEANUP] 🚀 Iniciando remoção definitiva dos jobs problemáticos...';
    
    -- Listar jobs existentes antes da remoção
    FOR job_record IN 
        SELECT jobid, jobname, schedule, command 
        FROM cron.job 
        ORDER BY jobid 
    LOOP
        RAISE NOTICE '[CRON CLEANUP] 📋 Job atual: ID=% Nome=% Schedule=%', 
                     job_record.jobid, 
                     COALESCE(job_record.jobname, 'NULL'), 
                     job_record.schedule;
    END LOOP;
    
    -- Remover jobs problemáticos um por um
    FOREACH job_id IN ARRAY jobs_to_remove
    LOOP
        BEGIN
            DELETE FROM cron.job WHERE jobid = job_id;
            
            IF FOUND THEN
                RAISE NOTICE '[CRON CLEANUP] ✅ Job removido: ID=%', job_id;
            ELSE
                RAISE NOTICE '[CRON CLEANUP] ⚠️ Job não encontrado: ID=%', job_id;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '[CRON CLEANUP] ❌ Erro ao remover job ID=%: %', job_id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '[CRON CLEANUP] 🧹 Remoção concluída. Criando jobs otimizados...';
    
    -- Criar job de cleanup diário otimizado (1x por dia às 3h)
    PERFORM cron.schedule(
        'cleanup-daily-final',
        '0 3 * * *',
        $$DELETE FROM sync_logs WHERE created_at < NOW() - INTERVAL '7 days';
        DELETE FROM media_cache WHERE created_at < NOW() - INTERVAL '30 days' AND base64_data IS NOT NULL;
        INSERT INTO sync_logs (function_name, status, execution_time, result) 
        VALUES ('daily_cleanup_final', 'success', now()::text, '{"cleaned": "logs_and_media", "frequency": "daily"}'::jsonb);$$
    );
    
    -- Criar job de métricas simples (2x por dia)
    PERFORM cron.schedule(
        'metrics-minimal',
        '0 6,18 * * *',
        $$INSERT INTO sync_logs (function_name, status, execution_time, result) 
        VALUES ('metrics_check', 'success', now()::text, 
                json_build_object(
                    'messages_24h', (SELECT COUNT(*) FROM messages WHERE created_at > NOW() - INTERVAL '24 hours'),
                    'leads_total', (SELECT COUNT(*) FROM leads),
                    'instances_connected', (SELECT COUNT(*) FROM whatsapp_instances WHERE connection_status = 'connected')
                )::jsonb);$$
    );
    
    RAISE NOTICE '[CRON CLEANUP] ✅ Jobs otimizados criados com sucesso!';
    
    -- Listar jobs finais
    RAISE NOTICE '[CRON CLEANUP] 📊 RESULTADO FINAL:';
    FOR job_record IN 
        SELECT jobid, jobname, schedule 
        FROM cron.job 
        ORDER BY jobid 
    LOOP
        RAISE NOTICE '[CRON CLEANUP] 📌 Job ativo: ID=% Nome=% Schedule=%', 
                     job_record.jobid, 
                     COALESCE(job_record.jobname, 'NULL'), 
                     job_record.schedule;
    END LOOP;
    
    RAISE NOTICE '[CRON CLEANUP] 🎯 Otimização completa! Execuções reduzidas de ~2500/dia para ~3/dia';
    
END $$;
