
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
  isSending: boolean;
  onEditLead: () => void;
}

export const WhatsAppChatArea = ({
  selectedContact,
  messages,
  onSendMessage,
  onBack,
  isLoadingMessages,
  isSending,
  onEditLead
}: WhatsAppChatAreaProps) => {
  return (
    <div className="h-full flex flex-col bg-white/5 backdrop-blur-sm relative z-10">
      <WhatsAppChatHeader 
        selectedContact={selectedContact} 
        onBack={onBack}
        onEditLead={onEditLead}
      />
      <WhatsAppMessagesList 
        messages={messages} 
        isLoading={isLoadingMessages}
      />
      <WhatsAppMessageInput 
        onSendMessage={onSendMessage} 
        isSending={isSending}
      />
    </div>
  );
};
