
import { WhatsAppChatLayout } from "./WhatsAppChatLayout";
import { useWhatsAppChatContext } from "./WhatsAppChatProvider";

export const WhatsAppChatTabs = () => {
  const {
    contacts,
    selectedContact,
    setSelectedContact,
    messages,
    sendMessage,
    isLoadingContacts,
    isLoadingMessages,
    isSending
  } = useWhatsAppChatContext();

  // Wrapper to handle the sendMessage signature difference
  const handleSendMessage = (message: string) => {
    if (selectedContact) {
      sendMessage(message);
    }
  };

  return (
    <div className="h-full flex flex-col relative z-10">
      <WhatsAppChatLayout
        contacts={contacts}
        selectedContact={selectedContact}
        onSelectContact={setSelectedContact}
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoadingContacts={isLoadingContacts}
        isLoadingMessages={isLoadingMessages}
        isSending={isSending}
      />
    </div>
  );
};
