import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Contact, Message } from '@/types/chat';
import { WhatsAppConnectionStatus } from '@/types/whatsapp';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { useWhatsAppDatabase } from '@/hooks/whatsapp/useWhatsAppDatabase';
import { useWhatsAppContacts } from '@/hooks/whatsapp/useWhatsAppContacts';
import { useWhatsAppChatMessages } from '@/hooks/whatsapp/chat/useWhatsAppChatMessages';
import { useRealtimeLeads } from '@/hooks/chat/useRealtimeLeads';
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
    markAsRead
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

  // Hook para realtime de contatos e mensagens
  // TEMPORARIAMENTE DESABILITADO PARA TESTE
  /*
  useRealtimeLeads({
    selectedContact,
    fetchContacts,
    fetchMessages,
    receiveNewLead: (lead) => {
      console.log('[WhatsApp Chat] 📨 Novo lead recebido:', lead);
      moveContactToTop(lead.id);
    },
    activeInstanceId: webActiveInstance?.id || null
  });
  */

  // Subscription direto para atualização imediata da lista de contatos
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
            
            // Mover contato para topo imediatamente
            moveContactToTop(leadId, messageText);
            
            // Atualizar lista de contatos após um pequeno delay
            setTimeout(() => {
              fetchContacts(true);
            }, 100);
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
  }, [webActiveInstance?.id, user?.id, moveContactToTop, fetchContacts]);

  // Função memoizada para selecionar contato e marcar como lido
  const handleSelectContact = useCallback((contact: Contact | null) => {
    if (contact && contact.unreadCount) {
      markAsRead(contact.id);
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
    instanceHealth
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
    instanceHealth
  ]);

  return (
    <WhatsAppChatContext.Provider value={value}>
      {children}
    </WhatsAppChatContext.Provider>
  );
});

WhatsAppChatProvider.displayName = 'WhatsAppChatProvider';
