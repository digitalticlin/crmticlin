import { useState, useEffect, useCallback } from 'react';
import { WhatsAppWebService } from '@/services/whatsapp/whatsappWebService';

interface SyncState {
  isSyncing: boolean;
  lastSuccess: Date | null;
  lastError: string | null;
  instancesCounted: number;
  instancesSynced: number;
}

export const useIntelligentSync = (refreshInstances: () => void) => {
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    lastSuccess: null,
    lastError: null,
    instancesCounted: 0,
    instancesSynced: 0
  });

  // Find and update the syncInstances function to correctly handle the response structure:

const syncInstances = async () => {
  try {
    setSyncState({ ...syncState, isSyncing: true, lastError: null });
    
    // Log de início
    console.log('[Intelligent Sync] 🔄 Iniciando sincronização inteligente');
    
    // Passo 1: Verificar se servidor está online
    const serverHealth = await WhatsAppWebService.checkServerHealth();
    if (!serverHealth.success) {
      throw new Error('Servidor não está respondendo: ' + (serverHealth.error || 'Erro desconhecido'));
    }
    
    // Passo 2: Buscar instâncias do servidor
    const serverInfo = await WhatsAppWebService.getServerInfo();
    if (!serverInfo.success) {
      throw new Error('Falha ao buscar instâncias: ' + (serverInfo.error || 'Erro desconhecido'));
    }
    
    const remoteInstances = serverInfo.instances || [];
    
    // Converter para o formato padronizado
    const mappedRemoteInstances = remoteInstances.map(instance => ({
      vps_instance_id: instance.instanceId,
      phone: instance.phone || '',
      status: instance.status || 'unknown',
      name: instance.instance_name || instance.instanceName || ''
    }));
    
    console.log(`[Intelligent Sync] 📊 ${mappedRemoteInstances.length} instâncias encontradas no servidor`);

    // Passo 3: Sincronizar com backend via Edge Function
    const syncResult = await WhatsAppWebService.syncInstances();
    
    if (syncResult.success) {
      console.log(`[Intelligent Sync] ✅ Sincronização concluída: ${
        syncResult.data?.updated || 0} instâncias atualizadas`);
      
      setSyncState({
        isSyncing: false,
        lastSuccess: new Date(),
        lastError: null,
        instancesCounted: mappedRemoteInstances.length,
        instancesSynced: syncResult.data?.updated || 0
      });
      
      // Recarregar instâncias após sincronização
      if (refreshInstances) {
        refreshInstances();
      }
      
    } else {
      throw new Error('Falha na sincronização: ' + (syncResult.error || 'Erro desconhecido'));
    }
    
  } catch (error: any) {
    console.error('[Intelligent Sync] ❌ Erro:', error);
    setSyncState({
      ...syncState,
      isSyncing: false,
      lastError: error.message
    });
  }
};

  const debouncedSync = useCallback(() => {
    syncInstances();
  }, [syncInstances]);

  useEffect(() => {
    // Iniciar sincronização a cada 60 segundos
    const intervalId = setInterval(() => {
      if (!syncState.isSyncing) {
        debouncedSync();
      }
    }, 60000);

    // Limpar intervalo ao desmontar
    return () => clearInterval(intervalId);
  }, [debouncedSync, syncState.isSyncing]);

  return {
    ...syncState,
    syncInstances: debouncedSync
  };
};
