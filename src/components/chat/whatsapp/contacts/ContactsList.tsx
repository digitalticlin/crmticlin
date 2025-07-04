import React, { useState, useRef, useMemo, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Contact } from "@/types/chat";
import { formatPhoneDisplay } from "@/utils/phoneFormatter";
import { MessageCircle, Clock, TrendingUp } from "lucide-react";
import { ContactTags } from "./ContactTags";
import { useTagsSync } from "@/hooks/whatsapp/useTagsSync";
import { useAuth } from "@/contexts/AuthContext";

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
}

// Função para determinar se deve mostrar nome ou telefone (estilo WhatsApp)
const getDisplayName = (contact: Contact): string => {
  if (contact.name && contact.name !== contact.phone && contact.name.trim() !== '') {
    return contact.name;
  }
  return formatPhoneDisplay(contact.phone);
};

export const ContactsList = React.memo(({
  contacts,
  selectedContact,
  onSelectContact,
  searchQuery,
  activeFilter,
  isLoadingMore = false,
  hasMoreContacts = false,
  onLoadMoreContacts,
  onRefreshContacts
}: ContactsListProps) => {
  const { user } = useAuth();
  const [highlightedContacts, setHighlightedContacts] = useState<Set<string>>(new Set());

  // Usar o hook de sincronização de tags
  useTagsSync(user?.id || null, () => {
    if (onRefreshContacts) {
      onRefreshContacts();
    }
  });

  // Renderização simplificada para teste
  const renderedContacts = useMemo(() => {
    return contacts.map((contact, index) => {
      const hasUnreadMessages = contact.unreadCount && contact.unreadCount > 0;
      const displayName = getDisplayName(contact);
      const isSelected = selectedContact?.id === contact.id;
      
      return (
        <div
          key={contact.id}
          className={cn(
            "p-4 hover:bg-white/20 cursor-pointer transition-all duration-300",
            isSelected && "bg-white/30 border-r-2 border-blue-500"
          )}
          onClick={() => onSelectContact(contact)}
        >
          <div className="flex items-start gap-3">
            {/* Avatar simplificado */}
            <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
              T
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h3 className={cn(
                  "font-medium truncate text-base",
                  hasUnreadMessages ? "text-gray-900 font-semibold" : "text-gray-800"
                )}>
                  {displayName}
                </h3>
                
                {hasUnreadMessages && (
                  <div className="bg-blue-600 text-white rounded-full h-6 min-w-[24px] flex items-center justify-center text-xs font-bold">
                    {contact.unreadCount}
                  </div>
                )}
              </div>
              
              <p className={cn(
                "text-sm truncate",
                hasUnreadMessages ? "text-gray-700 font-medium" : "text-gray-600"
              )}>
                {contact.lastMessage || "Nenhuma mensagem ainda"}
              </p>

              {/* Adicionar tags */}
              <ContactTags tags={contact.tags || []} />
            </div>
          </div>
        </div>
      );
    });
  }, [contacts, selectedContact, onSelectContact]);

  if (contacts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
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
    <div className="flex-1 overflow-y-auto">
      <div className="divide-y divide-gray-200/50">
        {renderedContacts}
        
        {/* Indicador de carregamento mais contatos */}
        {isLoadingMore && (
          <div className="flex justify-center py-4">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b border-gray-400"></div>
              <span>Carregando mais contatos...</span>
            </div>
          </div>
        )}
        
        {/* Indicador de fim dos contatos */}
        {!hasMoreContacts && contacts.length >= 20 && (
          <div className="flex justify-center py-3">
            <span className="text-xs text-gray-400">• • • Todos os contatos carregados • • •</span>
          </div>
        )}
      </div>
    </div>
  );
});

ContactsList.displayName = 'ContactsList';

// EXPORTAÇÃO CORRIGIDA - apenas default export
export default ContactsList;
