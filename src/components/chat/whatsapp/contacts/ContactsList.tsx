
import React, { useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { ContactItem } from './ContactItem';
import { Contact } from '@/types/chat';
import { cn } from '@/lib/utils';

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
}

const ContactsList: React.FC<ContactsListProps> = ({
  contacts,
  selectedContact,
  onSelectContact,
  searchQuery,
  activeFilter,
  isLoadingMore = false,
  hasMoreContacts = false,
  onLoadMoreContacts,
  onRefreshContacts,
  totalContactsAvailable = 0
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // ✅ SCROLL INFINITO: Detectar quando chegou próximo do final
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onLoadMoreContacts || !hasMoreContacts) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

      if (isNearBottom && !isLoadingMore) {
        onLoadMoreContacts();
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [onLoadMoreContacts, hasMoreContacts, isLoadingMore]);

  if (contacts.length === 0 && searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-gray-600 mb-2">Nenhum contato encontrado</p>
        <p className="text-sm text-gray-500">Tente buscar por outro termo</p>
      </div>
    );
  }

  if (contacts.length === 0 && activeFilter !== 'all') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-gray-600 mb-2">Nenhum contato nesta categoria</p>
        <p className="text-sm text-gray-500">Selecione "Todas" para ver todos os contatos</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto glass-scrollbar"
    >
      {/* Lista de contatos */}
      <div className="divide-y divide-white/10 p-2">
        {contacts.map((contact) => (
          <ContactItem
            key={contact.id}
            contact={contact}
            isSelected={selectedContact?.id === contact.id}
            onSelect={() => onSelectContact(contact)}
          />
        ))}
      </div>

      {/* Indicador de carregamento para scroll infinito */}
      {isLoadingMore && (
        <div className="flex items-center justify-center p-4">
          <div className="flex items-center space-x-2 text-gray-600">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Carregando mais...</span>
          </div>
        </div>
      )}

      {/* Indicador de fim da lista */}
      {!hasMoreContacts && contacts.length > 0 && (
        <div className="flex items-center justify-center p-4">
          <span className="text-xs text-gray-500">
            {contacts.length} de {totalContactsAvailable || contacts.length} contatos
          </span>
        </div>
      )}
    </div>
  );
};

export default ContactsList;
