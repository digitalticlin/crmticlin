
import { cn } from "@/lib/utils";
import { Contact, Message } from "@/types/chat";
import { ChatHeader } from "./ChatHeader";
import { MessagesList } from "./MessagesList";
import { MessageInput } from "./MessageInput";

interface ChatAreaProps {
  selectedContact: Contact;
  messages: Message[];
  onOpenContactDetails: () => void;
  onBack: () => void;
  onSendMessage: (message: string) => void;
}

export const ChatArea = ({
  selectedContact,
  messages,
  onOpenContactDetails,
  onBack,
  onSendMessage,
}: ChatAreaProps) => {
  return (
    <div className="h-full flex-1 flex flex-col bg-white/5 dark:bg-black/5 backdrop-blur-lg">
      <ChatHeader 
        selectedContact={selectedContact} 
        onOpenContactDetails={onOpenContactDetails}
        onBack={onBack}
      />
      <MessagesList messages={messages} />
      <MessageInput onSendMessage={onSendMessage} />
    </div>
  );
};
