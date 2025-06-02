
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
}

export const WhatsAppChatArea = ({
  selectedContact,
  messages,
  onSendMessage,
  onBack,
  isLoadingMessages,
  isSending
}: WhatsAppChatAreaProps) => {
  return (
    <div className="h-full flex flex-col bg-[#0b141a]">
      <WhatsAppChatHeader 
        selectedContact={selectedContact} 
        onBack={onBack}
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
