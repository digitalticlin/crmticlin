
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MonitoringStats {
  totalInstances: number;
  connectedInstances: number;
  orphanInstances: number;
  disconnectedInstances: number;
  healthScore: number;
  lastCheck: Date | null;
  vpsStatus: 'online' | 'offline' | 'unknown';
}

/**
 * FASE 3: Monitor contínuo de instâncias (a cada 15s)
 * Sistema de alerta para desconexões
 */
export const useInstanceMonitor = (companyId: string | null) => {
  const [stats, setStats] = useState<MonitoringStats>({
    totalInstances: 0,
    connectedInstances: 0,
    orphanInstances: 0,
    disconnectedInstances: 0,
    healthScore: 100,
    lastCheck: null,
    vpsStatus: 'unknown'
  });

  const [alerts, setAlerts] = useState<string[]>([]);
  const monitorIntervalRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
      }
    };
  }, []);

  // FASE 3: Monitor principal
  const performMonitoring = useCallback(async () => {
    if (!companyId || !isMountedRef.current) return;

    try {
      console.log('[Instance Monitor] 🔍 Executando monitoramento...');

      // 1. Verificar status da VPS
      let vpsStatus: 'online' | 'offline' = 'offline';
      try {
        const vpsResponse = await fetch('http://31.97.24.222:3001/health', {
          headers: { 'Authorization': 'Bearer default-token' },
          signal: AbortSignal.timeout(5000)
        });
        vpsStatus = vpsResponse.ok ? 'online' : 'offline';
      } catch {
        vpsStatus = 'offline';
      }

      // 2. Buscar instâncias da empresa
      const { data: instances, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('company_id', companyId)
        .eq('connection_type', 'web');

      if (error) {
        console.error('[Instance Monitor] ❌ Erro ao buscar instâncias:', error);
        return;
      }

      const totalInstances = instances.length;
      const connectedInstances = instances.filter(i => 
        ['open', 'ready'].includes(i.connection_status)
      ).length;
      const orphanInstances = instances.filter(i => !i.vps_instance_id).length;
      const disconnectedInstances = totalInstances - connectedInstances;

      // 3. Calcular health score
      let healthScore = 100;
      if (totalInstances > 0) {
        healthScore = Math.round((connectedInstances / totalInstances) * 100);
      }
      if (vpsStatus === 'offline') {
        healthScore = Math.max(0, healthScore - 30);
      }
      if (orphanInstances > 0) {
        healthScore = Math.max(0, healthScore - (orphanInstances * 10));
      }

      // 4. Detectar alertas
      const newAlerts: string[] = [];
      
      if (vpsStatus === 'offline') {
        newAlerts.push('VPS WhatsApp está offline');
      }
      
      if (orphanInstances > 0) {
        newAlerts.push(`${orphanInstances} instâncias órfãs detectadas`);
      }
      
      if (healthScore < 50) {
        newAlerts.push('Saúde crítica das conexões WhatsApp');
      }
      
      if (disconnectedInstances > connectedInstances && totalInstances > 0) {
        newAlerts.push('Mais instâncias desconectadas que conectadas');
      }

      // 5. Atualizar estado
      if (isMountedRef.current) {
        setStats({
          totalInstances,
          connectedInstances,
          orphanInstances,
          disconnectedInstances,
          healthScore,
          lastCheck: new Date(),
          vpsStatus
        });

        // Mostrar alertas críticos - check if alert is new
        const currentAlerts = alerts;
        newAlerts.forEach(alert => {
          if (!currentAlerts.includes(alert)) {
            if (healthScore < 30) {
              toast.error(`🚨 ${alert}`);
            } else if (healthScore < 70) {
              toast.warning(`⚠️ ${alert}`);
            }
          }
        });

        setAlerts(newAlerts);
      }

      console.log(`[Instance Monitor] 📊 Saúde: ${healthScore}% | Conectadas: ${connectedInstances}/${totalInstances} | Órfãs: ${orphanInstances}`);

    } catch (error) {
      console.error('[Instance Monitor] 💥 Erro no monitoramento:', error);
    }
  }, [companyId]); // Simplified dependency array

  // FASE 3: Monitor a cada 15 segundos
  useEffect(() => {
    if (!companyId) return;

    console.log('[Instance Monitor] 🚀 Iniciando monitor contínuo (15s)');
    
    // Execução inicial
    performMonitoring();
    
    // Monitor contínuo
    monitorIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        performMonitoring();
      }
    }, 15000); // 15 segundos

    return () => {
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
      }
    };
  }, [companyId, performMonitoring]);

  // Função para forçar check manual
  const forceCheck = useCallback(() => {
    performMonitoring();
  }, [performMonitoring]);

  // Função para limpar alertas
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return {
    stats,
    alerts,
    forceCheck,
    clearAlerts,
    isHealthy: stats.healthScore >= 80,
    isCritical: stats.healthScore < 50
  };
};
