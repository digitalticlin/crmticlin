
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInfiniteQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppChatLayout } from "@/components/chat/whatsapp/WhatsAppChatLayout";
import { Contact, Message } from "@/types/chat";
import { useForwardMessage } from "@/hooks/whatsapp/forward/useForwardMessage";
import { ForwardMessageModal } from "./forward/ForwardMessageModal";

// Helper function to convert database message to UI Message
const convertToMessage = (dbMessage: any): Message => {
  return {
    id: dbMessage.id,
    text: dbMessage.text || dbMessage.message || '',
    message: dbMessage.text || dbMessage.message || '',
    sender: dbMessage.from_me ? 'user' : 'contact',
    time: new Date(dbMessage.created_at).toLocaleTimeString(),
    timestamp: dbMessage.created_at,
    created_at: dbMessage.created_at,
    contact_id: dbMessage.contact_id,
    lead_id: dbMessage.lead_id,
    status: 'delivered',
    isIncoming: !dbMessage.from_me,
    fromMe: dbMessage.from_me,
    mediaType: (dbMessage.media_type as any) || 'text'
  };
};

export const WhatsAppChatContainer = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const contactId = searchParams.get('contactId');
  const [messages, setMessages] = useState<Message[]>([]);
  const [contact, setContact] = useState<Contact | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Hook de encaminhamento de mensagens
  const {
    forwardState,
    openForwardModal,
    closeForwardModal,
    setSelectedContacts,
    setAdditionalComment,
    executeForward,
    isForwardingAvailable
  } = useForwardMessage({ activeInstanceId: contact?.whatsapp_number_id });

  // Infinite scroll para mensagens
  const {
    data: infiniteMessages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isInfiniteLoading,
    error: infiniteError,
  } = useInfiniteQuery({
    queryKey: ['messages', contactId, searchQuery],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', contactId)
        .ilike('text', `%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + 19);

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 20) {
        return undefined;
      }
      return allPages.length * 20;
    },
    enabled: !!contactId,
  });

  useEffect(() => {
    if (infiniteMessages?.pages) {
      const allMessages = infiniteMessages.pages.flat();
      const convertedMessages = allMessages.map(convertToMessage);
      setMessages(convertedMessages.sort((a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime()));
    }
  }, [infiniteMessages]);

  const handleForwardMessage = useCallback((message: Message) => {
    console.log('[WhatsAppChatContainer] Abrindo modal de encaminhamento:', message);
    openForwardModal(message);
  }, [openForwardModal]);

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const updateMessage = (messageId: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, ...updates } : msg
    ));
  };

  const removeMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const updateContact = (updates: Partial<Contact>) => {
    setContact(prev => prev ? { ...prev, ...updates } : null);
  };

  const handleLoadMoreMessages = async () => {
    try {
      await fetchNextPage();
    } catch (error) {
      console.error('Error loading more messages:', error);
    }
  };

  return (
    <>
      <WhatsAppChatLayout
        contacts={contacts}
        selectedContact={contact}
        onSelectContact={setContact}
        messages={messages}
        onSendMessage={async (message: string) => {
          // Implementar envio de mensagem
          return true;
        }}
        isLoadingContacts={false}
        isLoadingMoreContacts={false}
        hasMoreContacts={false}
        onLoadMoreContacts={async () => {}}
        isLoadingMessages={isInfiniteLoading}
        isLoadingMore={isFetchingNextPage}
        hasMoreMessages={hasNextPage}
        onLoadMoreMessages={handleLoadMoreMessages}
        isSending={false}
        onForwardMessage={handleForwardMessage}
      />

      {/* Modal de Encaminhamento */}
      <ForwardMessageModal
        isOpen={forwardState.isModalOpen}
        message={forwardState.selectedMessage}
        contacts={contacts}
        selectedContacts={forwardState.selectedContacts}
        additionalComment={forwardState.additionalComment}
        isForwarding={forwardState.isForwarding}
        forwardProgress={forwardState.forwardProgress}
        onClose={closeForwardModal}
        onSelectionChange={setSelectedContacts}
        onCommentChange={setAdditionalComment}
        onExecuteForward={executeForward}
      />
    </>
  );
};
