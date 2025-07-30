
import React from 'react';
import { useWhatsAppDatabase } from '@/hooks/whatsapp/useWhatsAppDatabase';
import { useWhatsAppChatMessages } from '@/hooks/whatsapp/useWhatsAppChatMessages';
import { WhatsAppMessagesListEnhanced } from './WhatsAppMessagesListEnhanced';
import { ChatInputArea } from '../conversation/ChatInputArea';
import { ContactHeader } from '../conversation/ContactHeader';

interface WhatsAppChatPageEnhancedProps {
  selectedContactId?: string;
}

export const WhatsAppChatPageEnhanced: React.FC<WhatsAppChatPageEnhancedProps> = ({
  selectedContactId
}) => {
  const { selectedContact, activeInstance } = useWhatsAppDatabase();
  
  // Usar o contactId passado por props ou o selecionado no contexto
  const leadId = selectedContactId || selectedContact?.leadId;
  const instanceId = activeInstance?.id;

  // Buscar mensagens com cache de mídia incluído
  const {
    data: messages = [],
    isLoading,
    isError,
    error
  } = useWhatsAppChatMessages({
    leadId,
    instanceId,
    enabled: !!(leadId || instanceId)
  });

  if (!leadId && !instanceId) {
    return (
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
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-red-600 mb-2">
            Erro ao carregar mensagens
          </h3>
          <p className="text-gray-500">
            {error?.message || 'Erro desconhecido'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header do contato */}
      {selectedContact && (
        <ContactHeader
          contact={selectedContact}
          onOpenContactDetails={() => {}}
        />
      )}
      
      {/* Lista de mensagens aprimorada */}
      <div className="flex-1 overflow-hidden">
        <WhatsAppMessagesListEnhanced
          messages={messages}
          isLoading={isLoading}
        />
      </div>
      
      {/* Input de chat */}
      <div className="border-t bg-white p-4">
        <ChatInputArea
          onSendMessage={async (message) => {
            console.log('Enviar mensagem:', message);
            return true;
          }}
          placeholder="Digite uma mensagem..."
          disabled={!selectedContact}
        />
      </div>
    </div>
  );
};
