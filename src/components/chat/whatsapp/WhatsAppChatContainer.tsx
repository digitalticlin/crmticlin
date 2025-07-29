
import { WhatsAppChatLayout } from "./WhatsAppChatLayout";
import { useWhatsAppChat } from "@/hooks/whatsapp/useWhatsAppChat";

export function WhatsAppChatContainer() {
  const whatsapp = useWhatsAppChat();

  return (
    <WhatsAppChatLayout
      contacts={whatsapp.contacts}
      selectedContact={whatsapp.selectedContact}
      onSelectContact={whatsapp.selectContact}
      messages={whatsapp.messages}
      onSendMessage={whatsapp.sendMessage}
      isLoadingContacts={whatsapp.isLoadingContacts}
      isLoadingMoreContacts={whatsapp.isLoadingMoreContacts}
      hasMoreContacts={whatsapp.hasMoreContacts}
      onLoadMoreContacts={whatsapp.loadMoreContacts}
      isLoadingMessages={whatsapp.isLoadingMessages}
      isLoadingMore={whatsapp.isLoadingMoreMessages}
      hasMoreMessages={whatsapp.hasMoreMessages}
      onLoadMoreMessages={whatsapp.loadMoreMessages}
      isSending={whatsapp.isSending}
      onRefreshMessages={whatsapp.refreshMessages}
      onRefreshContacts={whatsapp.refreshContacts}
      totalContactsAvailable={whatsapp.totalContactsAvailable}
    />
  );
}
