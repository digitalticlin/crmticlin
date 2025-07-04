import { WhatsAppChatHeader } from "./WhatsAppChatHeader";
import { WhatsAppMessagesList } from "./WhatsAppMessagesList";
import { WhatsAppMessageInput } from "./WhatsAppMessageInput";
import { Contact, Message } from "@/types/chat";

interface WhatsAppChatAreaProps {
  selectedContact: Contact;
  messages: Message[];
  onSendMessage: (message: string) => void;
  onBack: () => void;
  isLoadingMessages: boolean;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  onLoadMoreMessages: () => Promise<void>;
  isSending: boolean;
  onEditLead: () => void;
  onRefreshMessages?: () => void;
  leadId?: string;
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
  leadId
}: WhatsAppChatAreaProps) => {
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
