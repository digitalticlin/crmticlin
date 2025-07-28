
import React from 'react';
import { Contact, Message } from '@/types/chat';

export interface WhatsAppChatLayoutProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  messages: Message[];
  onSendMessage: (message: string, mediaType?: string, mediaUrl?: string) => Promise<boolean>;
  isLoadingContacts: boolean;
  isLoadingMoreContacts: boolean;
  hasMoreContacts: boolean;
  onLoadMoreContacts: () => Promise<void>;
  isLoadingMessages: boolean;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  onLoadMoreMessages: () => Promise<void>;
  isSending: boolean;
  onRefreshMessages?: () => void;
  onRefreshContacts?: () => void;
  totalContactsAvailable: number;
}

export const WhatsAppChatLayout = ({ 
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
}: WhatsAppChatLayoutProps) => {
  return (
    <div className="flex h-full w-full bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Sidebar - Contacts */}
      <div className="w-1/3 min-w-[300px] max-w-[400px] border-r border-white/20">
        <div className="p-4 bg-white/10 backdrop-blur-sm border-b border-white/20">
          <h2 className="font-semibold text-white">Conversas</h2>
          <p className="text-sm text-white/60">{totalContactsAvailable} contatos</p>
        </div>
        
        <div className="overflow-y-auto h-full">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`p-4 cursor-pointer hover:bg-white/10 border-b border-white/10 ${
                selectedContact?.id === contact.id ? 'bg-white/20' : ''
              }`}
              onClick={() => onSelectContact(contact)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {(contact.name || contact.phone).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-white truncate">
                      {contact.name || contact.phone}
                    </h4>
                    {contact.unreadCount && contact.unreadCount > 0 && (
                      <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {contact.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/60 truncate">
                    {contact.lastMessage || 'Sem mensagens'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* Header */}
            <div className="p-4 bg-white/10 backdrop-blur-sm border-b border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {(selectedContact.name || selectedContact.phone).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-white">
                    {selectedContact.name || selectedContact.phone}
                  </h3>
                  <p className="text-sm text-white/60">Online</p>
                </div>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-green-500 text-white'
                        : 'bg-white text-gray-800'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs mt-1 opacity-70">{message.time}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Input */}
            <div className="p-4 bg-white/10 backdrop-blur-sm border-t border-white/20">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Digite uma mensagem..."
                  className="flex-1 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  disabled={isSending}
                >
                  {isSending ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                Selecione uma conversa
              </h3>
              <p className="text-white/60">
                Escolha um contato para começar a conversar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
