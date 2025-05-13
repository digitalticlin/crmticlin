
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
}

export function ChatConversation({
  selectedContact,
  messages,
  onOpenContactDetails,
  onBack,
  onSendMessage
}: ChatConversationProps) {
  return (
    <div className="h-full flex flex-col bg-white/5 dark:bg-black/5 backdrop-blur-lg">
      <ChatHeader 
        selectedContact={selectedContact} 
        onOpenContactDetails={onOpenContactDetails}
        onBack={onBack}
      />
      <MessagesList messages={messages} />
      <MessageInput onSendMessage={onSendMessage} />
    </div>
  );
}
