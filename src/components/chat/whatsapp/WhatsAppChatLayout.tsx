
import React from 'react';
import { Contact, Message } from '@/types/chat';
import { WhatsAppContactsList } from './WhatsAppContactsList';
import { WhatsAppMessagesListEnhanced } from './WhatsAppMessagesListEnhanced';
import { WhatsAppChatInput } from './WhatsAppChatInput';
import { WhatsAppChatHeader } from './WhatsAppChatHeader';

interface WhatsAppChatLayoutProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  messages: Message[];
  onSendMessage: (message: string) => Promise<void>;
  isLoadingContacts: boolean;
  isLoadingMoreContacts: boolean;
  hasMoreContacts: boolean;
  onLoadMoreContacts: () => void;
  isLoadingMessages: boolean;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  onLoadMoreMessages: () => void;
  isSending: boolean;
  onRefreshMessages: () => void;
  onRefreshContacts: () => void;
  totalContactsAvailable: number;
}

export const WhatsAppChatLayout: React.FC<WhatsAppChatLayoutProps> = ({
  contacts,
  selectedContact,
  onSelectContact,
  messages,
  onSendMessage,
  isLoadingContacts,
  isLoadingMoreContacts,
  hasMoreContacts,
  onLoadMoreContacts,
  isLoadingMessages,
  isLoadingMore,
  hasMoreMessages,
  onLoadMoreMessages,
  isSending,
  onRefreshMessages,
  onRefreshContacts,
  totalContactsAvailable
}) => {
  return (
    <div className="flex h-full bg-gray-50">
      {/* Lista de contatos */}
      <div className="w-1/3 border-r bg-white">
        <WhatsAppContactsList
          contacts={contacts}
          selectedContact={selectedContact}
          onSelectContact={onSelectContact}
          isLoading={isLoadingContacts}
          isLoadingMore={isLoadingMoreContacts}
          hasMore={hasMoreContacts}
          onLoadMore={onLoadMoreContacts}
          onRefresh={onRefreshContacts}
          totalAvailable={totalContactsAvailable}
        />
      </div>

      {/* Área de chat */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            <WhatsAppChatHeader contact={selectedContact} />
            
            {/* ✅ USANDO COMPONENTE ENHANCED PARA MÍDIA */}
            <div className="flex-1 overflow-hidden">
              <WhatsAppMessagesListEnhanced
                messages={messages}
                isLoading={isLoadingMessages}
                isLoadingMore={isLoadingMore}
                hasMoreMessages={hasMoreMessages}
                onLoadMore={onLoadMoreMessages}
              />
            </div>
            
            <WhatsAppChatInput
              onSendMessage={onSendMessage}
              disabled={isSending}
              placeholder="Digite uma mensagem..."
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecione uma conversa
              </h3>
              <p className="text-gray-500">
                Escolha um contato para começar a conversar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
