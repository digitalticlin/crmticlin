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
      
      // Verificar se já existem instâncias com o mesmo nome
      let existingInstances = [];
      try {
        existingInstances = await evolutionApiService.fetchInstances();
        console.log("Instâncias existentes:", existingInstances);
      } catch (fetchError) {
        console.log("Erro ao buscar instâncias, continuando com lista vazia:", fetchError);
        // Continuamos com lista vazia se não conseguir buscar as instâncias
      }
      
      // Verificar se já existe uma instância com esse nome e ajustar se necessário
      let finalInstanceName = instance.instanceName;
      let counter = 1;
      
      // Verifica se já existe instância com o mesmo nome e adiciona um número sequencial se necessário
      while(existingInstances.some(i => i.instanceName.toLowerCase() === finalInstanceName.toLowerCase())) {
        finalInstanceName = `${instance.instanceName}${counter}`;
        counter++;
        console.log(`Nome já existe, tentando novo nome: ${finalInstanceName}`);
      }
      
      // Se o nome foi alterado, atualiza a instância
      if (finalInstanceName !== instance.instanceName) {
        console.log(`Nome da instância ajustado de ${instance.instanceName} para ${finalInstanceName}`);
        instance.instanceName = finalInstanceName;
        updateInstance(instanceId, { instanceName: finalInstanceName });
      }
      
      // Cria instância na Evolution API
      console.log(`Criando instância na Evolution API: ${finalInstanceName}`);
      const result = await evolutionApiService.createInstance(finalInstanceName);
      
      if (!result) {
        console.error("API retornou resultado nulo ou vazio");
        throw new Error("Resposta inválida da API");
      }
      
      console.log("Resultado da criação da instância:", result);
      console.log("QR code na resposta:", result.qrcode);
      
      if (!result.qrcode || !result.qrcode.base64) {
        console.error("QR code ausente na resposta da API");
        throw new Error("QR Code não disponível na resposta da API");
      }
      
      const qrCodeUrl = result.qrcode.base64;
      console.log(`QR code gerado com sucesso para ${result.instanceName}`);
      console.log("QR code URL base64 (primeiros 50 caracteres):", qrCodeUrl.substring(0, 50));
      
      // Salva no Supabase
      console.log("Salvando instância no banco de dados com QR code...");
      let updatedInstance;
      
      try {
        updatedInstance = await saveInstanceToDatabase(instance, qrCodeUrl, result);
        console.log("Instância salva no banco de dados:", updatedInstance);
      } catch (dbError) {
        console.error("Erro ao salvar no banco, mas continuando com o QR code:", dbError);
        // Mesmo em caso de erro no banco, ainda retorna o QR code para exibição
      }
      
      // Atualiza o estado local com o novo QR code, mesmo em caso de falha no BD
      updateInstance(instanceId, {
        id: updatedInstance?.id || instanceId,
        instanceName: updatedInstance?.instance_name || instance.instanceName,
        connected: false,
        qrCodeUrl
      });
      
      toast.success("QR Code gerado com sucesso!");
      return qrCodeUrl;
    } catch (error: any) {
      const errorMessage = error?.message || "Erro desconhecido";
      console.error(`Erro completo ao conectar WhatsApp:`, error);
      handleOperationError(error, `conectar WhatsApp: ${errorMessage}`);
      throw error;
    } finally {
      setLoading(instanceId, false);
    }
  };

  // Atualizar QR Code de uma instância usando a conexão forçada
  const refreshQrCode = async (instance: WhatsAppInstance) => {
    const instanceId = instance.id;
    setLoading(instanceId, true);
    setError(null);
    
    try {
      if (!instance) {
        throw new Error("Instância não encontrada");
      }
      
      console.log(`Atualizando QR code para instância: ${instance.instanceName} (ID: ${instanceId})`);
      
      // Usar o novo método de conexão forçada para obter QR code
      console.log(`Usando conexão forçada para gerar novo QR code para: ${instance.instanceName}`);
      const qrCodeUrl = await evolutionApiService.connectInstance(instance.instanceName);
      
      if (!qrCodeUrl) {
        console.error("API não retornou QR code na conexão forçada");
        throw new Error("QR Code não disponível na resposta da API");
      }
      
      console.log("Novo QR code obtido via conexão forçada (primeiros 50 caracteres):", qrCodeUrl.substring(0, 50));
      
      // Atualiza no Supabase
      try {
        console.log("Atualizando QR code no banco de dados...");
        await updateQrCodeInDatabase(instanceId, qrCodeUrl);
      } catch (dbError) {
        console.error("Erro ao atualizar QR code no banco, mas continuando com exibição:", dbError);
        // Continua mesmo em caso de erro no banco
      }
      
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
