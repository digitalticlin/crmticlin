
import React from 'react';
import { useWhatsAppChatByPhone } from '@/hooks/whatsapp/useWhatsAppChatByPhone';
import { WhatsAppMessagesListEnhanced } from './WhatsAppMessagesListEnhanced';
import { ChatInputArea } from '../conversation/ChatInputArea';
import { ContactHeader } from '../conversation/ContactHeader';

interface WhatsAppChatPageEnhancedProps {
  selectedContactPhone?: string;
}

export const WhatsAppChatPageEnhanced: React.FC<WhatsAppChatPageEnhancedProps> = ({
  selectedContactPhone = '556299212484' // ✅ USAR O TELEFONE DO SEU TESTE
}) => {
  // Buscar mensagens por telefone
  const {
    data: messages = [],
    isLoading,
    isError,
    error
  } = useWhatsAppChatByPhone({
    phone: selectedContactPhone,
    enabled: !!selectedContactPhone
  });

  // ✅ LOG DE DEBUG PARA ACOMPANHAR CARREGAMENTO
  React.useEffect(() => {
    if (messages.length > 0) {
      const mediaMessages = messages.filter(m => m.mediaType !== 'text');
      console.log('[WhatsAppChatPageEnhanced] 🎯 RENDERIZANDO:', {
        totalMessages: messages.length,
        mediaMessages: mediaMessages.length,
        phone: selectedContactPhone
      });
    }
  }, [messages, selectedContactPhone]);

  if (!selectedContactPhone) {
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
          <p className="text-sm text-gray-400 mt-2">
            Telefone: {selectedContactPhone}
          </p>
        </div>
      </div>
    );
  }

  const mockContact = {
    id: selectedContactPhone,
    name: `Contato ${selectedContactPhone}`,
    phone: selectedContactPhone,
    isOnline: true
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header do contato */}
      <ContactHeader
        contact={mockContact}
        onOpenContactDetails={() => {
          console.log('Abrir detalhes do contato:', mockContact.name);
        }}
      />
      
      {/* ✅ Lista de mensagens ENHANCED - VAI RENDERIZAR MÍDIA CORRETAMENTE */}
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
            // TODO: Implementar lógica de envio
            return true;
          }}
          placeholder={`Digite uma mensagem para ${selectedContactPhone}...`}
          disabled={false}
        />
      </div>

      {/* ✅ DEBUG INFO VISUAL */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-100 p-2 text-xs">
          <strong>DEBUG:</strong> {messages.length} mensagens | 
          Mídia: {messages.filter(m => m.mediaType !== 'text').length} | 
          Com Cache: {messages.filter(m => m.hasMediaCache).length}
        </div>
      )}
    </div>
  );
};
