import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImportHistoryStatus {
  isImporting: boolean;
  hasBeenImported: boolean;
  lastImportDate: string | null;
  progress: number;
}

export const useImportHistoryStatus = (instanceId: string) => {
  const [status, setStatus] = useState<ImportHistoryStatus>({
    isImporting: false,
    hasBeenImported: false,
    lastImportDate: null,
    progress: 0
  });

  // Verificar se já foi importado anteriormente usando a Edge Function
  useEffect(() => {
    const checkImportStatus = async () => {
      if (!instanceId) return;

      try {
        console.log('[Import History Status] 🔍 Verificando status via Edge Function:', instanceId);
        
        const { data, error } = await supabase.functions.invoke('whatsapp_chat_import', {
          body: {
            action: 'get_import_status',
            instanceId
          }
        });

        if (error) {
          console.error('[Import History Status] ❌ Erro ao buscar status:', error);
          return;
        }

        if (data?.success && data.status) {
          const hasImported = (data.status.contactsImported || 0) > 0 || (data.status.messagesImported || 0) > 0;
          
          setStatus(prev => ({
            ...prev,
            hasBeenImported: hasImported,
            lastImportDate: data.status.lastSyncAt || data.status.instanceCreatedAt
          }));

          console.log('[Import History Status] ✅ Status atualizado:', {
            hasImported,
            contactsImported: data.status.contactsImported,
            messagesImported: data.status.messagesImported,
            lastSync: data.status.lastSyncAt
          });
        }
      } catch (error: any) {
        console.error('[Import History Status] ❌ Erro ao verificar status:', error);
      }
    };

    checkImportStatus();
  }, [instanceId]);

  const startImport = async () => {
    setStatus(prev => ({ ...prev, isImporting: true, progress: 0 }));
    
    try {
      console.log('[Import History] 📚 Iniciando importação para instância:', instanceId);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_chat_import', {
        body: {
          action: 'import_data',
          instanceId,
          importType: 'both', // Importar contatos e mensagens
          batchSize: 50
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na importação');
      }

      if (data?.success) {
        const summary = data.summary;
        toast.success(
          `Importação concluída! ${summary?.totalImported || 0} itens importados`,
          { duration: 5000 }
        );
        
        setStatus(prev => ({
          ...prev,
          isImporting: false,
          hasBeenImported: true,
          lastImportDate: new Date().toISOString(),
          progress: 100
        }));

        return { success: true, data };
      } else {
        throw new Error(data?.error || 'Erro desconhecido na importação');
      }
    } catch (error: any) {
      console.error('[Import History] ❌ Erro na importação:', error);
      toast.error(`Erro na importação: ${error.message}`);
      
      setStatus(prev => ({
        ...prev,
        isImporting: false,
        progress: 0
      }));

      return { success: false, error: error.message };
    }
  };

  return {
    ...status,
    startImport
  };
};
