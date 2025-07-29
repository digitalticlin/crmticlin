
import { WhatsAppChatLayout } from "./WhatsAppChatLayout";
import { useWhatsAppChat } from "@/hooks/whatsapp/useWhatsAppChat";
import { useWhatsAppContacts } from "@/hooks/whatsapp/useWhatsAppContacts";
import { useWhatsAppMessages } from "@/hooks/whatsapp/useWhatsAppMessages";

export function WhatsAppChatContainer() {
  const {
    selectedContact,
    onSelectContact,
    onSendMessage,
    isSending,
    onRefreshMessages,
    onRefreshContacts
  } = useWhatsAppChat();

  const {
    contacts,
    isLoading: isLoadingContacts,
    isLoadingMore: isLoadingMoreContacts,
    hasMore: hasMoreContacts,
    loadMore: onLoadMoreContacts,
    totalAvailable: totalContactsAvailable
  } = useWhatsAppContacts();

  const {
    messages,
    isLoading: isLoadingMessages,
    isLoadingMore,
    hasMore: hasMoreMessages,
    loadMore: onLoadMoreMessages
  } = useWhatsAppMessages(selectedContact?.id);

  return (
    <WhatsAppChatLayout
      contacts={contacts}
      selectedContact={selectedContact}
      onSelectContact={onSelectContact}
      messages={messages}
      onSendMessage={onSendMessage}
      isLoadingContacts={isLoadingContacts}
      isLoadingMoreContacts={isLoadingMoreContacts}
      hasMoreContacts={hasMoreContacts}
      onLoadMoreContacts={onLoadMoreContacts}
      isLoadingMessages={isLoadingMessages}
      isLoadingMore={isLoadingMore}
      hasMoreMessages={hasMoreMessages}
      onLoadMoreMessages={onLoadMoreMessages}
      isSending={isSending}
      onRefreshMessages={onRefreshMessages}
      onRefreshContacts={onRefreshContacts}
      totalContactsAvailable={totalContactsAvailable}
    />
  );
}
