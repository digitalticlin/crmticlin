
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useInstanceActions = (refreshInstances: () => Promise<void>) => {
  
  const createInstance = async (instanceName: string) => {
    try {
      console.log('[Instance Actions] 🚀 Creating instance:', instanceName);
      
      // CORREÇÃO: Usar whatsapp_instance_manager apenas para criar instância
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

      console.log('[Instance Actions] ✅ Instância criada:', data.instance);
      await refreshInstances();
      
      return data;

    } catch (error: any) {
      console.error('[Instance Actions] ❌ Erro:', error);
      throw error;
    }
  };

  const deleteInstance = async (instanceId: string) => {
    try {
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
      toast.success('Instância deletada com sucesso!');

    } catch (error: any) {
      console.error('[Instance Actions] ❌ Erro ao deletar:', error);
      toast.error(`Erro ao deletar: ${error.message}`);
      throw error;
    }
  };

  const refreshQRCode = async (instanceId: string) => {
    try {
      console.log('[Instance Actions] 🔄 CORREÇÃO: Usando whatsapp_qr_service para QR Code:', instanceId);
      
      // CORREÇÃO: Usar whatsapp_qr_service para todo processo de QR Code
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
          console.log('[Instance Actions] ⏳ QR Code ainda sendo gerado');
          return {
            success: false,
            waiting: true,
            message: data.message || 'QR Code ainda sendo gerado'
          };
        }
        throw new Error(data.error || 'Erro desconhecido ao gerar QR Code');
      }

      console.log('[Instance Actions] ✅ QR Code obtido via whatsapp_qr_service');
      await refreshInstances();
      
      return {
        success: true,
        qrCode: data.qrCode
      };

    } catch (error: any) {
      console.error('[Instance Actions] ❌ Erro ao gerar QR Code:', error);
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
