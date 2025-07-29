import React, { memo, useCallback, useEffect, useState } from 'react';
import { Contact } from '@/types/chat';
import { formatPhoneDisplay } from '@/utils/phoneFormatter';
import { ContactItem } from './ContactItem';
import { ContactContextMenu } from './ContactContextMenu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { InfiniteScrollLoader } from '../loading/InfiniteScrollLoader';

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

const ContactsList = memo(({
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
}: ContactsListProps) => {
  const [contextMenuContact, setContextMenuContact] = useState<Contact | null>(null);

  const handleDeleteConversation = useCallback(async (contactId: string) => {
    try {
      await supabase
        .from('messages')
        .delete()
        .eq('lead_id', contactId);

      await supabase
        .from('leads')
        .delete()
        .eq('id', contactId);

      toast.success('Conversa apagada com sucesso!');
      onRefreshContacts?.();
    } catch (error) {
      console.error('Erro ao apagar conversa:', error);
      toast.error('Erro ao apagar conversa. Tente novamente.');
    } finally {
      setContextMenuContact(null);
    }
  }, [onRefreshContacts]);

  const handleCloseConversation = useCallback(async (contactId: string) => {
    try {
      await supabase
        .from('leads')
        .update({ status: 'closed' })
        .eq('id', contactId);

      toast.success('Conversa fechada com sucesso!');
      onRefreshContacts?.();
    } catch (error) {
      console.error('Erro ao fechar conversa:', error);
      toast.error('Erro ao fechar conversa. Tente novamente.');
    } finally {
      setContextMenuContact(null);
    }
  }, [onRefreshContacts]);

  const handleContactClick = useCallback((contact: Contact) => {
    onSelectContact(contact);
  }, [onSelectContact]);

  const handleContextMenu = useCallback((contact: Contact) => {
    setContextMenuContact(contact);
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenuContact(null);
  }, []);

  if (contacts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-2xl">💬</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            {searchQuery ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {searchQuery ? "Tente pesquisar por outro termo" : "Suas conversas aparecerão aqui"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto glass-scrollbar">
        <div className="divide-y divide-white/10">
          {contacts.map((contact) => (
            <ContactContextMenu
              key={contact.id}
              contact={contact}
              onDeleteConversation={handleDeleteConversation}
              onCloseConversation={handleCloseConversation}
              onClose={handleCloseContextMenu}
            >
              <ContactItem
                contact={contact}
                isSelected={selectedContact?.id === contact.id}
                onClick={() => handleContactClick(contact)}
                onContextMenu={() => handleContextMenu(contact)}
              />
            </ContactContextMenu>
          ))}
        </div>
      </div>

      {/* Infinite scroll loader */}
      {hasMoreContacts && (
        <InfiniteScrollLoader
          isLoading={isLoadingMore}
          onLoadMore={onLoadMoreContacts}
          hasMore={hasMoreContacts}
        />
      )}
    </div>
  );
});

ContactsList.displayName = 'ContactsList';

export default ContactsList;
