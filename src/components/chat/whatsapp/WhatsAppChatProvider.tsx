import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Contact, Message } from '@/types/chat';
import { WhatsAppConnectionStatus } from '@/types/whatsapp';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { useWhatsAppDatabase } from '@/hooks/whatsapp/useWhatsAppDatabase';
import { useWhatsAppContacts } from '@/hooks/whatsapp/useWhatsAppContacts';
import { useWhatsAppChatMessages } from '@/hooks/whatsapp/chat/useWhatsAppChatMessages';
import { useRealtimeLeads } from '@/hooks/chat/useRealtimeLeads';
import { useChatsRealtime, useMessagesRealtime } from '@/hooks/whatsapp/realtime';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppChatContextType {
  // Contatos com paginação
  contacts: Contact[];
  isLoadingContacts: boolean;
  isLoadingMoreContacts: boolean;
  hasMoreContacts: boolean;
  loadMoreContacts: () => Promise<void>;
  moveContactToTop: (contactId: string) => void;
  markAsRead: (contactId: string) => void;
  totalContactsAvailable: number;
  
  // Mensagens com paginação
  messages: Message[];
  isLoadingMessages: boolean;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  isSending: boolean;
  sendMessage: (text: string) => Promise<boolean>;
  loadMoreMessages: () => Promise<void>;
  
  // Contato selecionado
  selectedContact: Contact | null;
  setSelectedContact: (contact: Contact | null) => void;
  
  // Refresh manual
  fetchContacts: () => void;
  fetchMessages: () => void;
  
  // Estado geral
  companyLoading: boolean;
  instanceHealth: {
    score: number;
    isHealthy: boolean;
    connectedInstances: number;
    totalInstances: number;
  };
  
  // 🚀 ESTATÍSTICAS DO SISTEMA MODULAR DE REALTIME
  realtimeStats: {
    chatsConnected: boolean;
    messagesConnected: boolean;
    totalChatsEvents: number;
    totalMessagesEvents: number;
    lastChatsUpdate: number | null;
    lastMessagesUpdate: number | null;
  };
}

const WhatsAppChatContext = createContext<WhatsAppChatContextType | null>(null);

export const useWhatsAppChatContext = () => {
  const context = useContext(WhatsAppChatContext);
  if (!context) {
    throw new Error("useWhatsAppChatContext must be used within WhatsAppChatProvider");
  }
  return context;
};

