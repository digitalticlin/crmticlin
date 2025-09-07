
import { WhatsAppChatLayout } from "./WhatsAppChatLayout";
import { useWhatsAppChat } from "@/hooks/whatsapp/useWhatsAppChat";
import { useSendMessage } from "@/hooks/whatsapp/messaging/useSendMessage";

export function WhatsAppChatContainer() {
  console.log('[WhatsAppChatContainer] 🏗️ Componente renderizado - iniciando hooks isolados');
  
  // ✅ HOOK PRINCIPAL (sem envio)
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
    loadMoreMessages
  } = useWhatsAppChat();

  // ✅ HOOK ISOLADO PARA ENVIO
  const { sendMessage, isSending: isSendingMessage } = useSendMessage({
    selectedContact,
    activeInstance
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
    console.log('[WhatsAppChatContainer] ▶️ onSendMessage chamado', {
      hasContact: !!selectedContact,
      contactId: selectedContact?.id,
      messagePreview: message?.substring(0, 50),
      mediaType,
      hasMediaUrl: !!mediaUrl
    });
    const result = await sendMessage(message, mediaType, mediaUrl);
    console.log('[WhatsAppChatContainer] ✅ Resultado de sendMessage:', result);
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
      isSending={isSendingMessage}
      onRefreshMessages={refreshMessages}
      onRefreshContacts={refreshContacts}
      onSearchContacts={searchContacts}
      totalContactsAvailable={totalContactsAvailable}
    />
  );
}
