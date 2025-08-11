
import { WhatsAppChatLayout } from "./WhatsAppChatLayout";
import { useWhatsAppChat } from "@/hooks/whatsapp/useWhatsAppChat";

export function WhatsAppChatContainer() {
  console.log('[WhatsAppChatContainer] 🏗️ Componente renderizado - iniciando useWhatsAppChat');
  const {
    selectedContact,
    setSelectedContact,
    sendMessage,
    isSendingMessage,
    refreshMessages,
    refreshContacts,
    contacts,
    isLoadingContacts,
    isLoadingMoreContacts,
    hasMoreContacts,
    loadMoreContacts,
    totalContactsAvailable,
    messages,
    isLoadingMessages,
    isLoadingMoreMessages,
    hasMoreMessages,
    loadMoreMessages
  } = useWhatsAppChat();

  console.log('[WhatsAppChatContainer] 📊 Dados do hook recebidos:', {
    contactsCount: contacts.length,
    messagesCount: messages.length,
    selectedContactId: selectedContact?.id,
    selectedContactName: selectedContact?.name,
    isLoadingContacts,
    isLoadingMessages
  });

  return (
    <WhatsAppChatLayout
      contacts={contacts}
      selectedContact={selectedContact}
      onSelectContact={setSelectedContact}
      messages={messages}
      onSendMessage={sendMessage}
      isLoadingContacts={isLoadingContacts}
      isLoadingMoreContacts={isLoadingMoreContacts}
      hasMoreContacts={hasMoreContacts}
      onLoadMoreContacts={loadMoreContacts}
      isLoadingMessages={isLoadingMessages}
      isLoadingMore={isLoadingMoreMessages}
      hasMoreMessages={hasMoreMessages}
      onLoadMoreMessages={loadMoreMessages}
      isSending={isSendingMessage}
      onRefreshMessages={refreshMessages}
      onRefreshContacts={refreshContacts}
      totalContactsAvailable={totalContactsAvailable}
    />
  );
}
