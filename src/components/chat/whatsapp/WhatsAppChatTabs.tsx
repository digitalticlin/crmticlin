
/**
 * 🎯 COMPONENTE REFATORADO - HOOKS DIRETOS
 * 
 * ANTES: Dependia do Provider complexo
 * DEPOIS: Usa hook direto otimizado
 * 
 * VANTAGENS:
 * ✅ Zero dependências de contexto
 * ✅ Performance otimizada
 * ✅ Isolamento perfeito
 */

import { WhatsAppChatLayout } from "./WhatsAppChatLayout";
import { useWhatsAppChat } from "@/hooks/whatsapp/useWhatsAppChat";

export const WhatsAppChatTabs = () => {
  const whatsapp = useWhatsAppChat();

  return (
    <div className="h-full flex flex-col relative z-10">
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
    </div>
  );
};
