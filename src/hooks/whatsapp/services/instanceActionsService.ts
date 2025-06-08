
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useInstanceActions = (refreshInstances: () => Promise<void>) => {
  
  const createInstance = async (instanceName: string) => {
    try {
      console.log('[Instance Actions] 🚀 Creating instance v2.0:', instanceName);
      
      // CORREÇÃO: Usar whatsapp_instance_manager com autenticação automática
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'create_instance',
          instanceName: instanceName
        }
      });

      if (error) {
        throw new Error(`Erro na criação: ${error.message}`);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro desconhecido na criação da instância');
      }

      console.log('[Instance Actions] ✅ Instância criada v2.0:', data.instance);
      await refreshInstances();
      
      return data;

    } catch (error: any) {
      console.error('[Instance Actions] ❌ Erro v2.0:', error);
      throw error;
    }
  };

  const deleteInstance = async (instanceId: string) => {
    try {
      console.log('[Instance Actions] 🗑️ Deletando instância v2.0:', instanceId);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'delete_instance',
          instanceId: instanceId
        }
      });

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao deletar instância');
      }

      await refreshInstances();
      toast.success('Instância deletada com sucesso da VPS e banco!');

    } catch (error: any) {
      console.error('[Instance Actions] ❌ Erro ao deletar v2.0:', error);
      toast.error(`Erro ao deletar: ${error.message}`);
      throw error;
    }
  };

  const refreshQRCode = async (instanceId: string) => {
    try {
      console.log('[Instance Actions] 🔄 CORREÇÃO v2.0: Usando whatsapp_qr_service para QR Code:', instanceId);
      
      // CORREÇÃO: Usar whatsapp_qr_service com retry automático
      const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
        body: {
          action: 'generate_qr',
          instanceId: instanceId
        }
      });

      if (error) {
        throw new Error(`Erro na edge function: ${error.message}`);
      }

      if (!data) {
        throw new Error('Resposta vazia da função QR');
      }

      if (!data.success) {
        if (data.waiting) {
          console.log('[Instance Actions] ⏳ QR Code ainda sendo gerado (v2.0)');
          return {
            success: false,
            waiting: true,
            message: data.message || 'QR Code ainda sendo gerado'
          };
        }
        throw new Error(data.error || 'Erro desconhecido ao gerar QR Code');
      }

      console.log('[Instance Actions] ✅ QR Code obtido v2.0 via whatsapp_qr_service');
      await refreshInstances();
      
      return {
        success: true,
        qrCode: data.qrCode
      };

    } catch (error: any) {
      console.error('[Instance Actions] ❌ Erro ao gerar QR Code v2.0:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  return {
    createInstance,
    deleteInstance,
    refreshQRCode
  };
};
