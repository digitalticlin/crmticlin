/**
 * 👁️ READ MESSAGES SERVICE - SINCRONIZAÇÃO CRM-WHATSAPP
 * 
 * Serviço responsável por sincronizar mensagens lidas entre CRM e WhatsApp nativo
 * Quando usuário abre uma conversa no CRM, marca as mensagens como lidas no WhatsApp
 */

import { supabase } from '@/integrations/supabase/client';

interface ReadMessagesRequest {
  action: "mark_as_read";
  instanceId: string;
  conversationId: string;
  messageIds: string[];
  userId?: string;
}

interface ReadMessagesResponse {
  success: boolean;
  conversationId: string;
  instanceId: string;
  markedCount: number;
  skippedSent: number;
  jobId?: string;
  userId: string;
  timestamp: string;
  error?: string;
}

class ReadMessagesService {
  private readonly EDGE_FUNCTION_URL = '/functions/v1/readmessages_service';

  /**
   * 👁️ Marca mensagens como lidas no WhatsApp nativo
   * @param instanceId - ID da instância WhatsApp
   * @param conversationId - ID da conversa (lead_id)
   * @param messageIds - Array de IDs das mensagens para marcar como lidas
   * @param userId - ID do usuário (opcional)
   */
  async markMessagesAsRead(
    instanceId: string, 
    conversationId: string, 
    messageIds: string[], 
    userId?: string
  ): Promise<ReadMessagesResponse> {
    console.log('[ReadMessages] 👁️ Iniciando sincronização:', {
      instanceId,
      conversationId,
      messageCount: messageIds.length,
      userId
    });

    try {
      if (!instanceId || !conversationId || !messageIds.length) {
        throw new Error('Campos obrigatórios: instanceId, conversationId, messageIds');
      }

      const payload: ReadMessagesRequest = {
        action: "mark_as_read",
        instanceId,
        conversationId,
        messageIds,
        userId
      };

      console.log('[ReadMessages] 📤 Enviando para edge function:', payload);

      const { data, error } = await supabase.functions.invoke('readmessages_service', {
        body: payload
      });

      if (error) {
        console.error('[ReadMessages] ❌ Erro na edge function:', error);
        throw new Error(`Edge function error: ${error.message}`);
      }

      if (!data.success) {
        console.error('[ReadMessages] ❌ Falha na resposta:', data);
        throw new Error(data.error || 'Falha desconhecida na sincronização');
      }

      console.log('[ReadMessages] ✅ Mensagens sincronizadas:', {
        markedCount: data.markedCount,
        skippedSent: data.skippedSent,
        jobId: data.jobId
      });

      return data;

    } catch (error) {
      console.error('[ReadMessages] ❌ Erro geral:', error);
      throw error;
    }
  }

  /**
   * 📋 Busca mensagens não lidas de uma conversa para sincronizar
   * @param conversationId - ID da conversa
   * @param instanceId - ID da instância WhatsApp  
   * @param userId - ID do usuário
   */
  async getUnreadMessagesForConversation(
    conversationId: string, 
    instanceId: string, 
    userId: string
  ): Promise<string[]> {
    console.log('[ReadMessages] 🔍 Buscando mensagens não lidas:', {
      conversationId,
      instanceId,
      userId
    });

    try {
      // Buscar mensagens recebidas (from_me = false) da conversa
      const { data: messages, error } = await supabase
        .from('messages')
        .select('external_message_id, from_me, text')
        .eq('lead_id', conversationId)
        .eq('whatsapp_number_id', instanceId)
        .eq('created_by_user_id', userId)
        .eq('from_me', false) // Apenas mensagens recebidas
        .order('created_at', { ascending: false })
        .limit(50); // Últimas 50 mensagens recebidas

      if (error) {
        console.error('[ReadMessages] ❌ Erro ao buscar mensagens:', error);
        throw error;
      }

      const messageIds = messages
        ?.filter(msg => msg.external_message_id)
        ?.map(msg => msg.external_message_id) || [];

      console.log('[ReadMessages] 📋 Mensagens encontradas:', {
        totalMessages: messages?.length || 0,
        validMessageIds: messageIds.length
      });

      return messageIds;

    } catch (error) {
      console.error('[ReadMessages] ❌ Erro ao buscar mensagens:', error);
      return [];
    }
  }

  /**
   * 🚀 Sincronização automática ao abrir conversa
   * @param conversationId - ID da conversa
   * @param instanceId - ID da instância WhatsApp
   * @param userId - ID do usuário
   */
  async syncConversationOnOpen(
    conversationId: string, 
    instanceId: string, 
    userId: string
  ): Promise<void> {
    console.log('[ReadMessages] 🚀 Sincronização automática:', {
      conversationId,
      instanceId,
      userId
    });

    try {
      // 1. Buscar mensagens não lidas
      const messageIds = await this.getUnreadMessagesForConversation(
        conversationId, 
        instanceId, 
        userId
      );

      if (messageIds.length === 0) {
        console.log('[ReadMessages] ℹ️ Nenhuma mensagem para sincronizar');
        return;
      }

      // 2. Marcar como lidas no WhatsApp
      const result = await this.markMessagesAsRead(
        instanceId,
        conversationId,
        messageIds,
        userId
      );

      console.log('[ReadMessages] ✅ Sincronização concluída:', {
        markedCount: result.markedCount,
        skippedSent: result.skippedSent
      });

    } catch (error) {
      console.error('[ReadMessages] ❌ Erro na sincronização automática:', error);
      // Não fazer throw - sincronização é opcional
    }
  }
}

export const readMessagesService = new ReadMessagesService();
export default readMessagesService;