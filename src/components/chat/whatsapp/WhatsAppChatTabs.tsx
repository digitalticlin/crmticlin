
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

  return (
    <div className="h-full flex flex-col relative z-10">
      <WhatsAppChatLayout
        contacts={contacts}
        selectedContact={selectedContact}
        onSelectContact={setSelectedContact}
        messages={messages}
        onSendMessage={sendMessage}
        isLoadingContacts={isLoadingContacts}
        isLoadingMessages={isLoadingMessages}
        isSending={isSending}
      />
    </div>
  );
};
