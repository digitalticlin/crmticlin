import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { MessagingApi } from '../api/messagingApi';
import { SendMessageParams, SendMessageResult } from '../types/messaging';
import { Contact } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';

/**
 * Hook para funcionalidade de envio de mensagens
 * Interface React para o módulo WhatsApp Messaging
 */
export const useMessaging = () => {
  const [isSending, setIsSending] = useState(false);

  /**
   * Enviar mensagem para um contato específico
   */
  const sendToContact = useCallback(async (
    contact: Contact, 
    instance: WhatsAppWebInstance, 
    message: string
  ): Promise<boolean> => {
    if (!message?.trim()) {
      toast.error('Mensagem não pode estar vazia');
      return false;
    }

    // Validações
    if (!MessagingApi.validateContact(contact)) {
      toast.error('Contato inválido ou sem telefone');
      return false;
    }

    if (!MessagingApi.validateInstance(instance)) {
      toast.error('Instância WhatsApp não conectada');
      return false;
    }

    setIsSending(true);
    
    try {
      const result = await MessagingApi.sendToContact(contact, instance, message);

      if (result.success) {
        toast.success('Mensagem enviada com sucesso!');
        return true;
      } else {
        toast.error(result.error || 'Erro ao enviar mensagem');
        return false;
      }

    } catch (error: any) {
      console.error('[useMessaging] ❌ Erro:', error);
      toast.error(`Erro ao enviar mensagem: ${error.message}`);
      return false;
    } finally {
      setIsSending(false);
    }
  }, []);

  /**
   * Enviar mensagem com parâmetros diretos
   */
  const sendMessage = useCallback(async (params: SendMessageParams): Promise<SendMessageResult | null> => {
    if (!params.message?.trim()) {
      toast.error('Mensagem não pode estar vazia');
      return null;
    }

    setIsSending(true);
    
    try {
      const result = await MessagingApi.sendMessage(params);

      if (result.success) {
        toast.success('Mensagem enviada com sucesso!');
      } else {
        toast.error(result.error || 'Erro ao enviar mensagem');
      }

      return result;

    } catch (error: any) {
      console.error('[useMessaging] ❌ Erro:', error);
      toast.error(`Erro ao enviar mensagem: ${error.message}`);
      return null;
    } finally {
      setIsSending(false);
    }
  }, []);

  return {
    sendToContact,
    sendMessage,
    isSending
  };
}; 