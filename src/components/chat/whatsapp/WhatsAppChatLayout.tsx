
import { cn } from "@/lib/utils";
import { WhatsAppContactsList } from "./WhatsAppContactsList";
import { WhatsAppChatArea } from "./WhatsAppChatArea";
import { WhatsAppEmptyState } from "./WhatsAppEmptyState";
import { Contact, Message } from "@/types/chat";

interface WhatsAppChatLayoutProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoadingContacts: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
}

export const WhatsAppChatLayout = ({
  contacts,
  selectedContact,
  onSelectContact,
  messages,
  onSendMessage,
  isLoadingContacts,
  isLoadingMessages,
  isSending
}: WhatsAppChatLayoutProps) => {
  return (
    <div className="h-full flex bg-[#111b21] text-white overflow-hidden">
      {/* Painel Esquerdo - Lista de Conversas */}
      <div className={cn(
        "w-full max-w-[400px] border-r border-[#313d45] flex flex-col bg-[#0b141a]",
        selectedContact ? "hidden lg:flex" : "flex"
      )}>
        <WhatsAppContactsList
          contacts={contacts}
          selectedContact={selectedContact}
          onSelectContact={onSelectContact}
          isLoading={isLoadingContacts}
        />
      </div>

      {/* Painel Direito - Área de Chat */}
      <div className={cn(
        "flex-1 flex flex-col bg-[#0b141a]",
        !selectedContact && "hidden lg:flex"
      )}>
        {selectedContact ? (
          <WhatsAppChatArea
            selectedContact={selectedContact}
            messages={messages}
            onSendMessage={onSendMessage}
            onBack={() => onSelectContact(null)}
            isLoadingMessages={isLoadingMessages}
            isSending={isSending}
          />
        ) : (
          <WhatsAppEmptyState />
        )}
      </div>
    </div>
  );
};
