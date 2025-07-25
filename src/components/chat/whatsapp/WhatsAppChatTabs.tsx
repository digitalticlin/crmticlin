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
    isLoadingMoreContacts,
    hasMoreContacts,
    loadMoreContacts,
    isLoadingMessages,
    isLoadingMore,
    hasMoreMessages,
    loadMoreMessages,
    isSending,
    fetchMessages,
    fetchContacts,
    totalContactsAvailable
  } = useWhatsAppChatContext();

  // Wrapper to handle the sendMessage signature difference
  const handleSendMessage = async (message: string, mediaType?: string, mediaUrl?: string): Promise<boolean> => {
    if (selectedContact) {
      return await sendMessage(message, mediaType, mediaUrl);
    }
    return false;
  };

  // Force refresh messages (bypass cache)
  const handleRefreshMessages = () => {
    console.log('[WhatsAppChatTabs] 🔄 Forçando refresh das mensagens...');
    if (fetchMessages) {
      fetchMessages();
    }
  };

  // Force refresh contacts (bypass cache)
  const handleRefreshContacts = () => {
    console.log('[WhatsAppChatTabs] 🔄 Forçando refresh dos contatos...');
    if (fetchContacts) {
      fetchContacts();
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
        isLoadingMoreContacts={isLoadingMoreContacts}
        hasMoreContacts={hasMoreContacts}
        onLoadMoreContacts={loadMoreContacts}
        isLoadingMessages={isLoadingMessages}
        isLoadingMore={isLoadingMore}
        hasMoreMessages={hasMoreMessages}
        onLoadMoreMessages={loadMoreMessages}
        isSending={isSending}
        onRefreshMessages={handleRefreshMessages}
        onRefreshContacts={handleRefreshContacts}
        totalContactsAvailable={totalContactsAvailable}
      />
    </div>
  );
};
