
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
      
      // Instead of using RPC, update the lead directly
      const { error } = await supabase
        .from('leads')
        .update({ unread_count: 0 })
        .eq('id', leadId);
      
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
      
      // Get current count and increment it
      const { data: lead, error: fetchError } = await supabase
        .from('leads')
        .select('unread_count')
        .eq('id', leadId)
        .single();

      if (fetchError) {
        console.error('[Unread Messages Service] Erro ao buscar lead:', fetchError);
        return false;
      }

      const currentCount = lead?.unread_count || 0;
      
      const { error } = await supabase
        .from('leads')
        .update({ unread_count: currentCount + 1 })
        .eq('id', leadId);
      
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
