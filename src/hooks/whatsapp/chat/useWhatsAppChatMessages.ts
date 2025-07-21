
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact, Message } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { useMessageRealtime } from './hooks/useMessageRealtime';
import { useChatDatabase } from '../useChatDatabase';
import { useCompanyResolver } from '../useCompanyResolver';
import { toast } from 'sonner';

const MESSAGES_LIMIT = 50;

export const useWhatsAppChatMessages = (
  selectedContact: Contact | null,
  activeInstance: WhatsAppWebInstance | null
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  
  const { mapDbMessageToMessage } = useChatDatabase();
  const { companyId } = useCompanyResolver();
  const lastContactIdRef = useRef<string | null>(null);
  const lastInstanceIdRef = useRef<string | null>(null);
  
  // Função para buscar mensagens
  const fetchMessages = useCallback(async (offset = 0, forceRefresh = false) => {
    if (!selectedContact || !activeInstance) {
      console.log('[WhatsApp Messages] ⚠️ No contact or instance selected');
      return;
    }

    try {
      if (offset === 0) {
        setIsLoadingMessages(true);
      } else {
        setIsLoadingMore(true);
      }

      console.log('[WhatsApp Messages] 🔍 Fetching messages:', {
        contactId: selectedContact.id,
        instanceId: activeInstance.id,
        offset,
        forceRefresh
      });

      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', selectedContact.id)
        .eq('whatsapp_number_id', activeInstance.id)
        .order('timestamp', { ascending: false })
        .range(offset, offset + MESSAGES_LIMIT - 1);

      if (error) {
        console.error('[WhatsApp Messages] ❌ Error fetching messages:', error);
        throw error;
      }

      const fetchedMessages = (messagesData || []).map(mapDbMessageToMessage);
      
      console.log('[WhatsApp Messages] 📨 Messages fetched:', {
        count: fetchedMessages.length,
        hasMore: fetchedMessages.length === MESSAGES_LIMIT
      });

      // Reverter a ordem para exibir do mais antigo para o mais novo
      const sortedMessages = fetchedMessages.reverse();

      if (offset === 0) {
        setMessages(sortedMessages);
        setCurrentOffset(sortedMessages.length);
      } else {
        setMessages(prev => [...sortedMessages, ...prev]);
        setCurrentOffset(prev => prev + sortedMessages.length);
      }

      setHasMoreMessages(fetchedMessages.length === MESSAGES_LIMIT);

    } catch (error: any) {
      console.error('[WhatsApp Messages] ❌ Error fetching messages:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setIsLoadingMessages(false);
      setIsLoadingMore(false);
    }
  }, [selectedContact?.id, activeInstance?.id, mapDbMessageToMessage]);

  // Função para carregar mais mensagens
  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || isLoadingMore) return;
    await fetchMessages(currentOffset);
  }, [hasMoreMessages, isLoadingMore, currentOffset, fetchMessages]);

  // Função para enviar mensagem
  const sendMessage = useCallback(async (text: string): Promise<boolean> => {
    if (!selectedContact || !activeInstance || !text.trim() || !companyId) {
      return false;
    }

    setIsSending(true);
    
    try {
      console.log('[WhatsApp Messages] 📤 Sending message:', {
        contactId: selectedContact.id,
        instanceId: activeInstance.id,
        text: text.substring(0, 50) + '...'
      });

      const { error } = await supabase
        .from('messages')
        .insert({
          lead_id: selectedContact.id,
          whatsapp_number_id: activeInstance.id,
          text: text.trim(),
          from_me: true,
          timestamp: new Date().toISOString(),
          status: 'sent',
          media_type: 'text',
          import_source: 'realtime',
          created_by_user_id: companyId
        });

      if (error) {
        console.error('[WhatsApp Messages] ❌ Error sending message:', error);
        throw error;
      }

      // Atualizar lista de mensagens
      await fetchMessages(0, true);
      
      console.log('[WhatsApp Messages] ✅ Message sent successfully');
      return true;

    } catch (error: any) {
      console.error('[WhatsApp Messages] ❌ Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
      return false;
    } finally {
      setIsSending(false);
    }
  }, [selectedContact?.id, activeInstance?.id, companyId, fetchMessages]);

  // Callback para atualizar mensagens via realtime
  const handleMessageUpdate = useCallback((newMessage?: Message) => {
    console.log('[WhatsApp Messages] 🔄 Message update received:', newMessage?.id);
    
    // Recarregar mensagens para garantir consistência
    fetchMessages(0, true);
  }, [fetchMessages]);

  // Hook de realtime para mensagens
  useMessageRealtime({
    selectedContact,
    activeInstance,
    onMessageUpdate: handleMessageUpdate
  });

  // Efeito para carregar mensagens quando contato/instância mudar
  useEffect(() => {
    const contactChanged = lastContactIdRef.current !== selectedContact?.id;
    const instanceChanged = lastInstanceIdRef.current !== activeInstance?.id;
    
    if (contactChanged || instanceChanged) {
      console.log('[WhatsApp Messages] 🔄 Contact or instance changed, reloading messages');
      
      lastContactIdRef.current = selectedContact?.id || null;
      lastInstanceIdRef.current = activeInstance?.id || null;
      
      setMessages([]);
      setCurrentOffset(0);
      setHasMoreMessages(true);
      
      if (selectedContact && activeInstance) {
        fetchMessages(0, true);
      }
    }
  }, [selectedContact?.id, activeInstance?.id, fetchMessages]);

  return {
    messages,
    isLoadingMessages,
    isLoadingMore,
    hasMoreMessages,
    isSending,
    sendMessage,
    loadMoreMessages,
    fetchMessages: () => fetchMessages(0, true)
  };
};
