
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
 * Hook for connecting and refreshing WhatsApp instances
 */
export const useWhatsAppConnector = () => {
  const { updateInstance, setLoading, setError } = useWhatsAppInstanceActions();

  // Connect a new WhatsApp instance
  const connectInstance = async (instance: WhatsAppInstance) => {
    const instanceId = instance.id;
    setLoading(instanceId, true);
    setError(null);
    
    try {
      if (!instance) {
        throw new Error("Instância não encontrada");
      }
      
      console.log(`Connecting WhatsApp instance ${instance.instanceName} (ID: ${instanceId})`);
      
      // Create instance in Evolution API
      const result = await evolutionApiService.createInstance(instance.instanceName);
      
      if (!result) {
        throw new Error("Não foi possível criar a instância");
      }
      
      if (!result.qrcode || !result.qrcode.base64) {
        throw new Error("QR Code não disponível");
      }
      
      const qrCodeUrl = result.qrcode.base64;
      console.log(`Successfully generated QR code for ${result.instanceName}`);
      
      // Save to Supabase
      const updatedInstance = await saveInstanceToDatabase(instance, qrCodeUrl, result);
      
      // Update local state with the new QR code
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

  // Refresh QR Code for an instance
  const refreshQrCode = async (instance: WhatsAppInstance) => {
    const instanceId = instance.id;
    setLoading(instanceId, true);
    setError(null);
    
    try {
      if (!instance) {
        throw new Error("Instância não encontrada");
      }
      
      console.log(`Refreshing QR code for instance: ${instance.instanceName} (ID: ${instanceId})`);
      
      // Get new QR Code from Evolution API
      const result = await evolutionApiService.createInstance(instance.instanceName);
      
      if (!result || !result.qrcode || !result.qrcode.base64) {
        throw new Error("Não foi possível obter um novo QR Code");
      }
      
      const qrCodeUrl = result.qrcode.base64;
      
      // Update in Supabase
      await updateQrCodeInDatabase(instanceId, qrCodeUrl);
      
      // Update local state with the new QR code
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

  // Handle operation errors and show toast
  const handleOperationError = (error: any, operation: string) => {
    const errorMessage = error?.message || "Erro desconhecido";
    console.error(`Error during operation: ${operation}:`, error);
    toast.error(`Erro ao ${operation}. ${errorMessage}`);
    setError(`Erro ao ${operation}. ${errorMessage}`);
  };

  return {
    connectInstance,
    refreshQrCode,
    handleOperationError
  };
};
