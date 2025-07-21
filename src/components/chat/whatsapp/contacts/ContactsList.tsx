
import React, { useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Users, MessageCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Contact } from '@/types/chat';
import { ContactItem } from './ContactItem';
import { cn } from '@/lib/utils';

interface ContactsListProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  searchQuery?: string;
  activeFilter?: string;
  isLoadingMore?: boolean;
  hasMoreContacts?: boolean;
  onLoadMoreContacts?: () => Promise<void>;
  onRefreshContacts?: () => void;
  totalContactsAvailable?: number;
}

const ContactsList: React.FC<ContactsListProps> = ({
  contacts,
  selectedContact,
  onSelectContact,
  searchQuery = '',
  activeFilter = 'all',
  isLoadingMore = false,
  hasMoreContacts = false,
  onLoadMoreContacts,
  onRefreshContacts,
  totalContactsAvailable = 0
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  // Configurar Intersection Observer para carregamento automático
  useEffect(() => {
    if (!hasMoreContacts || !onLoadMoreContacts) return;

    const trigger = loadMoreTriggerRef.current;
    if (!trigger) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoadingMore) {
          console.log('[ContactsList] 🔄 Carregando mais contatos automaticamente');
          onLoadMoreContacts();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    observerRef.current.observe(trigger);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMoreContacts, onLoadMoreContacts, isLoadingMore]);

  // Filtrar contatos baseado na busca
  const filteredContacts = React.useMemo(() => {
    if (!searchQuery) return contacts;
    
    const query = searchQuery.toLowerCase();
    return contacts.filter(contact => 
      contact.name.toLowerCase().includes(query) ||
      contact.phone.includes(query) ||
      (contact.lastMessage && contact.lastMessage.toLowerCase().includes(query))
    );
  }, [contacts, searchQuery]);

  const handleRefresh = useCallback(() => {
    if (onRefreshContacts) {
      onRefreshContacts();
    }
  }, [onRefreshContacts]);

  // Estados de loading e empty
  if (contacts.length === 0 && !isLoadingMore) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <MessageCircle className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhuma conversa ainda
        </h3>
        <p className="text-gray-500 mb-4 max-w-sm">
          Suas conversas do WhatsApp aparecerão aqui quando você receber mensagens
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header com estatísticas */}
      <div className="p-3 border-b border-gray-200 bg-white/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {filteredContacts.length} de {totalContactsAvailable} conversas
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Lista de contatos */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="divide-y divide-gray-100">
          {filteredContacts.map((contact, index) => (
            <ContactItem
              key={contact.id}
              contact={contact}
              isSelected={selectedContact?.id === contact.id}
              onClick={() => onSelectContact(contact)}
              className={cn(
                "transition-colors hover:bg-gray-50",
                selectedContact?.id === contact.id && "bg-blue-50 border-l-4 border-l-blue-500"
              )}
            />
          ))}

          {/* Trigger para carregamento automático */}
          {hasMoreContacts && (
            <div
              ref={loadMoreTriggerRef}
              className="h-1 w-full"
            />
          )}

          {/* Indicador de carregamento */}
          {isLoadingMore && (
            <div className="flex items-center justify-center p-4">
              <div className="flex items-center gap-2 text-gray-500">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Carregando mais...</span>
              </div>
            </div>
          )}

          {/* Indicador de fim */}
          {!hasMoreContacts && contacts.length > 0 && (
            <div className="p-4 text-center">
              <p className="text-xs text-gray-400">
                Todas as conversas foram carregadas
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Estado de busca vazia */}
      {filteredContacts.length === 0 && searchQuery && (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <p className="text-gray-500 mb-2">
              Nenhum resultado para "{searchQuery}"
            </p>
            <p className="text-xs text-gray-400">
              Tente buscar por nome, telefone ou mensagem
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsList;
