
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { toast } from "sonner";
import { WhatsAppWebInstance } from "./useWhatsAppWebInstances";

export const useInstanceOperations = () => {
  const deleteInstance = async (instanceId: string) => {
    try {
      const result = await WhatsAppWebService.deleteInstance(instanceId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete instance');
      }

      toast.success('WhatsApp desconectado com sucesso!');
      return true;
      
    } catch (err) {
      console.error('Error deleting instance:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover instância';
      toast.error(errorMessage);
      throw err;
    }
  };

  const refreshQRCode = async (instanceId: string, instances: WhatsAppWebInstance[]) => {
    try {
      const instance = instances.find(i => i.id === instanceId);
      if (!instance?.vps_instance_id) {
        throw new Error('Instance not found');
      }

      const result = await WhatsAppWebService.getQRCode(instance.vps_instance_id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get QR code');
      }

      return result.qrCode;
    } catch (err) {
      console.error('Error refreshing QR code:', err);
      toast.error('Erro ao atualizar QR code');
      throw err;
    }
  };

  const sendMessage = async (instanceId: string, phone: string, message: string) => {
    try {
      const result = await WhatsAppWebService.sendMessage(instanceId, phone, message);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send message');
      }

      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Erro ao enviar mensagem');
      throw err;
    }
  };

  return {
    deleteInstance,
    refreshQRCode,
    sendMessage
  };
};
