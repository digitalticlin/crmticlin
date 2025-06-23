
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

  // Verificar se já foi importado anteriormente
  useEffect(() => {
    const checkImportStatus = async () => {
      if (!instanceId) return;

      try {
        // Verificar se há mensagens importadas para esta instância
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('whatsapp_number_id', instanceId);

        // Verificar data da última sincronização
        const { data: instance } = await supabase
          .from('whatsapp_instances')
          .select('updated_at')
          .eq('id', instanceId)
          .single();

        setStatus(prev => ({
          ...prev,
          hasBeenImported: (count || 0) > 0,
          lastImportDate: instance?.updated_at || null
        }));
      } catch (error) {
        console.error('Erro ao verificar status de importação:', error);
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
