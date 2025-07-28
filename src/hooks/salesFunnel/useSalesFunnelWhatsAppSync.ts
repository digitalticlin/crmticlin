
/**
 * 🚀 HOOK DE SINCRONIZAÇÃO SALES FUNNEL ↔ WHATSAPP CHAT
 * 
 * Mantém os contadores de mensagens não lidas sincronizados
 * entre o funil de vendas e o WhatsApp Chat
 */

import { useEffect, useCallback } from 'react';
import { KanbanLead } from '@/types/kanban';
import { toast } from 'sonner';

interface SalesFunnelWhatsAppSyncConfig {
  leads: KanbanLead[];
  onLeadUpdate?: (leadId: string, updates: Partial<KanbanLead>) => void;
  enabled?: boolean;
}

export const useSalesFunnelWhatsAppSync = ({
  leads,
  onLeadUpdate,
  enabled = true
}: SalesFunnelWhatsAppSyncConfig) => {
  
  // 🔄 SINCRONIZAR CONTADORES DE MENSAGENS NÃO LIDAS
  const syncUnreadCounts = useCallback(() => {
    if (!enabled || !leads.length) return;

    console.log('[Sales Funnel WhatsApp Sync] 🔄 Sincronizando contadores não lidas:', {
      leadsCount: leads.length,
      leadsWithUnread: leads.filter(l => l.unreadCount && l.unreadCount > 0).length
    });

    // Implementar sincronização real quando necessário
    // Por enquanto, apenas log
  }, [enabled, leads]);

  // 📱 LISTENER PARA EVENTOS DE SELEÇÃO DE CONTATO
  useEffect(() => {
    const handleContactSelected = (event: CustomEvent) => {
      const { contactId } = event.detail;
      
      console.log('[Sales Funnel WhatsApp Sync] 📱 Contato selecionado no WhatsApp:', contactId);
      
      // Encontrar lead correspondente
      const matchingLead = leads.find(lead => 
        lead.id === contactId || 
        lead.whatsapp_number_id === contactId
      );

      if (matchingLead && onLeadUpdate) {
        // Marcar como lido
        onLeadUpdate(matchingLead.id, { unreadCount: 0 });
        
        toast.info(`Conversa com ${matchingLead.name} aberta`, {
          description: "Sincronizado com funil de vendas"
        });
      }
    };

    // Escutar eventos personalizados
    window.addEventListener('whatsapp:contactSelected', handleContactSelected as EventListener);
    
    return () => {
      window.removeEventListener('whatsapp:contactSelected', handleContactSelected as EventListener);
    };
  }, [leads, onLeadUpdate]);

  // 🔄 SINCRONIZAÇÃO AUTOMÁTICA
  useEffect(() => {
    if (enabled) {
      syncUnreadCounts();
    }
  }, [enabled, syncUnreadCounts]);

  // 📤 FUNÇÃO PARA NOTIFICAR WHATSAPP SOBRE MUDANÇAS
  const notifyWhatsApp = useCallback((leadId: string, action: string, data?: any) => {
    console.log('[Sales Funnel WhatsApp Sync] 📤 Notificando WhatsApp:', {
      leadId,
      action,
      data
    });

    // Disparar evento personalizado
    const event = new CustomEvent('salesFunnel:leadUpdate', {
      detail: { leadId, action, data }
    });
    window.dispatchEvent(event);
  }, []);

  return {
    syncUnreadCounts,
    notifyWhatsApp
  };
};
