
import { supabase } from "@/integrations/supabase/client";

/**
 * Serviço para gerenciar mensagens não lidas
 */
export class UnreadMessagesService {
  
  /**
   * Marca todas as mensagens de um lead como lidas (zera contador)
   */
  static async markAsRead(leadId: string): Promise<boolean> {
    try {
      console.log('[Unread Messages Service] Marcando mensagens como lidas para lead:', leadId);
      
      const { error } = await supabase
        .rpc('mark_messages_as_read', { lead_uuid: leadId });
      
      if (error) {
        console.error('[Unread Messages Service] Erro ao marcar como lida:', error);
        return false;
      }
      
      console.log('[Unread Messages Service] ✅ Mensagens marcadas como lidas');
      return true;
    } catch (error) {
      console.error('[Unread Messages Service] Erro inesperado:', error);
      return false;
    }
  }

  /**
   * Incrementa contador de mensagens não lidas
   */
  static async incrementUnreadCount(leadId: string): Promise<boolean> {
    try {
      console.log('[Unread Messages Service] Incrementando contador para lead:', leadId);
      
      const { error } = await supabase
        .rpc('increment_unread_count', { lead_uuid: leadId });
      
      if (error) {
        console.error('[Unread Messages Service] Erro ao incrementar contador:', error);
        return false;
      }
      
      console.log('[Unread Messages Service] ✅ Contador incrementado');
      return true;
    } catch (error) {
      console.error('[Unread Messages Service] Erro inesperado:', error);
      return false;
    }
  }
}
