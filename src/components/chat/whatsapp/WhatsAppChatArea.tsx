import { useState } from "react";
import { WhatsAppChatHeader } from "./WhatsAppChatHeader";
import { WhatsAppMessagesList } from "./WhatsAppMessagesList";
import { WhatsAppMessageInput } from "./WhatsAppMessageInput";
import { ForwardMessageDialog } from "./messages/components/ForwardMessageDialog";
import { Contact, Message } from "@/types/chat";
import { useWhatsAppChatUnified } from "@/hooks/whatsappChat/core/useWhatsAppChatUnified";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface WhatsAppChatAreaProps {
  selectedContact: Contact;
  messages: Message[];
  onSendMessage: (message: string, mediaType?: string, mediaUrl?: string, metadata?: any) => Promise<boolean>;
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

  // Hook para obter instância ativa e contatos (REMOVIDO: vamos buscar direto no dialog)
  const { activeInstance } = useWhatsAppChatUnified();

  const handleForward = (message: Message) => {
    console.log('[WhatsAppChatArea] 📤 Abrindo dialog de encaminhamento:', message.id);
    setMessageToForward(message);
    setForwardDialogOpen(true);
  };

  const handleSelectContactForForward = async (targetContact: Contact) => {
    if (!messageToForward || !activeInstance?.id) return;

    console.log('[WhatsAppChatArea] 📤 Encaminhando mensagem via edge dedicada:', {
      messageId: messageToForward.id,
      from: selectedContact.id,
      to: targetContact.id,
      toLeadId: targetContact.id,
      instanceId: activeInstance.id
    });

    try {
      // ✅ NOVA ABORDAGEM: Chamar edge dedicada de encaminhamento
      const { data, error } = await supabase.functions.invoke('whatsapp_messaging_forward', {
        body: {
          messageId: messageToForward.id,
          targetContactId: targetContact.id,
          instanceId: activeInstance.id
        }
      });

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro desconhecido ao encaminhar');
      }

      console.log('[WhatsAppChatArea] ✅ Mensagem encaminhada com sucesso:', data);

      toast({
        title: "Mensagem encaminhada",
        description: `Mensagem encaminhada para ${targetContact.name || targetContact.phone}`,
      });

      // Fechar dialog
      setForwardDialogOpen(false);
      setMessageToForward(null);
    } catch (error) {
      console.error('[WhatsAppChatArea] ❌ Erro ao encaminhar:', error);
      toast({
        title: "Erro ao encaminhar",
        description: error instanceof Error ? error.message : "Não foi possível encaminhar a mensagem.",
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
        currentContactId={selectedContact.id}
        activeInstanceId={activeInstance?.id}
        onForward={handleSelectContactForForward}
      />
    </div>
  );
};
