
import { toast } from "sonner";
import { evolutionApiService } from "@/services/evolution-api";
import { 
  useWhatsAppInstanceActions,
  WhatsAppInstance 
} from "./whatsappInstanceStore";
import { updateInstanceDisconnectedStatus } from "./useWhatsAppDatabase";

/**
 * Hook for disconnecting WhatsApp instances
 */
export const useWhatsAppDisconnector = () => {
  const { updateInstance, setLoading, setError } = useWhatsAppInstanceActions();
  
  // Delete a WhatsApp instance
  const deleteInstance = async (instance: WhatsAppInstance) => {
    const instanceId = instance.id;
    setLoading(instanceId, true);
    setError(null);
    
    try {
      if (!instance || !instance.instanceName) {
        throw new Error("Instância não encontrada ou nome da instância inválido");
      }
      
      console.log(`Deleting WhatsApp instance: ${instance.instanceName} (ID: ${instanceId})`);
      
      // Make API call to delete instance using the correct URL format
      const success = await evolutionApiService.deleteInstance(instance.instanceName);
      
      if (!success) {
        throw new Error("Falha ao remover instância na API");
      }
      
      // Update in Supabase
      await updateInstanceDisconnectedStatus(instanceId);
      
      // Update local state
      updateInstance(instanceId, {
        connected: false,
        qrCodeUrl: undefined
      });
      
      toast.success("WhatsApp desconectado com sucesso!");
    } catch (error) {
      handleOperationError(error, "desconectar WhatsApp");
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
    deleteInstance
  };
};
