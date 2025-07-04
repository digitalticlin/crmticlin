import { Contact, Message } from "@/types/chat";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessagesList } from "@/components/chat/MessagesList";
import { MessageInput } from "@/components/chat/MessageInput";

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
      <MessagesList messages={messages} />
      <MessageInput onSendMessage={onSendMessage} />
    </div>
  );
}
