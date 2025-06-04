
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MonitorResult {
  success: boolean;
  results?: {
    monitored: number;
    orphans_found: number;
    adopted: number;
    deleted: number;
    errors: number;
  };
  error?: string;
  timestamp: string;
}

export const useInstanceMonitor = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastResult, setLastResult] = useState<MonitorResult | null>(null);
  const [autoMonitorEnabled, setAutoMonitorEnabled] = useState(false);

  // Executar monitoramento manual
  const runMonitoring = useCallback(async () => {
    console.log('[useInstanceMonitor] 🔍 Executando monitoramento manual...');
    setIsMonitoring(true);

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_monitor');

      if (error) {
        console.error('[useInstanceMonitor] ❌ Erro na edge function:', error);
        toast.error('Erro no monitoramento: ' + error.message);
        return null;
      }

      const result = data as MonitorResult;
      setLastResult(result);

      if (result.success && result.results) {
        const { monitored, orphans_found, adopted, deleted, errors } = result.results;
        
        console.log('[useInstanceMonitor] 📊 Resultado:', result.results);
        
        if (adopted > 0 || deleted > 0) {
          toast.success(
            `Monitoramento concluído: ${adopted} órfãs adotadas, ${deleted} limpas`
          );
        } else if (orphans_found === 0) {
          toast.success('Todas as instâncias estão sincronizadas!');
        } else {
          toast.info(`${monitored} instâncias monitoradas, ${orphans_found} órfãs encontradas`);
        }

        if (errors > 0) {
          toast.warning(`${errors} erros durante o monitoramento`);
        }
      } else {
        toast.error('Falha no monitoramento: ' + (result.error || 'Erro desconhecido'));
      }

      return result;

    } catch (error: any) {
      console.error('[useInstanceMonitor] ❌ Erro inesperado:', error);
      toast.error('Erro inesperado no monitoramento');
      return null;
    } finally {
      setIsMonitoring(false);
    }
  }, []);

  // Auto-monitoramento (opcional)
  useEffect(() => {
    if (!autoMonitorEnabled) return;

    console.log('[useInstanceMonitor] ⏰ Auto-monitoramento ativado');
    
    const interval = setInterval(() => {
      if (!isMonitoring) {
        console.log('[useInstanceMonitor] 🔄 Executando auto-monitoramento...');
        runMonitoring();
      }
    }, 120000); // 2 minutos

    return () => {
      clearInterval(interval);
      console.log('[useInstanceMonitor] 🧹 Auto-monitoramento desativado');
    };
  }, [autoMonitorEnabled, isMonitoring, runMonitoring]);

  return {
    isMonitoring,
    lastResult,
    autoMonitorEnabled,
    runMonitoring,
    enableAutoMonitor: () => setAutoMonitorEnabled(true),
    disableAutoMonitor: () => setAutoMonitorEnabled(false)
  };
};
