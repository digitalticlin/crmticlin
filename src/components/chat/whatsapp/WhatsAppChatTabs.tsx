
import { WhatsAppChatLayout } from "./WhatsAppChatLayout";
import { useWhatsAppChat } from "./WhatsAppChatProvider";

export const WhatsAppChatTabs = () => {
  const {
    contacts,
    selectedContact,
    setSelectedContact,
    messages,
    sendMessage,
    isLoadingContacts,
    hasMoreContacts,
    loadMoreContacts,
    isLoadingMessages,
    isLoadingMore,
    hasMoreMessages,
    loadMoreMessages,
    isSendingMessage,
    refreshMessages,
    refreshContacts
  } = useWhatsAppChat();

  // Wrapper to handle the sendMessage signature difference
  const handleSendMessage = async (message: string, mediaType?: string, mediaUrl?: string): Promise<boolean> => {
    if (selectedContact) {
      // Convert old signature to new signature
      const media = mediaType && mediaUrl ? { 
        file: new File([], 'media'), 
        type: mediaType 
      } : undefined;
      return await sendMessage(message, media);
    }
    return false;
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
        hasMoreContacts={hasMoreContacts}
        onLoadMoreContacts={loadMoreContacts}
        isLoadingMessages={isLoadingMessages}
        isLoadingMore={isLoadingMore}
        hasMoreMessages={hasMoreMessages}
        onLoadMoreMessages={loadMoreMessages}
        isSending={isSendingMessage}
        onRefreshMessages={refreshMessages}
        onRefreshContacts={refreshContacts}
        totalContactsAvailable={contacts.length}
      />
    </div>
  );
};
