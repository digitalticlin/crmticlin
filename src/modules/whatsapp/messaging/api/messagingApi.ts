import { MessagingService } from '../services/messagingService';
import { SendMessageParams, SendMessageResult } from '../types/messaging';
import { Contact } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';

/**
 * API de alto nível para o módulo WhatsApp Messaging
 * Interface simples para componentes da aplicação
 */
export class MessagingApi {
  /**
   * Enviar mensagem usando dados de contato e instância
   */
  static async sendToContact(
    contact: Contact, 
    instance: WhatsAppWebInstance, 
    message: string
  ): Promise<SendMessageResult> {
    if (!contact?.phone) {
      return {
        success: false,
        error: 'Número de telefone do contato não encontrado'
      };
    }

    if (!instance?.id) {
      return {
        success: false,
        error: 'Instância WhatsApp não identificada'
      };
    }

    return this.sendMessage({
      instanceId: instance.id,
      phone: contact.phone,
      message
    });
  }

  /**
   * Enviar mensagem com parâmetros diretos
   */
  static async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
    return MessagingService.sendMessage(params);
  }

  /**
   * Verificar se uma instância pode enviar mensagens
   */
  static validateInstance(instance: WhatsAppWebInstance | null): boolean {
    return !!(instance?.id && instance?.connection_status === 'connected');
  }

  /**
   * Verificar se um contato pode receber mensagens
   */
  static validateContact(contact: Contact | null): boolean {
    return !!(contact?.phone && contact.phone.trim().length > 0);
  }
} 