import { useState } from "react";
import { WhatsAppChatHeader } from "./WhatsAppChatHeader";
import { WhatsAppMessagesList } from "./WhatsAppMessagesList";
import { WhatsAppMessageInput } from "./WhatsAppMessageInput";
import { ForwardMessageDialog } from "./messages/components/ForwardMessageDialog";
import { Contact, Message } from "@/types/chat";
import { useWhatsAppChatUnified } from "@/hooks/whatsappChat/core/useWhatsAppChatUnified";
import { useToast } from "@/hooks/use-toast";

interface WhatsAppChatAreaProps {
  selectedContact: Contact;
  messages: Message[];
  onSendMessage: (message: string, mediaType?: string, mediaUrl?: string) => Promise<boolean>;
  onBack: () => void;
  isLoadingMessages: boolean;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  onLoadMoreMessages: () => Promise<void>;
  isSending: boolean;
  onEditLead: () => void;
  onRefreshMessages?: () => void;
  leadId?: string;
}

export const WhatsAppChatArea = ({
  selectedContact,
  messages,
  onSendMessage,
  onBack,
  isLoadingMessages,
  isLoadingMore,
  hasMoreMessages,
  onLoadMoreMessages,
  isSending,
  onEditLead,
  onRefreshMessages,
  leadId
}: WhatsAppChatAreaProps) => {
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [messageToForward, setMessageToForward] = useState<Message | null>(null);
  const { toast } = useToast();

  // Hook para obter lista de contatos
  const { contacts } = useWhatsAppChatUnified();

  const handleForward = (message: Message) => {
    console.log('[WhatsAppChatArea] 📤 Abrindo dialog de encaminhamento:', message.id);
    setMessageToForward(message);
    setForwardDialogOpen(true);
  };

  const handleSelectContactForForward = async (targetContact: Contact) => {
    if (!messageToForward) return;

    console.log('[WhatsAppChatArea] 📤 Encaminhando mensagem:', {
      messageId: messageToForward.id,
      from: selectedContact.id,
      to: targetContact.id,
      hasMedia: messageToForward.mediaType !== 'text'
    });

    try {
      // Encaminhar mensagem usando a mesma função de envio
      const success = await onSendMessage(
        messageToForward.text,
        messageToForward.mediaType !== 'text' ? messageToForward.mediaType : undefined,
        messageToForward.mediaUrl || undefined
      );

      if (success) {
        toast({
          title: "Mensagem encaminhada",
          description: `Mensagem encaminhada para ${targetContact.name || targetContact.phone}`,
        });
      } else {
        throw new Error('Falha ao encaminhar mensagem');
      }
    } catch (error) {
      console.error('[WhatsAppChatArea] ❌ Erro ao encaminhar:', error);
      toast({
        title: "Erro ao encaminhar",
        description: "Não foi possível encaminhar a mensagem. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-white/5 backdrop-blur-sm relative z-10">
      <WhatsAppChatHeader
        selectedContact={{
          ...selectedContact,
          leadId
        }}
        onBack={onBack}
        onEditLead={onEditLead}
        onRefreshMessages={onRefreshMessages}
        isRefreshing={isLoadingMessages}
      />
      <WhatsAppMessagesList
        messages={messages}
        isLoading={isLoadingMessages}
        isLoadingMore={isLoadingMore}
        hasMoreMessages={hasMoreMessages}
        onLoadMore={onLoadMoreMessages}
        onForward={handleForward}
      />
      <WhatsAppMessageInput
        onSendMessage={onSendMessage}
        isSending={isSending}
      />

      {/* Dialog de encaminhamento */}
      <ForwardMessageDialog
        open={forwardDialogOpen}
        onOpenChange={setForwardDialogOpen}
        message={messageToForward}
        contacts={contacts}
        currentContactId={selectedContact.id}
        onForward={handleSelectContactForForward}
      />
    </div>
  );
};
