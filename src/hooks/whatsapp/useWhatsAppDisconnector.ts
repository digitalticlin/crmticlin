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

      // Tenta apagar na Evolution API
      let deleted = false;
      try {
        const success = await evolutionApiService.deleteInstance(instanceName);
        deleted = !!success;
      } catch (err) {
        // Ainda tenta remover do supabase mesmo se der erro
        console.warn("Erro ao remover na Evolution, mas continuará exclusão local.");
      }

      // Remove do Supabase mesmo se der erro na API externa
      await supabase.from('whatsapp_numbers').delete().eq('id', instanceId);

      updateInstance(instanceId, {
        connected: false,
        qrCodeUrl: undefined
      });

      toast.success("WhatsApp desconectado e removido com sucesso!");

    } catch (error: any) {
      // Remove localmente mesmo se erro for irreversível
      await updateInstanceDisconnectedStatus(instanceId);
      updateInstance(instanceId, {
        connected: false,
        qrCodeUrl: undefined
      });
      toast.success("Instância removida do painel.");
      setError(null);
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
