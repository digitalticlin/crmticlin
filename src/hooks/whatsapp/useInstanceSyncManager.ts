
import { useState } from 'react';
import { toast } from 'sonner';
import { InstanceSyncManager } from '@/services/whatsapp/instanceSync';
import type { DualCreationResult, SyncResult } from '@/services/whatsapp/instanceSync';

export const useInstanceSyncManager = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const createInstanceDual = async (params: { 
    instanceName?: string; 
    userEmail: string; 
    companyId?: string 
  }): Promise<DualCreationResult | null> => {
    setIsCreating(true);
    
    try {
      console.log('[Hook] 🚀 Criando instância dual:', params);
      
      const result = await InstanceSyncManager.createInstance(params);
      
      if (result.success) {
        if (result.mode === 'dual_success') {
          toast.success('Instância criada com sucesso no banco e VPS!');
        } else if (result.mode === 'db_only') {
          toast.warning('Instância criada no banco. VPS será sincronizada depois.');
        }
      } else {
        toast.error(`Erro ao criar instância: ${result.error}`);
      }
      
      return result;
      
    } catch (error: any) {
      console.error('[Hook] ❌ Erro na criação dual:', error);
      toast.error(`Erro: ${error.message}`);
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  const syncAllInstances = async (): Promise<SyncResult | null> => {
    setIsSyncing(true);
    
    try {
      console.log('[Hook] 🔄 Sincronizando todas as instâncias...');
      
      const result = await InstanceSyncManager.syncAllInstances();
      
      if (result.success && result.data) {
        const { summary } = result.data;
        toast.success(
          `Sincronização concluída! ${summary.added} novas, ${summary.updated} atualizadas`
        );
      } else {
        toast.error(`Erro na sincronização: ${result.error}`);
      }
      
      return result;
      
    } catch (error: any) {
      console.error('[Hook] ❌ Erro na sincronização:', error);
      toast.error(`Erro: ${error.message}`);
      return null;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    createInstanceDual,
    syncAllInstances,
    isCreating,
    isSyncing
  };
};
