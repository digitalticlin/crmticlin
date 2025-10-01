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

  // Hook para obter instância ativa e contatos (REMOVIDO: vamos buscar direto no dialog)
  const { activeInstance } = useWhatsAppChatUnified();

  const handleForward = (message: Message) => {
    console.log('[WhatsAppChatArea] 📤 Abrindo dialog de encaminhamento:', message.id);
    setMessageToForward(message);
    setForwardDialogOpen(true);
  };

  const handleSelectContactForForward = async (targetContact: Contact) => {
    if (!messageToForward || !activeInstance?.id) return;

    // 🔥 CORREÇÃO: Buscar URL correta da mídia (priorizar media_cache)
    const getMediaUrl = () => {
      // Se tiver media_cache, priorizar cached_url ou original_url
      if (messageToForward.media_cache) {
        const storageUrl = messageToForward.media_cache.cached_url || messageToForward.media_cache.original_url;
        if (storageUrl) {
          console.log('[WhatsAppChatArea] 🗄️ Usando URL do media_cache:', storageUrl);
          return storageUrl;
        }
      }

      // Fallback para mediaUrl direto
      if (messageToForward.mediaUrl) {
        console.log('[WhatsAppChatArea] 📎 Usando mediaUrl direto:', messageToForward.mediaUrl);
        return messageToForward.mediaUrl;
      }

      return null;
    };

    const finalMediaUrl = getMediaUrl();

    console.log('[WhatsAppChatArea] 📤 Encaminhando mensagem:', {
      messageId: messageToForward.id,
      from: selectedContact.id,
      fromPhone: selectedContact.phone,
      to: targetContact.id,
      toPhone: targetContact.phone,
      hasMedia: messageToForward.mediaType !== 'text',
      mediaType: messageToForward.mediaType,
      mediaUrl: finalMediaUrl,
      hasMediaCache: !!messageToForward.media_cache
    });

    try {
      // 🔥 CORREÇÃO CRÍTICA: Enviar diretamente via edge function para o contato correto
      const messageContent = messageToForward.text || (finalMediaUrl ? ' ' : '');

      const { data, error } = await supabase.functions.invoke('whatsapp_messaging_service', {
        body: {
          action: 'send_message',
          instanceId: activeInstance.id,
          phone: targetContact.phone, // ✅ CORRIGIDO: usar phone do targetContact, não do selectedContact
          message: messageContent,
          mediaType: messageToForward.mediaType || 'text',
          mediaUrl: finalMediaUrl
        }
      });

      if (error) {
        throw error;
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
        currentContactId={selectedContact.id}
        activeInstanceId={activeInstance?.id}
        onForward={handleSelectContactForForward}
      />
    </div>
  );
};
