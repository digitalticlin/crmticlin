
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { DualCreationResult } from '@/services/whatsapp/instanceSync';

// Tipos para o resultado da sincronização via auto_sync_instances
interface AutoSyncResult {
  success: boolean;
  syncResults?: {
    vps_instances: number;
    db_instances: number;
    new_instances: number;
    updated_instances: number;
    errors: string[];
  };
  error?: string;
  summary?: string;
}

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
      
      // Usar DualCreationService para criar instância
      const { DualCreationService } = await import('@/services/whatsapp/instanceSync');
      const result = await DualCreationService.createInstanceDual({
        instanceName: params.instanceName || '',
        userEmail: params.userEmail,
        companyId: params.companyId || ''
      });
      
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

  const syncAllInstances = async (): Promise<AutoSyncResult | null> => {
    setIsSyncing(true);
    
    try {
      console.log('[Hook] 🔄 Sincronizando via auto_sync_instances...');
      
      // CORREÇÃO: Usar a Edge Function auto_sync_instances diretamente
      const { data, error } = await supabase.functions.invoke('auto_sync_instances', {
        body: {
          action: 'sync_all_instances',
          source: 'manual_request'
        }
      });

      if (error) {
        throw new Error(`Erro na Edge Function: ${error.message}`);
      }

      if (data?.success) {
        const { syncResults } = data;
        const summary = `${syncResults?.new_instances || 0} novas, ${syncResults?.updated_instances || 0} atualizadas`;
        
        console.log('[Hook] ✅ Sincronização concluída:', syncResults);
        toast.success(`Sincronização concluída! ${summary}`);
        
        return {
          success: true,
          syncResults,
          summary: data.summary
        };
      } else {
        const errorMsg = data?.error || 'Erro desconhecido na sincronização';
        console.error('[Hook] ❌ Falha na sincronização:', errorMsg);
        toast.error(`Erro na sincronização: ${errorMsg}`);
        
        return {
          success: false,
          error: errorMsg
        };
      }
      
    } catch (error: any) {
      console.error('[Hook] ❌ Erro na sincronização:', error);
      toast.error(`Erro: ${error.message}`);
      
      return {
        success: false,
        error: error.message
      };
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
