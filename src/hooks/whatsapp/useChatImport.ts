import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ImportStatus {
  lastSyncAt: string | null;
  contactsImported: number;
  messagesImported: number;
  instanceCreatedAt: string | null;
}

interface ImportResult {
  success: boolean;
  message?: string;
  results?: {
    contacts: { imported: number; message: string };
    messages: { imported: number; message: string };
  };
  summary?: {
    totalImported: number;
    contactsImported: number;
    messagesImported: number;
    source?: string; // 'baileys' | 'puppeteer'
  };
}

export const useChatImport = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  // Buscar status da importação
  const getImportStatus = async (instanceId: string) => {
    try {
      setIsLoadingStatus(true);
      
      console.log('[Chat Import] 🔍 Buscando status da importação:', instanceId);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_chat_import', {
        body: {
          action: 'get_import_status',
          instanceId
        }
      });

      if (error) throw error;

      if (data?.success) {
        setImportStatus(data.status);
        console.log('[Chat Import] ✅ Status obtido:', data.status);
        return data.status;
      } else {
        throw new Error(data?.error || 'Erro ao buscar status');
      }
    } catch (error: any) {
      console.error('[Chat Import] ❌ Erro ao buscar status:', error);
      toast.error(`Erro ao buscar status: ${error.message}`);
      return null;
    } finally {
      setIsLoadingStatus(false);
    }
  };

  // Importar dados manualmente via Baileys (VPS atual)
  const importData = async (
    instanceId: string, 
    importType: 'contacts' | 'messages' | 'both' = 'both',
    batchSize: number = 30
  ): Promise<ImportResult | null> => {
    try {
      setIsImporting(true);
      
      console.log('[Chat Import] 🚀 Iniciando importação via Baileys:', { instanceId, importType, batchSize });
      toast.loading('Iniciando importação...', { id: 'import-progress' });

      const { data, error } = await supabase.functions.invoke('whatsapp_chat_import', {
        body: {
          action: 'import_data',
          instanceId,
          importType,
          batchSize
        }
      });

      if (error) throw error;

      if (data?.success) {
        const summary = data.summary;
        console.log('[Chat Import] ✅ Importação concluída:', summary);
        
        toast.success(
          `Importação concluída! ${summary?.totalImported || 0} itens importados`,
          { id: 'import-progress' }
        );
        
        // Atualizar status após importação
        await getImportStatus(instanceId);
        
        return data;
      } else {
        throw new Error(data?.error || 'Erro na importação');
      }
    } catch (error: any) {
      console.error('[Chat Import] ❌ Erro na importação:', error);
      toast.error(`Erro na importação: ${error.message}`, { id: 'import-progress' });
      return null;
    } finally {
      setIsImporting(false);
    }
  };

  // Sincronização incremental (apenas mensagens novas)
  const syncNewMessages = async (instanceId: string): Promise<ImportResult | null> => {
    try {
      setIsImporting(true);
      
      const lastSyncTimestamp = importStatus?.lastSyncAt || 
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Últimas 24h se nunca sincronizado

      console.log('[Chat Import] 🔄 Sincronizando mensagens novas desde:', lastSyncTimestamp);
      toast.loading('Sincronizando mensagens novas...', { id: 'sync-progress' });

      const { data, error } = await supabase.functions.invoke('whatsapp_chat_import', {
        body: {
          action: 'import_data',
          instanceId,
          importType: 'messages',
          batchSize: 50,
          lastSyncTimestamp
        }
      });

      if (error) throw error;

      if (data?.success) {
        const messagesImported = data.results?.messages?.imported || 0;
        
        if (messagesImported > 0) {
          toast.success(
            `${messagesImported} novas mensagens sincronizadas`,
            { id: 'sync-progress' }
          );
        } else {
          toast.info('Nenhuma mensagem nova encontrada', { id: 'sync-progress' });
        }
        
        // Atualizar status
        await getImportStatus(instanceId);
        
        return data;
      } else {
        throw new Error(data?.error || 'Erro na sincronização');
      }
    } catch (error: any) {
      console.error('[Chat Import] ❌ Erro na sincronização:', error);
      toast.error(`Erro na sincronização: ${error.message}`, { id: 'sync-progress' });
      return null;
    } finally {
      setIsImporting(false);
    }
  };

  return {
    isImporting,
    importStatus,
    isLoadingStatus,
    getImportStatus,
    importData,
    syncNewMessages
  };
};
