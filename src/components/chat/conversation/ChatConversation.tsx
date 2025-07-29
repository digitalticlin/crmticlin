
import { Contact, Message } from "@/types/chat";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { WhatsAppMessagesList } from "@/components/chat/whatsapp/WhatsAppMessagesList";
import { WhatsAppMessageInput } from "@/components/chat/whatsapp/WhatsAppMessageInput";

interface ChatConversationProps {
  selectedContact: Contact;
  messages: Message[];
  onOpenContactDetails: () => void;
  onBack: () => void;
  onSendMessage: (message: string) => void;
  leadId?: string;
}

export function ChatConversation({
  selectedContact,
  messages,
  onOpenContactDetails,
  onBack,
  onSendMessage,
  leadId
}: ChatConversationProps) {
  return (
    <div className="h-full flex flex-col bg-white/5 dark:bg-black/5 backdrop-blur-lg">
      <ChatHeader 
        selectedContact={selectedContact} 
        onOpenContactDetails={onOpenContactDetails}
        onBack={onBack}
        leadId={leadId}
      />
      <WhatsAppMessagesList messages={messages} />
      <WhatsAppMessageInput onSendMessage={onSendMessage} />
    </div>
  );
}
