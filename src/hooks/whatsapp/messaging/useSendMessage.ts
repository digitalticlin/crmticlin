
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWhatsAppInstances } from '@/hooks/useWhatsAppInstances';
import { toast } from 'sonner';

interface SendMessageParams {
  instanceId: string;
  phone: string;
  message: string;
  mediaType?: 'text' | 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
}

export const useSendMessage = () => {
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuth();
  const { instances } = useWhatsAppInstances();

  const sendMessage = async ({
    instanceId,
    phone,
    message,
    mediaType = 'text',
    mediaUrl
  }: SendMessageParams) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return { success: false, error: 'User not authenticated' };
    }

    const instance = instances.find(inst => inst.id === instanceId);
    if (!instance) {
      toast.error('Instância não encontrada');
      return { success: false, error: 'Instance not found' };
    }

    setIsSending(true);

    try {
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('[useSendMessage] Sending message:', {
        instanceId,
        phone,
        message,
        mediaType,
        mediaUrl
      });

      // Validate mediaType to match expected types
      const validMediaTypes: Array<'text' | 'image' | 'video' | 'audio' | 'document'> = 
        ['text', 'image', 'video', 'audio', 'document'];
      
      const finalMediaType = validMediaTypes.includes(mediaType as any) ? mediaType : 'text';

      toast.success('Mensagem enviada com sucesso!');
      return { 
        success: true, 
        messageId: `msg_${Date.now()}`,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('[useSendMessage] Error:', error);
      toast.error(`Erro ao enviar mensagem: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setIsSending(false);
    }
  };

  return {
    sendMessage,
    isSending
  };
};
