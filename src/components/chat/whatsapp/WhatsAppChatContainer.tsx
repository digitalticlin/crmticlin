import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useWhatsApp } from "@/hooks/whatsapp/useWhatsApp";
import { useWhatsAppContacts } from "@/hooks/whatsapp/useWhatsAppContacts";
import { useWhatsAppMessages } from "@/hooks/whatsapp/useWhatsAppMessages";
import { Contact } from "@/types/chat";
import { Message } from "@/types/message";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { WhatsAppChatLayout } from './WhatsAppChatLayout';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useDebounce } from '@/hooks/useDebounce';

export interface WhatsAppChatContainerProps {
  instanceId: string;
}

export const WhatsAppChatContainer: React.FC<WhatsAppChatContainerProps> = ({ instanceId }) => {
  const [searchParams] = useSearchParams();
  const initialContactId = searchParams.get('contactId');
  const { user } = useAuth();
  const { toast } = useToast();
  const { isConnected } = useWhatsApp(instanceId);
  const { companyId } = useCompanyData();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [leadDetailsOpen, setLeadDetailsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const {
    contacts,
    isLoading,
    totalContactsAvailable,
    fetchContacts,
    selectContact,
    selectedContact
  } = useWhatsAppContacts(instanceId, user?.id, debouncedSearch);

  const {
    messages,
    isLoading: isMessagesLoading,
    sendMessage,
    fetchMessages
  } = useWhatsAppMessages(instanceId, selectedContact?.id);

  const [isSending, setIsSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<{ type?: string; url?: string } | null>(null);

  useEffect(() => {
    if (initialContactId) {
      selectContact(initialContactId);
    }
  }, [initialContactId, selectContact]);

  const handleSelectContact = useCallback((contact: Contact) => {
    selectContact(contact.id);
    setMessageText('');
    setSelectedMedia(null);
  }, [selectContact]);

  const handleSendMessage = async (message: string, mediaType?: string, mediaUrl?: string) => {
    if (!selectedContact) {
      toast({
        title: "Erro",
        description: "Selecione um contato para enviar a mensagem.",
        variant: "destructive",
      });
      return;
    }

    if (!message && !mediaUrl) {
      toast({
        title: "Erro",
        description: "Digite uma mensagem ou selecione uma mídia para enviar.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      await sendMessage(message, mediaType, mediaUrl);
      setMessageText('');
      setSelectedMedia(null);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Falha ao enviar mensagem.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectMedia = (mediaType?: string, mediaUrl?: string) => {
    if (mediaType && mediaUrl) {
      setSelectedMedia({ type: mediaType, url: mediaUrl });
      handleSendMessage('', mediaType, mediaUrl);
    } else {
      setSelectedMedia(null);
    }
  };

  return (
    <WhatsAppChatLayout
      contacts={contacts}
      selectedContact={selectedContact}
      onSelectContact={handleSelectContact}
      messages={messages}
      onSendMessage={handleSendMessage}
      onSelectMedia={handleSelectMedia}
      isConnected={isConnected}
      isLoading={isLoading}
      isSending={isSending}
      leadDetailsOpen={leadDetailsOpen}
      setLeadDetailsOpen={setLeadDetailsOpen}
      selectedLead={selectedLead}
      totalContactsAvailable={totalContactsAvailable}
      onSearch={(query: string) => {
        // Implement search functionality or leave empty for now
        console.log('Search query:', query);
      }}
    />
  );
};
