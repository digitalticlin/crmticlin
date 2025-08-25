
-- Remove os cron jobs do sistema de Broadcast
SELECT cron.unschedule('broadcast-scheduler');
SELECT cron.unschedule('broadcast-sender');

-- Verificar se existem outros jobs relacionados ao broadcast
SELECT jobname, schedule, command 
FROM cron.job 
WHERE jobname LIKE '%broadcast%';
