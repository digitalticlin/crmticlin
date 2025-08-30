import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { cn } from "@/lib/utils";
import { Contact } from "@/types/chat";
import { formatPhoneDisplay } from "@/utils/phoneFormatter";
import { MessageCircle, Clock, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContactTags } from "./ContactTags";
import { ContactContextMenu } from "./ContactContextMenu";
import { useTagsSync } from "@/hooks/whatsapp/useTagsSync";
import { useAuth } from "@/contexts/AuthContext";
import { UnreadMessagesService } from "@/services/whatsapp/unreadMessagesService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ContactsListProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  searchQuery: string;
  activeFilter: string;
  isLoadingMore?: boolean;
  hasMoreContacts?: boolean;
  onLoadMoreContacts?: () => Promise<void>;
  onRefreshContacts?: () => void;
  totalContactsAvailable?: number;
  onEditLead?: () => void;
  onDeleteConversation?: (contactId: string) => Promise<void>;
  onCloseConversation?: (contactId: string) => Promise<void>;
}

const getDisplayName = (contact: Contact): string => {
  if (contact.name && contact.name !== contact.phone && contact.name.trim() !== '') {
    return contact.name;
  }
  return formatPhoneDisplay(contact.phone);
};

export const ContactsList = ({
  contacts,
  selectedContact,
  onSelectContact,
  searchQuery,
  activeFilter,
  isLoadingMore = false,
  hasMoreContacts = false,
  onLoadMoreContacts,
  onRefreshContacts,
  totalContactsAvailable,
  onEditLead,
  onDeleteConversation,
  onCloseConversation
}: ContactsListProps) => {
  const { user } = useAuth();
  const [highlightedContacts, setHighlightedContacts] = useState<Set<string>>(new Set());
  
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const lastLoadTimeRef = useRef(0);

  console.log('[ContactsList] Props received:', {
    contactsLength: contacts.length,
    searchQuery,
    activeFilter,
    selectedContactId: selectedContact?.id
  });

  useTagsSync(user?.id || null, () => {
    if (onRefreshContacts) {
      onRefreshContacts();
    }
  });

  const handleEditContact = useCallback((contact: Contact) => {
    onSelectContact(contact);
    if (onEditLead) {
      onEditLead();
    }
  }, [onSelectContact, onEditLead]);

  const handleLoadMore = useCallback(async () => {
    const now = Date.now();
    
    if (!onLoadMoreContacts || !hasMoreContacts || isLoadingRef.current || isLoadingMore) {
      return;
    }

    const timeSinceLastLoad = now - lastLoadTimeRef.current;
    if (timeSinceLastLoad < 1000) {
      return;
    }

    try {
      isLoadingRef.current = true;
      lastLoadTimeRef.current = now;
      await onLoadMoreContacts();
    } catch (error) {
      console.error('[ContactsList] ❌ Erro ao carregar mais contatos:', error);
    } finally {
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 500);
    }
  }, [onLoadMoreContacts, hasMoreContacts, isLoadingMore]);

  const handleSelectContact = async (contact: Contact) => {
    if (contact.unreadCount && contact.unreadCount > 0 && contact.leadId) {
      await UnreadMessagesService.markAsRead(contact.leadId);
    }
    
    onSelectContact(contact);
  };

  useEffect(() => {
    const trigger = loadMoreTriggerRef.current;
    if (!trigger || !hasMoreContacts || !onLoadMoreContacts) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && 
            entry.intersectionRatio > 0.5 && 
            hasMoreContacts && 
            !isLoadingRef.current && 
            !isLoadingMore) {
          handleLoadMore();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.5
      }
    );

    observer.observe(trigger);
    return () => observer.disconnect();
  }, [hasMoreContacts, handleLoadMore, onLoadMoreContacts]);

  const renderedContacts = useMemo(() => {
    console.log('[ContactsList] Rendering contacts:', {
      contactsLength: contacts.length,
      searchQuery,
      activeFilter
    });
    return contacts.map((contact, index) => {
      const hasUnreadMessages = contact.unreadCount && contact.unreadCount > 0;
      const displayName = getDisplayName(contact);
      const isSelected = selectedContact?.id === contact.id;
      
      return (
        <ContactContextMenu
          key={contact.id}
          contact={contact}
          onDeleteConversation={onDeleteConversation}
          onCloseConversation={onCloseConversation}
          onEditContact={handleEditContact}
        >
          <div
            className={cn(
              "p-4 hover:bg-white/20 cursor-pointer transition-all duration-300 border-b border-white/10 group",
              isSelected && "bg-white/30 border-r-2 border-blue-500"
            )}
          >
            <div className="flex items-start gap-3" onClick={() => handleSelectContact(contact)}>
              <div className="relative">
                <div className="h-12 w-12 ring-2 ring-white/10 rounded-full overflow-hidden bg-gray-200">
                  <img 
                    src={contact.profilePicUrl || contact.profile_pic_url || contact.avatar || '/avatar-lead.png'}
                    alt={displayName}
                    className="h-full w-full object-cover rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes('avatar-lead.png')) {
                        target.src = '/avatar-lead.png';
                      }
                    }}
                  />
                </div>
                
                {hasUnreadMessages && contact.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full h-6 min-w-[24px] flex items-center justify-center text-xs font-bold animate-pulse">
                    {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className={cn(
                    "font-medium truncate text-base",
                    hasUnreadMessages ? "text-gray-900 font-semibold" : "text-gray-800"
                  )}>
                    {displayName}
                  </h3>
                  
                  <div className="flex items-center gap-2 ml-2">
                    {contact.lastMessageTime && (
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(contact.lastMessageTime).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                </div>
                
                <p className={cn(
                  "text-sm truncate mb-1",
                  hasUnreadMessages ? "text-gray-700 font-medium" : "text-gray-600"
                )}>
                  {contact.lastMessage || "Nenhuma mensagem ainda"}
                </p>

                <ContactTags tags={contact.tags || []} />
              </div>
            </div>
          </div>
        </ContactContextMenu>
      );
    });
  }, [contacts, selectedContact, handleSelectContact, onDeleteConversation, onCloseConversation, handleEditContact]);

  if (contacts.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
            <MessageCircle className="h-8 w-8 text-blue-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-800">Nenhuma conversa ainda</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {searchQuery 
                ? 'Nenhum contato encontrado para sua pesquisa' 
                : 'Quando você receber mensagens ou iniciar conversas, elas aparecerão aqui'
              }
            </p>
          </div>
          {!searchQuery && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
              💡 Dica: Conecte seu WhatsApp na seção Admin para começar a receber mensagens
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="divide-y divide-gray-200/20">
        {renderedContacts}
        
        {hasMoreContacts && (
          <div
            ref={loadMoreTriggerRef}
            className="h-8 flex items-center justify-center"
          >
            {isLoadingMore ? (
              <div className="flex flex-col items-center space-y-1 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-xs">Carregando...</span>
                </div>
              </div>
            ) : (
              <div className="h-2 w-full bg-transparent"></div>
            )}
          </div>
        )}
        
        {!hasMoreContacts && contacts.length > 0 && (
          <div className="flex flex-col items-center py-6 space-y-2">
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <div className="h-px bg-gray-300 w-8"></div>
              <span>✅ Todos os {totalContactsAvailable || contacts.length} contatos carregados</span>
              <div className="h-px bg-gray-300 w-8"></div>
            </div>
            <div className="text-xs text-gray-400">
              💡 Use a busca para encontrar contatos específicos
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ContactsList.displayName = 'ContactsList';

export default ContactsList;
