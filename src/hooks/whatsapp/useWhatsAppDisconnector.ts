
import { toast } from "sonner";
import { evolutionDeleteInstance } from "./evolutionDeleteInstance";
import { 
  useWhatsAppInstanceActions,
  WhatsAppInstance 
} from "./whatsappInstanceStore";
import { updateInstanceDisconnectedStatus } from "./database";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook para desconectar (remover) instâncias do WhatsApp
 */
export const useWhatsAppDisconnector = () => {
  const { updateInstance, setLoading, setError } = useWhatsAppInstanceActions();
  
  // Deletar uma instância WhatsApp
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

      // Executa o DELETE na Evolution API, somente com o endpoint e header solicitado
      await evolutionDeleteInstance(instanceName);

      // Remove do Supabase mesmo se der erro na API externa
      await supabase.from('whatsapp_instances').delete().eq('id', instanceId);

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

  // Handler de erro em operações (inalterado)
  const handleOperationError = (error: any, operation: string) => {
    const errorMessage = error?.message || "Erro desconhecido";
    console.error(`Error during operation: ${operation}:`, error);
    toast.error(`Erro ao ${operation}. ${errorMessage}`);
    setError(`Erro ao ${operation}. ${errorMessage}`);
  };

  return {
    deleteInstance,
  };
};
