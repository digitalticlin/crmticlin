
/**
 * 🎯 HOOK ISOLADO APENAS PARA ENVIO DE MENSAGENS
 * 
 * RESPONSABILIDADES:
 * ✅ Enviar mensagens via Edge Function
 * ✅ Validação de parâmetros
 * ✅ Feedback de status ao usuário
 * ✅ NÃO interfere com real-time
 * ✅ NÃO manipula lista de mensagens
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MessagingService } from '@/modules/whatsapp/messaging/services/messagingService';
import { Contact } from '@/types/chat';

interface WhatsAppInstance {
  id: string;
  instance_name: string;
  connection_status: string;
}

interface UseSendMessageParams {
  selectedContact: Contact | null;
  activeInstance: WhatsAppInstance | null;
}

interface UseSendMessageReturn {
  isSending: boolean;
  sendMessage: (text: string, mediaType?: string, mediaUrl?: string) => Promise<boolean>;
}

type MediaType = 'audio' | 'video' | 'image' | 'text' | 'document';

export const useSendMessage = ({
  selectedContact,
  activeInstance
}: UseSendMessageParams): UseSendMessageReturn => {
  const { user } = useAuth();
  const [isSending, setIsSending] = useState(false);

  const sendMessage = useCallback(async (
    text: string, 
    mediaType?: string, 
    mediaUrl?: string
  ): Promise<boolean> => {
    console.log('[useSendMessage] 🚀 Enviando mensagem ISOLADA:', {
      hasContact: !!selectedContact,
      hasInstance: !!activeInstance,
      hasUser: !!user,
      textLength: text?.trim()?.length || 0,
      mediaType
    });

    // ✅ VALIDAÇÕES ISOLADAS
    const leadInstanceId = (selectedContact as any)?.whatsapp_number_id;
    const hasInstanceContext = !!activeInstance || !!leadInstanceId;

    if (!selectedContact || !hasInstanceContext || !user) {
      console.warn('[useSendMessage] ❌ Validação falhou:', {
        hasContact: !!selectedContact,
        hasInstance: !!activeInstance,
        hasLeadInstance: !!leadInstanceId,
        hasUser: !!user
      });
      toast.error('Instância WhatsApp deve estar conectada');
      return false;
    }

    if (!text.trim() && !mediaUrl) {
      toast.error('Mensagem não pode estar vazia');
      return false;
    }

    setIsSending(true);

    try {
      // ✅ DETERMINAR INSTÂNCIA
      const instanceIdToUse = leadInstanceId || activeInstance?.id;
      
      if (!instanceIdToUse) {
        toast.error('Nenhuma instância disponível');
        return false;
      }

      console.log('[useSendMessage] 📤 Chamando MessagingService...');
      
      // ✅ VALIDAR MEDIA TYPE
      const validMediaType: MediaType = (mediaType === 'audio' || mediaType === 'video' || 
                                        mediaType === 'image' || mediaType === 'document') 
                                       ? mediaType as MediaType 
                                       : 'text';
      
      // ✅ ENVIO DIRETO - SEM OTIMISMO
      const result = await MessagingService.sendMessage({
        instanceId: instanceIdToUse,
        phone: selectedContact.phone,
        message: text.trim(),
        mediaType: validMediaType,
        mediaUrl
      });

      console.log('[useSendMessage] ✅ Resultado:', {
        success: result.success,
        error: result.error || 'nenhum',
        messageId: result.messageId || 'indefinido'
      });

      if (result.success) {
        toast.success('Mensagem enviada!');
        return true;
      } else {
        toast.error(result.error || 'Erro ao enviar mensagem');
        return false;
      }

    } catch (error: any) {
      console.error('[useSendMessage] ❌ Erro crítico:', error);
      toast.error(`Erro: ${error.message}`);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [selectedContact, activeInstance, user]);

  return {
    isSending,
    sendMessage
  };
};
