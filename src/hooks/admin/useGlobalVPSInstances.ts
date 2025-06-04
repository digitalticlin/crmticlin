
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VPSInstance {
  instanceId: string;
  status: string;
  phone?: string;
  profileName?: string;
  profilePictureUrl?: string;
  isOrphan: boolean;
  companyName?: string;
  userName?: string;
  lastSeen?: string;
  companyId?: string;
  userId?: string;
}

export const useGlobalVPSInstances = () => {
  const [instances, setInstances] = useState<VPSInstance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Buscar todas as instâncias VPS
  const fetchInstances = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('[Global VPS Instances] 🔍 Buscando instâncias da VPS...');
      
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: { 
          action: 'list_all_instances_global'
        }
      });

      if (error) {
        console.error('[Global VPS Instances] ❌ Erro:', error);
        toast.error('Erro ao buscar instâncias da VPS');
        return;
      }

      if (data.success) {
        setInstances(data.instances || []);
        setLastUpdate(new Date().toISOString());
        console.log(`[Global VPS Instances] ✅ ${data.instances?.length || 0} instâncias carregadas`);
      } else {
        console.error('[Global VPS Instances] ❌ Falha na busca:', data.error);
        toast.error('Falha ao buscar instâncias: ' + data.error);
      }
    } catch (error: any) {
      console.error('[Global VPS Instances] ❌ Erro inesperado:', error);
      toast.error('Erro inesperado ao buscar instâncias');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Limpar instâncias órfãs
  const cleanupOrphans = useCallback(async () => {
    if (!confirm('Tem certeza que deseja limpar todas as instâncias órfãs? Esta ação não pode ser desfeita.')) {
      return;
    }

    setIsLoading(true);
    try {
      console.log('[Global VPS Instances] 🧹 Limpando instâncias órfãs...');
      
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: { 
          action: 'cleanup_orphan_instances'
        }
      });

      if (error) {
        toast.error('Erro ao limpar instâncias órfãs');
        return;
      }

      if (data.success) {
        toast.success(`${data.deleted || 0} instâncias órfãs removidas`);
        await fetchInstances();
      } else {
        toast.error('Falha na limpeza: ' + data.error);
      }
    } catch (error: any) {
      console.error('[Global VPS Instances] ❌ Erro na limpeza:', error);
      toast.error('Erro inesperado na limpeza');
    } finally {
      setIsLoading(false);
    }
  }, [fetchInstances]);

  // Reconectar instâncias inativas
  const massReconnect = useCallback(async () => {
    const inactiveInstances = instances.filter(i => i.status !== 'open' && !i.isOrphan);
    
    if (inactiveInstances.length === 0) {
      toast.info('Nenhuma instância inativa para reconectar');
      return;
    }

    if (!confirm(`Tentar reconectar ${inactiveInstances.length} instâncias inativas?`)) {
      return;
    }

    setIsLoading(true);
    try {
      console.log('[Global VPS Instances] 🔄 Reconectando instâncias inativas...');
      
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: { 
          action: 'mass_reconnect_instances'
        }
      });

      if (error) {
        toast.error('Erro ao reconectar instâncias');
        return;
      }

      if (data.success) {
        toast.success(`Tentativa de reconexão iniciada para ${data.processed || 0} instâncias`);
        await fetchInstances();
      } else {
        toast.error('Falha na reconexão: ' + data.error);
      }
    } catch (error: any) {
      console.error('[Global VPS Instances] ❌ Erro na reconexão:', error);
      toast.error('Erro inesperado na reconexão');
    } finally {
      setIsLoading(false);
    }
  }, [instances, fetchInstances]);

  // Toggle auto-refresh
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
    toast.info(autoRefresh ? 'Auto-refresh desativado' : 'Auto-refresh ativado');
  }, [autoRefresh]);

  // Refresh manual
  const refreshInstances = useCallback(() => {
    fetchInstances();
  }, [fetchInstances]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (!isLoading) {
        fetchInstances();
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [autoRefresh, isLoading, fetchInstances]);

  // Initial load
  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  return {
    instances,
    isLoading,
    lastUpdate,
    autoRefresh,
    refreshInstances,
    toggleAutoRefresh,
    cleanupOrphans,
    massReconnect
  };
};
