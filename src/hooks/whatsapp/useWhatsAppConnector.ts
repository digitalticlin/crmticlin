
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
      
      // Implementação mais robusta para lidar com erros de API
      let existingInstances = [];
      try {
        existingInstances = await evolutionApiService.fetchInstances();
      } catch (fetchError) {
        console.log("Erro ao buscar instâncias, continuando com lista vazia:", fetchError);
        // Continuamos com lista vazia se não conseguir buscar as instâncias
      }
      
      // Verifica se já existe uma instância com esse nome
      const existingInstance = existingInstances.find(i => 
        i.instanceName && instance.instanceName &&
        i.instanceName.toLowerCase() === instance.instanceName.toLowerCase()
      );
      
      if (existingInstance) {
        console.log(`Instância já existe com nome ${instance.instanceName}, tentando obter QR Code`);
        let qrCodeUrl;
        try {
          // Usar o novo método connectInstance ao invés de refreshQrCode
          qrCodeUrl = await evolutionApiService.connectInstance(instance.instanceName);
          
          if (!qrCodeUrl) {
            throw new Error("QR Code não disponível");
          }
        } catch (qrError) {
          console.error("Erro ao obter QR code de instância existente:", qrError);
          throw new Error("Não foi possível atualizar o QR code para instância existente. Tente novamente mais tarde.");
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
      let result;
      try {
        result = await evolutionApiService.createInstance(instance.instanceName);
        
        if (!result) {
          throw new Error("Resposta inválida da API");
        }
      } catch (createError) {
        console.error("Erro ao criar instância:", createError);
        throw new Error("Não foi possível criar a instância do WhatsApp. Verifique a conexão com o servidor.");
      }
      
      if (!result.qrcode || !result.qrcode.base64) {
        throw new Error("QR Code não disponível na resposta da API");
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
      
      // Buscar novo QR Code usando o método connectInstance
      let qrCodeUrl;
      try {
        qrCodeUrl = await evolutionApiService.connectInstance(instance.instanceName);
        
        if (!qrCodeUrl) {
          throw new Error("QR Code não disponível na resposta da API");
        }
      } catch (refreshError) {
        console.error("Erro ao atualizar QR code:", refreshError);
        throw new Error("Não foi possível obter um novo QR Code. Tente novamente mais tarde.");
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

  // Verificar status de conexão de uma instância
  const checkConnectionStatus = async (instance: WhatsAppInstance) => {
    if (!instance || !instance.instanceName) return false;
    
    try {
      const status = await evolutionApiService.checkInstanceStatus(instance.instanceName);
      const connected = status === 'connected';
      
      updateInstance(instance.id, { connected });
      return connected;
    } catch (error) {
      console.error(`Erro ao verificar status de conexão para ${instance.instanceName}:`, error);
      return false;
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
    checkConnectionStatus,
    handleOperationError
  };
};
