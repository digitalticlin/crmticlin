
import { MessagingService } from '@/modules/whatsapp/messaging/services/messagingService';
import { Message, Contact } from '@/types/chat';
import { ForwardResult, BulkForwardResult, BulkForwardParams } from '@/types/whatsapp/forward';

export class ForwardService {
  /**
   * Valida se uma mensagem pode ser encaminhada
   */
  static validateForwardable(message: Message): boolean {
    // Não pode encaminhar mensagens com status de erro
    if (message.status === 'failed' || message.status === 'sending') {
      return false;
    }

    // Mensagens vazias não podem ser encaminhadas
    if (!message.text?.trim() && !message.mediaUrl) {
      return false;
    }

    return true;
  }

  /**
   * Encaminha uma mensagem para um contato específico
   */
  static async forwardToContact(
    message: Message,
    contact: Contact,
    instanceId: string,
    additionalComment?: string
  ): Promise<ForwardResult> {
    try {
      console.log('[ForwardService] Encaminhando mensagem para:', {
        contactId: contact.id,
        contactName: contact.name,
        messageId: message.id,
        hasAdditionalComment: !!additionalComment
      });

      // Preparar texto da mensagem
      let forwardText = '';
      
      // Adicionar comentário adicional se houver
      if (additionalComment?.trim()) {
        forwardText += `${additionalComment.trim()}\n\n`;
      }
      
      // Adicionar texto original da mensagem
      if (message.text?.trim()) {
        forwardText += `🔄 _Mensagem encaminhada:_\n${message.text}`;
      } else if (message.mediaUrl) {
        forwardText += `🔄 _Mídia encaminhada_`;
      }

      // Enviar mensagem usando o MessagingService
      const result = await MessagingService.sendMessage({
        instanceId,
        phone: contact.phone,
        message: forwardText,
        mediaType: message.mediaType || 'text',
        mediaUrl: message.mediaUrl
      });

      if (result.success) {
        return {
          success: true,
          messageId: result.messageId,
          contactId: contact.id,
          contactName: contact.name || contact.phone
        };
      } else {
        return {
          success: false,
          error: result.error || 'Erro desconhecido',
          contactId: contact.id,
          contactName: contact.name || contact.phone
        };
      }

    } catch (error: any) {
      console.error('[ForwardService] Erro ao encaminhar:', error);
      return {
        success: false,
        error: error.message || 'Erro ao encaminhar mensagem',
        contactId: contact.id,
        contactName: contact.name || contact.phone
      };
    }
  }

  /**
   * Encaminha uma mensagem para múltiplos contatos
   */
  static async forwardToMultipleContacts(params: BulkForwardParams): Promise<BulkForwardResult> {
    const { message, contacts, additionalComment, instanceId } = params;
    const results: ForwardResult[] = [];

    console.log('[ForwardService] Iniciando encaminhamento em lote:', {
      totalContacts: contacts.length,
      messageId: message.id,
      hasAdditionalComment: !!additionalComment
    });

    // Enviar para cada contato sequencialmente (evitar sobrecarga)
    for (const contact of contacts) {
      try {
        const result = await this.forwardToContact(
          message,
          contact,
          instanceId,
          additionalComment
        );
        
        results.push(result);

        // Pequeno delay entre envios para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error: any) {
        console.error('[ForwardService] Erro no encaminhamento em lote:', error);
        results.push({
          success: false,
          error: error.message || 'Erro desconhecido',
          contactId: contact.id,
          contactName: contact.name || contact.phone
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log('[ForwardService] Encaminhamento em lote concluído:', {
      total: results.length,
      sucessos: successCount,
      falhas: failureCount
    });

    return {
      results,
      successCount,
      failureCount,
      totalCount: results.length
    };
  }
}
