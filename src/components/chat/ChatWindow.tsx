
import { Contact, Message } from "@/types/chat";
import { ChatHeader } from "./ChatHeader";
import { MessagesList } from "./MessagesList";
import { MessageInput } from "./MessageInput";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface ChatWindowProps {
  contact: Contact;
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isSending: boolean;
  contactNotes: string;
  onNotesChange: (notes: string) => void;
  onSaveNotes: () => void;
}

export const ChatWindow = ({
  contact,
  messages,
  onSendMessage,
  isLoading,
  isSending,
  contactNotes,
  onNotesChange,
  onSaveNotes
}: ChatWindowProps) => {
  const [showContactDetails, setShowContactDetails] = useState(false);

  const handleBack = () => {
    // No mobile, would hide the chat window
    console.log("Back pressed");
  };

  const handleOpenContactDetails = () => {
    setShowContactDetails(!showContactDetails);
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        selectedContact={contact}
        onOpenContactDetails={handleOpenContactDetails}
        onBack={handleBack}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Carregando mensagens...</p>
              </div>
            </div>
          ) : (
            <MessagesList messages={messages} />
          )}
          
          <MessageInput
            onSendMessage={onSendMessage}
            isSending={isSending}
          />
        </div>
        
        {showContactDetails && (
          <div className="w-80 border-l border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
            <h3 className="font-semibold mb-4">Notas do Contato</h3>
            <div className="space-y-3">
              <Textarea
                value={contactNotes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="Adicione notas sobre este contato..."
                className="min-h-[100px]"
              />
              <Button onClick={onSaveNotes} size="sm" className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Salvar Notas
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
