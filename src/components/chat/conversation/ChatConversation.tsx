
import { Contact, Message } from "@/types/chat";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { WhatsAppMessagesList } from "@/components/chat/whatsapp/WhatsAppMessagesList";
import { WhatsAppMessageInput } from "@/components/chat/whatsapp/WhatsAppMessageInput";
import { useState } from "react";

interface ChatConversationProps {
  selectedContact: Contact;
  messages: Message[];
  onOpenContactDetails: () => void;
  onBack: () => void;
  onSendMessage: (message: string) => Promise<boolean>;
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
  const [isSending, setIsSending] = useState(false);

  // Wrapper to handle async message sending
  const handleSendMessage = async (message: string): Promise<boolean> => {
    setIsSending(true);
    try {
      const result = await onSendMessage(message);
      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white/5 dark:bg-black/5 backdrop-blur-lg">
      <ChatHeader 
        selectedContact={selectedContact} 
        onOpenContactDetails={onOpenContactDetails}
        onBack={onBack}
        leadId={leadId}
      />
      <WhatsAppMessagesList messages={messages} />
      <WhatsAppMessageInput 
        onSendMessage={handleSendMessage} 
        isSending={isSending}
      />
    </div>
  );
}