export const WhatsAppChatProvider = React.memo(({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { userId, loading: companyLoading } = useCompanyData();
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('leadId');
  
  // Estado do contato selecionado
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  
  // Usar sistema de banco de dados estabilizado
  const { 
    instances, 
    getActiveInstance, 
    healthScore, 
    isHealthy,
    totalInstances,
    connectedInstances
  } = useWhatsAppDatabase();
  
  // Memoizar instância ativa para evitar re-cálculos
  const activeInstance = useMemo(() => getActiveInstance(), [instances]);

  // Memoizar conversão de instância para compatibilidade
  const webActiveInstance = useMemo(() => {
    if (!activeInstance) return null;
    
    return {
      id: activeInstance.id,
      instance_name: activeInstance.instance_name,
      connection_type: activeInstance.connection_type || 'web',
      server_url: activeInstance.server_url || '',
      vps_instance_id: activeInstance.vps_instance_id || '',
      web_status: activeInstance.web_status || '',
      connection_status: (activeInstance.connection_status || 'disconnected') as WhatsAppConnectionStatus,
      qr_code: activeInstance.qr_code,
      phone: activeInstance.phone,
      profile_name: activeInstance.profile_name,
      profile_pic_url: activeInstance.profile_pic_url,
      date_connected: activeInstance.date_connected,
      date_disconnected: activeInstance.date_disconnected,
      created_by_user_id: activeInstance.created_by_user_id || '',
      created_at: activeInstance.created_at || new Date().toISOString(),
      updated_at: activeInstance.updated_at || new Date().toISOString(),
      history_imported: false
    };
  }, [activeInstance]);

  // Hook específico para contatos com paginação (CORRIGIDO: userId)
  const {
    contacts,
    isLoadingContacts,
    isLoadingMoreContacts,
    hasMoreContacts,
    fetchContacts,
    loadMoreContacts,
    moveContactToTop,
    markAsRead,
    totalContactsAvailable
  } = useWhatsAppContacts(webActiveInstance, user?.id || null);

  // Hook específico para mensagens com paginação
  const {
    messages,
    isLoadingMessages,
    isLoadingMore,
    hasMoreMessages,
    isSending,
    sendMessage,
    loadMoreMessages,
    fetchMessages
  } = useWhatsAppChatMessages(selectedContact, webActiveInstance);

  // 🚀 NOVO SISTEMA MODULAR DE REALTIME - ISOLADO E OTIMIZADO
  
  // 👥 REALTIME PARA CHATS/CONTATOS
  const chatsRealtimeStats = useChatsRealtime({
    userId: user?.id || null,
    activeInstanceId: webActiveInstance?.id || null,
    onContactUpdate: (contactId: string, messageText?: string) => {
      console.log('[WhatsApp Chat] 🔝 Movendo contato para topo:', contactId);
      moveContactToTop(contactId);
    },
    onNewContact: (contact) => {
      console.log('[WhatsApp Chat] 👤 Novo contato recebido:', contact.name);
      // moveContactToTop já é chamado via onContactUpdate
    },
    onContactsRefresh: () => {
      console.log('[WhatsApp Chat] 🔄 Refresh suave de contatos');
      fetchContacts(); // Refresh sem resetar paginação
    }
  });

  // 💬 REALTIME PARA MENSAGENS
  const messagesRealtimeStats = useMessagesRealtime({
    selectedContactId: selectedContact?.id || null,
    activeInstanceId: webActiveInstance?.id || null,
    onMessageUpdate: (message) => {
      console.log('[WhatsApp Chat] 📨 Mensagem atualizada:', message.id);
      // fetchMessages já atualiza a lista automaticamente
    },
    onNewMessage: (message) => {
      console.log('[WhatsApp Chat] 📨 Nova mensagem recebida:', message.id);
      fetchMessages(); // Carregar mensagem na lista
    },
    onMessagesRefresh: () => {
      console.log('[WhatsApp Chat] 🔄 Refresh de mensagens');
      fetchMessages();
    }
  });

  // ❌ DESABILITADO TEMPORARIAMENTE: Sistema conflitante
  // useRealtimeLeads({
  //   selectedContact,
  //   fetchContacts,
  //   fetchMessages,
  //   receiveNewLead: (lead) => {
  //     console.log('[WhatsApp Chat] ⚠️ useRealtimeLeads depreciado - migrando para sistema modular');
  //   },
  //   activeInstanceId: webActiveInstance?.id || null
  // });

  // ❌ REMOVIDO: Subscription duplicada que estava causando conflito
  /*
  useEffect(() => {
    if (!webActiveInstance?.id || !user?.id) return;

    console.log('[WhatsApp Chat] 🔄 Configurando subscription para mensagens');

    const channel = supabase
      .channel(`chat-messages-${webActiveInstance.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `whatsapp_number_id=eq.${webActiveInstance.id}`
        },
        (payload) => {
          console.log('[WhatsApp Chat] 📨 Nova mensagem recebida:', payload.new);
          
          const leadId = payload.new?.lead_id;
          const messageText = payload.new?.text || payload.new?.body || '';
          
          if (leadId) {
            console.log('[WhatsApp Chat] 🔄 Movendo contato para topo:', leadId);
            
            // ✅ CORREÇÃO: Apenas mover contato para topo SEM resetar lista
            moveContactToTop(leadId, messageText);
            
            // ❌ REMOVIDO: fetchContacts(true) que reseta a paginação
            // ✅ O moveContactToTop já atualiza o contato específico
          }
        }
      )
      .subscribe((status) => {
        console.log('[WhatsApp Chat] 📡 Subscription status:', status);
      });

    return () => {
      console.log('[WhatsApp Chat] 🔌 Removendo subscription');
      supabase.removeChannel(channel);
    };
  }, [webActiveInstance?.id, user?.id, moveContactToTop]);
  */

  // Função memoizada para selecionar contato e marcar como lido
  const handleSelectContact = useCallback(async (contact: Contact | null) => {
    if (contact && contact.unreadCount && contact.unreadCount > 0) {
      console.log('[WhatsApp Chat Provider] 🔄 Marcando como lida para contato:', contact.name, 'unreadCount:', contact.unreadCount);
      try {
        await markAsRead(contact.id);
        console.log('[WhatsApp Chat Provider] ✅ Contato marcado como lido com sucesso');
        
        // ❌ REMOVIDO: fetchContacts(true) que reseta a paginação
        // ✅ O markAsRead já atualiza o contador específico do contato
      } catch (error) {
        console.error('[WhatsApp Chat Provider] ❌ Erro ao marcar como lido:', error);
      }
    }
    setSelectedContact(contact);
  }, [markAsRead]);

  // Memoizar saúde da instância para evitar re-cálculos
  const instanceHealth = useMemo(() => ({
    score: healthScore,
    isHealthy,
    connectedInstances,
    totalInstances
  }), [healthScore, isHealthy, connectedInstances, totalInstances]);

  // Verificar saúde apenas quando necessário (com debounce mais longo)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const checkHealth = () => {
      // Apenas notificar problemas críticos para reduzir spam
      if (totalInstances > 0 && connectedInstances === 0) {
        toast.error('🚨 Nenhuma instância WhatsApp conectada');
      } else if (activeInstance && ['open', 'ready'].includes(activeInstance.connection_status)) {
        // Sucesso silencioso - sem toast para não poluir interface
      }
    };

    // Debounce maior para evitar toasts excessivos
    timeoutId = setTimeout(checkHealth, 2000);

    return () => clearTimeout(timeoutId);
  }, [activeInstance?.id, totalInstances, connectedInstances]);

  // Auto-selecionar contato quando leadId for fornecido via URL
  useEffect(() => {
    if (leadId && contacts.length > 0 && !selectedContact) {
      const targetContact = contacts.find(contact => contact.id === leadId);
      if (targetContact) {
        handleSelectContact(targetContact);
      }
    }
  }, [leadId, contacts, selectedContact, handleSelectContact]);

  // 🚀 LISTENER PARA ATUALIZAR ETAPA DO CONTATO SELECIONADO EM TEMPO REAL
  useEffect(() => {
    const handleStageUpdate = (event: CustomEvent) => {
      const { leadId: updatedLeadId, newStageId, newStageName } = event.detail;
      
      console.log('[WhatsApp Chat] 🔄 Recebido evento de atualização de etapa:', {
        updatedLeadId,
        newStageId,
        newStageName,
        selectedContactId: selectedContact?.id,
        selectedContactLeadId: selectedContact?.leadId
      });
      
      // Verificar se é o contato selecionado que foi atualizado
      if (selectedContact && selectedContact.leadId === updatedLeadId) {
        console.log('[WhatsApp Chat] ⚡ Atualizando etapa do contato selecionado...');
        
        // Atualizar o contato selecionado com a nova etapa
        const updatedContact = {
          ...selectedContact,
          stageId: newStageId
        };
        
        setSelectedContact(updatedContact);
        
        console.log('[WhatsApp Chat] ✅ Contato selecionado atualizado com nova etapa:', {
          contactName: updatedContact.name,
          newStageId: updatedContact.stageId
        });
      }
    };

    // Adicionar o listener
    window.addEventListener('updateSelectedContactStage', handleStageUpdate as EventListener);

    return () => {
      // Remover o listener na limpeza
      window.removeEventListener('updateSelectedContactStage', handleStageUpdate as EventListener);
    };
  }, [selectedContact]);

  // Memoizar estatísticas do realtime para evitar re-cálculos
  const realtimeStats = useMemo(() => ({
    chatsConnected: chatsRealtimeStats.isConnected,
    messagesConnected: messagesRealtimeStats.isConnected,
    totalChatsEvents: chatsRealtimeStats.totalEvents,
    totalMessagesEvents: messagesRealtimeStats.totalEvents,
    lastChatsUpdate: chatsRealtimeStats.lastUpdate,
    lastMessagesUpdate: messagesRealtimeStats.lastUpdate
  }), [
    chatsRealtimeStats.isConnected,
    chatsRealtimeStats.totalEvents,
    chatsRealtimeStats.lastUpdate,
    messagesRealtimeStats.isConnected,
    messagesRealtimeStats.totalEvents,
    messagesRealtimeStats.lastUpdate
  ]);

  // Memoizar valor do contexto para evitar re-renderizações
  const value = useMemo((): WhatsAppChatContextType => ({
    // Contatos com paginação
    contacts,
    isLoadingContacts,
    isLoadingMoreContacts,
    hasMoreContacts,
    loadMoreContacts,
    moveContactToTop,
    markAsRead,
    totalContactsAvailable,
    
    // Mensagens com paginação
    messages,
    isLoadingMessages,
    isLoadingMore,
    hasMoreMessages,
    isSending,
    sendMessage,
    loadMoreMessages,
    
    // Contato selecionado
    selectedContact,
    setSelectedContact: handleSelectContact,
    
    // Refresh manual
    fetchContacts,
    fetchMessages,
    
    // Estado geral
    companyLoading,
    instanceHealth,
    
    // 🚀 ESTATÍSTICAS DO REALTIME MODULAR
    realtimeStats
  }), [
    contacts,
    isLoadingContacts,
    isLoadingMoreContacts,
    hasMoreContacts,
    loadMoreContacts,
    isLoadingMoreContacts,
    hasMoreContacts,
    loadMoreContacts,
    moveContactToTop,
    markAsRead,
    messages,
    isLoadingMessages,
    isLoadingMore,
    hasMoreMessages,
    isSending,
    sendMessage,
    loadMoreMessages,
    selectedContact,
    handleSelectContact,
    fetchContacts,
    fetchMessages,
    companyLoading,
    instanceHealth,
    totalContactsAvailable,
    realtimeStats
  ]);

  return (
    <WhatsAppChatContext.Provider value={value}>
      {children}
    </WhatsAppChatContext.Provider>
  );
});

WhatsAppChatProvider.displayName = 'WhatsAppChatProvider';
