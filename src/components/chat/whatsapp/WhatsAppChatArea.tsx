
import { useEffect } from "react";
import { WhatsAppChatHeader } from "./WhatsAppChatHeader";
import { WhatsAppMessagesList } from "./WhatsAppMessagesList";
import { WhatsAppMessageInput } from "./WhatsAppMessageInput";
import { Contact, Message } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { MessageCircle, RefreshCw } from "lucide-react";

interface WhatsAppChatAreaProps {
  selectedContact: Contact;
  messages: Message[];
  onSendMessage: (message: string, mediaType?: string, mediaUrl?: string) => Promise<boolean>;
  onBack: () => void;
  isLoadingMessages: boolean;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  onLoadMoreMessages: () => Promise<void>;
  isSending: boolean;
  onEditLead: () => void;
  onRefreshMessages?: () => void;
  leadId?: string;
  // ✅ NOVOS PROPS PARA LAZY LOADING
  messagesLoaded?: boolean;
  onLoadMessagesOnDemand?: () => Promise<void>;
}

export const WhatsAppChatArea = ({
  selectedContact,
  messages,
  onSendMessage,
  onBack,
  isLoadingMessages,
  isLoadingMore,
  hasMoreMessages,
  onLoadMoreMessages,
  isSending,
  onEditLead,
  onRefreshMessages,
  leadId,
  messagesLoaded = false,
  onLoadMessagesOnDemand
}: WhatsAppChatAreaProps) => {
  
  // ✅ CARREGAR MENSAGENS AUTOMATICAMENTE QUANDO CONTATO É SELECIONADO
  useEffect(() => {
    if (selectedContact && !messagesLoaded && onLoadMessagesOnDemand) {
      console.log('[WhatsApp Chat Area] 🚀 Carregando mensagens automaticamente para:', selectedContact.name);
      onLoadMessagesOnDemand();
    }
  }, [selectedContact?.id, messagesLoaded, onLoadMessagesOnDemand]);

  // ✅ ESTADO QUANDO MENSAGENS NÃO FORAM CARREGADAS
  if (!messagesLoaded && !isLoadingMessages) {
    return (
      <div className="h-full flex flex-col bg-white/5 backdrop-blur-sm relative z-10">
        <WhatsAppChatHeader 
          selectedContact={{
            ...selectedContact,
            leadId
          }}
          onBack={onBack}
          onEditLead={onEditLead}
          onRefreshMessages={onRefreshMessages}
          isRefreshing={false}
        />
        
        {/* ✅ ESTADO VAZIO COM BOTÃO PARA CARREGAR */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-800">
              Conversa com {selectedContact.name}
            </h3>
            <p className="text-gray-600 max-w-md">
              As mensagens serão carregadas automaticamente...
            </p>
            
            {/* ✅ BOTÃO MANUAL SE NECESSÁRIO */}
            {onLoadMessagesOnDemand && (
              <Button
                onClick={onLoadMessagesOnDemand}
                variant="outline"
                className="mt-4"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Carregar Mensagens
              </Button>
            )}
          </div>
        </div>
        
        <WhatsAppMessageInput 
          onSendMessage={onSendMessage} 
          isSending={isSending}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white/5 backdrop-blur-sm relative z-10">
      <WhatsAppChatHeader 
        selectedContact={{
          ...selectedContact,
          leadId
        }}
        onBack={onBack}
        onEditLead={onEditLead}
        onRefreshMessages={onRefreshMessages}
        isRefreshing={isLoadingMessages}
      />
      <WhatsAppMessagesList 
        messages={messages} 
        isLoading={isLoadingMessages}
        isLoadingMore={isLoadingMore}
        hasMoreMessages={hasMoreMessages}
        onLoadMore={onLoadMoreMessages}
      />
      <WhatsAppMessageInput 
        onSendMessage={onSendMessage} 
        isSending={isSending}
      />
    </div>
  );
};
