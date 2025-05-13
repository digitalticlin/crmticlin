
import { toast } from "sonner";
import { evolutionApiService } from "@/services/evolution-api";
import { 
  useWhatsAppInstanceActions,
  WhatsAppInstance 
} from "./whatsappInstanceStore";
import {
  saveInstanceToDatabase,
  updateQrCodeInDatabase
} from "./useWhatsAppDatabase";

/**
 * Hook para conectar e atualizar instâncias WhatsApp
 */
export const useWhatsAppConnector = () => {
  const { updateInstance, setLoading, setError } = useWhatsAppInstanceActions();

  // Conectar uma nova instância WhatsApp
  const connectInstance = async (instance: WhatsAppInstance) => {
    const instanceId = instance.id;
    setLoading(instanceId, true);
    setError(null);
    
    try {
      if (!instance) {
        throw new Error("Instância não encontrada");
      }
      
      console.log(`Conectando instância WhatsApp ${instance.instanceName} (ID: ${instanceId})`);
      
      // Verifica primeiro se já existe uma instância com esse nome
      const existingInstances = await evolutionApiService.fetchInstances();
      const existingInstance = existingInstances.find(i => 
        i.instanceName.toLowerCase() === instance.instanceName.toLowerCase()
      );
      
      if (existingInstance) {
        console.log(`Instância já existe com nome ${instance.instanceName}, tentando obter QR Code`);
        const qrCodeUrl = await evolutionApiService.refreshQrCode(instance.instanceName);
        
        if (!qrCodeUrl) {
          throw new Error("Não foi possível obter o QR Code para instância existente");
        }
        
        // Atualiza no Supabase
        await updateQrCodeInDatabase(instanceId, qrCodeUrl);
        
        // Atualiza o estado local com o novo QR code
        updateInstance(instanceId, {
          connected: false,
          qrCodeUrl
        });
        
        toast.success("QR Code atualizado com sucesso!");
        return qrCodeUrl;
      }
      
      // Cria instância na Evolution API
      const result = await evolutionApiService.createInstance(instance.instanceName);
      
      if (!result) {
        throw new Error("Não foi possível criar a instância");
      }
      
      if (!result.qrcode || !result.qrcode.base64) {
        throw new Error("QR Code não disponível");
      }
      
      const qrCodeUrl = result.qrcode.base64;
      console.log(`QR code gerado com sucesso para ${result.instanceName}`);
      
      // Salva no Supabase
      const updatedInstance = await saveInstanceToDatabase(instance, qrCodeUrl, result);
      
      // Atualiza o estado local com o novo QR code
      updateInstance(instanceId, {
        id: updatedInstance.id,
        instanceName: updatedInstance.instance_name,
        connected: false,
        qrCodeUrl
      });
      
      toast.success("QR Code gerado com sucesso!");
      return qrCodeUrl;
    } catch (error: any) {
      const errorMessage = error?.message || "Erro desconhecido";
      handleOperationError(error, `conectar WhatsApp: ${errorMessage}`);
      throw error;
    } finally {
      setLoading(instanceId, false);
    }
  };

  // Atualizar QR Code de uma instância
  const refreshQrCode = async (instance: WhatsAppInstance) => {
    const instanceId = instance.id;
    setLoading(instanceId, true);
    setError(null);
    
    try {
      if (!instance) {
        throw new Error("Instância não encontrada");
      }
      
      console.log(`Atualizando QR code para instância: ${instance.instanceName} (ID: ${instanceId})`);
      
      // Buscar novo QR Code da Evolution API
      const qrCodeUrl = await evolutionApiService.refreshQrCode(instance.instanceName);
      
      if (!qrCodeUrl) {
        throw new Error("Não foi possível obter um novo QR Code");
      }
      
      // Atualiza no Supabase
      await updateQrCodeInDatabase(instanceId, qrCodeUrl);
      
      // Atualiza o estado local com o novo QR code
      updateInstance(instanceId, {
        connected: false,
        qrCodeUrl
      });
      
      toast.success("QR Code atualizado com sucesso!");
      return qrCodeUrl;
    } catch (error) {
      handleOperationError(error, "atualizar QR Code");
      throw error;
    } finally {
      setLoading(instanceId, false);
    }
  };

  // Manipula erros de operação e exibe toast
  const handleOperationError = (error: any, operation: string) => {
    const errorMessage = error?.message || "Erro desconhecido";
    console.error(`Erro durante operação: ${operation}:`, error);
    toast.error(`Erro ao ${operation}. ${errorMessage}`);
    setError(`Erro ao ${operation}. ${errorMessage}`);
  };

  return {
    connectInstance,
    refreshQrCode,
    handleOperationError
  };
};
