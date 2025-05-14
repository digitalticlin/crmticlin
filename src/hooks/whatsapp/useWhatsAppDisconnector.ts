
import { toast } from "sonner";
import { evolutionApiService } from "@/services/evolution-api";
import { 
  useWhatsAppInstanceActions,
  WhatsAppInstance 
} from "./whatsappInstanceStore";
import { updateInstanceDisconnectedStatus } from "./database";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook for disconnecting WhatsApp instances
 */
export const useWhatsAppDisconnector = () => {
  const { updateInstance, setLoading, setError } = useWhatsAppInstanceActions();
  
  // Delete a WhatsApp instance
  const deleteInstance = async (instanceIdOrInstance: string | WhatsAppInstance) => {
    // Determine if we received an ID or an instance object
    const isInstanceObject = typeof instanceIdOrInstance !== 'string';
    const instanceId = isInstanceObject ? instanceIdOrInstance.id : instanceIdOrInstance;
    const instanceName = isInstanceObject ? instanceIdOrInstance.instanceName : undefined;
    
    setLoading(instanceId, true);
    setError(null);
    
    try {
      if (!instanceName) {
        throw new Error("Instância não encontrada ou nome da instância inválido");
      }
      
      console.log(`Deleting WhatsApp instance: ${instanceName} (ID: ${instanceId})`);
      
      // Faz requisição à Evolution API, depois atualiza Supabase
      const success = await evolutionApiService.deleteInstance(instanceName);

      if (!success) {
        throw new Error("Falha ao remover instância na API");
      }

      // Remove instância no Supabase
      // FAZER: Excluir de fato do banco, não apenas atualizar status
      // Exemplo de exclusão (checar se coluna id é UUID)
      await supabase
        .from('whatsapp_numbers')
        .delete()
        .eq('id', instanceId);

      // Limpar estado local imediatamente
      updateInstance(instanceId, {
        connected: false,
        qrCodeUrl: undefined
      });

      toast.success("WhatsApp desconectado e removido com sucesso!");
    } catch (error: any) {
      // Verifica se é erro "Not Found" (404) na Evolution API
      const message = error?.message?.toLowerCase() || "";
      if (
        message.includes("not found") ||
        (error?.value && (error.value.message || "").toLowerCase().includes("not found"))
      ) {
        // Se o erro for "Not Found", remove localmente mesmo assim
        await updateInstanceDisconnectedStatus(instanceId);
        updateInstance(instanceId, {
          connected: false,
          qrCodeUrl: undefined
        });
        toast.success("Instância já não existe na Evolution. Removida localmente do painel.");
        setError(null);
      } else {
        handleOperationError(error, "desconectar WhatsApp");
        throw error;
      }
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
