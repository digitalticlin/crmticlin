
import { WhatsAppChatLayout } from "./WhatsAppChatLayout";
import { useWhatsAppChatUnified } from "@/hooks/whatsappChat/core/useWhatsAppChatUnified";
import { useWhatsAppMessagesManager } from "@/hooks/whatsappChat/messages/useWhatsAppMessagesManager";

export function WhatsAppChatContainer() {
  console.log('[WhatsAppChatContainer] 🏗️ Componente renderizado - usando hooks modulares unificados');

  // ✅ HOOK PRINCIPAL UNIFICADO (modular)
  const {
    selectedContact,
    setSelectedContact,
    activeInstance,
    refreshMessages,
    refreshContacts,
    searchContacts,
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
    loadMoreMessages,
    markAsRead
  } = useWhatsAppChatUnified();

  // ✅ HOOK ISOLADO PARA ENVIO (reutiliza do messages manager)
  const messagesManager = useWhatsAppMessagesManager({
    selectedContact,
    activeInstanceId: activeInstance?.id
  });

  console.log('[WhatsAppChatContainer] 📊 Dados do hook recebidos:', {
    contactsCount: contacts.length,
    messagesCount: messages.length,
    selectedContactId: selectedContact?.id,
    selectedContactName: selectedContact?.name,
    isLoadingContacts,
    isLoadingMessages
  });

  const onSendMessageWrapper = async (message: string, mediaType?: string, mediaUrl?: string) => {
    console.log('[WhatsAppChatContainer] ▶️ onSendMessage chamado (hook unificado)', {
      hasContact: !!selectedContact,
      contactId: selectedContact?.id,
      messagePreview: message?.substring(0, 50),
      mediaType,
      hasMediaUrl: !!mediaUrl
    });
    const result = await messagesManager.sendMessage(message, mediaType, mediaUrl);
    console.log('[WhatsAppChatContainer] ✅ Resultado de sendMessage (modular):', result);
    return result;
  };

  return (
    <WhatsAppChatLayout
      contacts={contacts}
      selectedContact={selectedContact}
      onSelectContact={setSelectedContact}
      messages={messages}
        onSendMessage={onSendMessageWrapper}
      isLoadingContacts={isLoadingContacts}
      isLoadingMoreContacts={isLoadingMoreContacts}
      hasMoreContacts={hasMoreContacts}
      onLoadMoreContacts={loadMoreContacts}
      isLoadingMessages={isLoadingMessages}
      isLoadingMore={isLoadingMoreMessages}
      hasMoreMessages={hasMoreMessages}
      onLoadMoreMessages={loadMoreMessages}
      isSending={messagesManager.isSending}
      onRefreshMessages={refreshMessages}
      onRefreshContacts={refreshContacts}
      onSearchContacts={searchContacts}
      totalContactsAvailable={totalContactsAvailable}
    />
  );
}
