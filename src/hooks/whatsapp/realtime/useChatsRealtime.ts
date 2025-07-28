import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { KanbanTag } from '@/types/kanban';
import { windowEventManager } from '@/utils/eventManager';

interface UseChatsRealtimeProps {
  userId: string | null;
  activeInstanceId: string | null;
  onContactUpdate?: (contactId: string) => void;
  onNewContact?: () => void;
  onContactsRefresh?: () => void;
  // 🚀 NOVAS CALLBACKS GRANULARES - PRIORIDADE MÁXIMA
  onMoveContactToTop?: (contactId: string, newMessage: { text: string; timestamp: string; unreadCount?: number }) => void;
  onUpdateUnreadCount?: (contactId: string, increment?: boolean) => void;
  onAddNewContact?: (contactData: Partial<Contact>) => void;
}

interface UseChatsRealtimeReturn {
  isConnected: boolean;
  totalEvents: number;
  lastUpdate: number | null;
}

export const useChatsRealtime = ({
  userId,
  activeInstanceId,
  onContactUpdate,
  onNewContact,
  onContactsRefresh,
  onMoveContactToTop,
  onUpdateUnreadCount,
  onAddNewContact
}: UseChatsRealtimeProps): UseChatsRealtimeReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [totalEvents, setTotalEvents] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const totalEventsRef = useRef(0);

  useEffect(() => {
    totalEventsRef.current = totalEvents;
  }, [totalEvents]);

  const incrementTotalEvents = useCallback(() => {
    setTotalEvents(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!userId || !activeInstanceId) return;

    console.log('[useChatsRealtime] 🔗 Configurando listeners de eventos globais');

    // Listen for contact updates from messages
    const contactUpdateListener = windowEventManager.addEventListener(
      'lead-tags-updated',
      (data: { leadId: string; tags: KanbanTag[] }) => {
        console.log('[useChatsRealtime] 🏷️ Tags atualizadas:', data);
        if (onContactUpdate) {
          onContactUpdate(data.leadId);
        }
      },
      {} // Fix: Add options parameter
    );

    // Listen for new contacts created via API
    const newContactListener = windowEventManager.addEventListener(
      'new-lead-created',
      () => {
        console.log('[useChatsRealtime] ➕ Novo lead criado via API');
        if (onNewContact) {
          onNewContact();
        }
      },
      {} // Fix: Add options parameter
    );

    // Listen for global tag updates
    const tagsGlobalUpdateListener = windowEventManager.addEventListener(
      'tags-global-update',
      () => {
        console.log('[useChatsRealtime] 🔄 Tags globais atualizadas');
        if (onContactsRefresh) {
          onContactsRefresh();
        }
      },
      {} // Fix: Add options parameter
    );

    // Listen for contact moves (FASE 1)
    const moveContactToTopListener = windowEventManager.addEventListener(
      'move-contact-to-top',
      (data: { contactId: string; messageInfo: { text: string; timestamp: string; unreadCount?: number } }) => {
        console.log('[useChatsRealtime] 🔝 Movendo contato para o topo:', data);
        if (onMoveContactToTop) {
          onMoveContactToTop(data.contactId, data.messageInfo);
        }
      },
      {} // Fix: Add options parameter
    );

    // Listen for unread count updates (FASE 1)
    const updateUnreadCountListener = windowEventManager.addEventListener(
      'update-unread-count',
      (data: { contactId: string; increment: boolean }) => {
        console.log('[useChatsRealtime] 🔢 Atualizando contador não lidas:', data);
        if (onUpdateUnreadCount) {
          onUpdateUnreadCount(data.contactId, data.increment);
        }
      },
      {} // Fix: Add options parameter
    );

    // Listen for new contact additions (FASE 1)
    const addNewContactListener = windowEventManager.addEventListener(
      'add-new-contact',
      (data: { contactData: Partial<Contact> }) => {
        console.log('[useChatsRealtime] ➕ Adicionando novo contato:', data);
        if (onAddNewContact) {
          onAddNewContact(data.contactData);
        }
      },
      {} // Fix: Add options parameter
    );

    setIsConnected(true);
    console.log('[useChatsRealtime] ✅ Conectado aos eventos globais');

    return () => {
      windowEventManager.removeEventListener(contactUpdateListener);
      windowEventManager.removeEventListener(newContactListener);
      windowEventManager.removeEventListener(tagsGlobalUpdateListener);
      windowEventManager.removeEventListener(moveContactToTopListener);
      windowEventManager.removeEventListener(updateUnreadCountListener);
      windowEventManager.removeEventListener(addNewContactListener);
      setIsConnected(false);
      console.log('[useChatsRealtime] ❌ Desconectado dos eventos globais');
    };
  }, [userId, activeInstanceId, onContactUpdate, onNewContact, onContactsRefresh]);

  return {
    isConnected,
    totalEvents,
    lastUpdate
  };
};
