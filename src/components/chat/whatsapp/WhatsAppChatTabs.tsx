
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
    isSending,
    fetchMessages
  } = useWhatsAppChatContext();

  // Wrapper to handle the sendMessage signature difference
  const handleSendMessage = (message: string) => {
    if (selectedContact) {
      sendMessage(message);
    }
  };

  // Force refresh messages (bypass cache)
  const handleRefreshMessages = () => {
    console.log('[WhatsAppChatTabs] 🔄 Forçando refresh das mensagens...');
    if (fetchMessages) {
      fetchMessages();
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
        isLoadingMoreContacts={false}
        hasMoreContacts={false}
        onLoadMoreContacts={async () => {}}
        isLoadingMessages={isLoadingMessages}
        isLoadingMore={false}
        hasMoreMessages={false}
        onLoadMoreMessages={async () => {}}
        isSending={isSending}
        onRefreshMessages={handleRefreshMessages}
      />
    </div>
  );
};
