
import { useState } from 'react';
import { MessageSendingService, SendMessageResult } from '../lib/messageSending';
import { toast } from 'sonner';

export const useMessageSending = () => {
  const [isSending, setIsSending] = useState(false);

  const sendMessage = async (
    instanceId: string, 
    phone: string, 
    message: string
  ): Promise<SendMessageResult | null> => {
    if (!instanceId || !phone || !message.trim()) {
      toast.error('Dados incompletos para envio da mensagem');
      return null;
    }

    setIsSending(true);
    
    try {
      const result = await MessageSendingService.sendMessage({
        instanceId,
        phone,
        message
      });

      if (result.success) {
        toast.success('Mensagem enviada com sucesso!');
      } else {
        toast.error(`Erro ao enviar mensagem: ${result.error}`);
      }

      return result;

    } catch (error: any) {
      console.error('[useMessageSending] ❌ Erro:', error);
      toast.error(`Erro ao enviar mensagem: ${error.message}`);
      return null;
    } finally {
      setIsSending(false);
    }
  };

  return {
    sendMessage,
    isSending
  };
};
