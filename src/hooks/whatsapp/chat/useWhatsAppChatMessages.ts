
/**
 * 🎯 HOOK DE MENSAGENS OTIMIZADO
 * 
 * RESPONSABILIDADES:
 * ✅ Gerenciar mensagens do chat selecionado
 * ✅ Paginação otimizada
 * ✅ Envio de mensagens
 * ✅ UI otimista
 * 
 * MELHORIAS:
 * ✅ Adicionado addOptimisticMessage para realtime
 * ✅ Adicionado updateMessage para atualizações
 * ✅ Cache inteligente
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message, Contact } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UseWhatsAppChatMessagesProps {
  selectedContact: Contact | null;
  activeInstance: WhatsAppWebInstance | null;
}

interface UseWhatsAppChatMessagesReturn {
  messages: Message[];
  isLoadingMessages: boolean;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  isSendingMessage: boolean;
  sendMessage: (text: string, media?: { file: File; type: string }) => Promise<boolean>;
  loadMoreMessages: () => Promise<void>;
  refreshMessages: () => void;
  // 🆕 NOVOS MÉTODOS PARA REALTIME
  addOptimisticMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
}

const MESSAGES_PER_PAGE = 50;

export const useWhatsAppChatMessages = ({
  selectedContact,
  activeInstance
}: UseWhatsAppChatMessagesProps): UseWhatsAppChatMessagesReturn => {
  const { user } = useAuth();
  
  // Estados principais
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // Função para converter mensagem do banco para UI
  const convertMessage = useCallback((messageData: any): Message => {
    return {
      id: messageData.id,
      text: messageData.text || '',
      fromMe: messageData.from_me || false,
      timestamp: messageData.created_at || new Date().toISOString(),
      status: messageData.status || 'sent',
      mediaType: messageData.media_type || 'text',
      mediaUrl: messageData.media_url || undefined,
      sender: messageData.from_me ? 'user' : 'contact',
      time: new Date(messageData.created_at || Date.now()).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      isIncoming: !messageData.from_me,
      media_cache: messageData.media_cache || null
    };
  }, []);

  // Buscar mensagens
  const fetchMessages = useCallback(async (page = 0, append = false) => {
    if (!selectedContact || !activeInstance) {
      setMessages([]);
      setHasMoreMessages(false);
      return;
    }

    try {
      if (page === 0) {
        setIsLoadingMessages(true);
        setMessages([]);
      } else {
        setIsLoadingMore(true);
      }

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          media_cache (
            id,
            base64_data,
            original_url,
            cached_url,
            file_size,
            media_type
          )
        `)
        .eq('lead_id', selectedContact.id)
        .eq('whatsapp_number_id', activeInstance.id)
        .order('created_at', { ascending: false })
        .range(page * MESSAGES_PER_PAGE, (page + 1) * MESSAGES_PER_PAGE - 1);

      if (error) throw error;

      const newMessages = (data || []).map(convertMessage);
      
      if (append) {
        setMessages(prev => [...newMessages.reverse(), ...prev]);
      } else {
        setMessages(newMessages.reverse());
      }

      setHasMoreMessages(newMessages.length === MESSAGES_PER_PAGE);
      setCurrentPage(page);

    } catch (error) {
      console.error('[useWhatsAppChatMessages] ❌ Erro ao buscar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setIsLoadingMessages(false);
      setIsLoadingMore(false);
    }
  }, [selectedContact, activeInstance, convertMessage]);

  // Carregar mais mensagens
  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || isLoadingMore) return;
    await fetchMessages(currentPage + 1, true);
  }, [hasMoreMessages, isLoadingMore, currentPage, fetchMessages]);

  // Refresh mensagens
  const refreshMessages = useCallback(() => {
    setCurrentPage(0);
    fetchMessages(0, false);
  }, [fetchMessages]);

  // 🆕 ADICIONAR MENSAGEM OTIMISTA (REALTIME)
  const addOptimisticMessage = useCallback((message: Message) => {
    setMessages(prev => {
      // Evitar duplicatas
      const exists = prev.some(msg => msg.id === message.id);
      if (exists) return prev;
      
      // Adicionar no final (mensagem mais recente)
      return [...prev, message];
    });
  }, []);

  // 🆕 ATUALIZAR MENSAGEM (REALTIME)
  const updateMessage = useCallback((updatedMessage: Message) => {
    setMessages(prev => prev.map(msg => 
      msg.id === updatedMessage.id ? updatedMessage : msg
    ));
  }, []);

  // Enviar mensagem
  const sendMessage = useCallback(async (text: string, media?: { file: File; type: string }): Promise<boolean> => {
    if (!selectedContact || !activeInstance || !user) return false;

    setIsSendingMessage(true);

    try {
      // Criar mensagem otimista
      const optimisticMessage: Message = {
        id: `temp_${Date.now()}`,
        text,
        fromMe: true,
        timestamp: new Date().toISOString(),
        status: 'sending',
        mediaType: media?.type || 'text',
        mediaUrl: media ? URL.createObjectURL(media.file) : undefined,
        sender: 'user',
        time: new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        isIncoming: false,
        media_cache: null
      };

      // Adicionar mensagem otimista
      addOptimisticMessage(optimisticMessage);

      // Enviar para o servidor
      const { data, error } = await supabase.functions.invoke('send_whatsapp_message', {
        body: {
          instance_id: activeInstance.id,
          contact_id: selectedContact.id,
          message: text,
          media_type: media?.type || 'text',
          media_data: media ? await media.file.arrayBuffer() : undefined
        }
      });

      if (error) throw error;

      // Atualizar mensagem otimista com dados reais
      if (data?.message_id) {
        const realMessage = {
          ...optimisticMessage,
          id: data.message_id,
          status: 'sent' as const
        };
        updateMessage(realMessage);
      }

      return true;

    } catch (error) {
      console.error('[useWhatsAppChatMessages] ❌ Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
      
      // Remover mensagem otimista em caso de erro
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp_')));
      
      return false;
    } finally {
      setIsSendingMessage(false);
    }
  }, [selectedContact, activeInstance, user, addOptimisticMessage, updateMessage]);

  // Efeito para carregar mensagens quando contato muda
  useEffect(() => {
    if (selectedContact && activeInstance) {
      fetchMessages(0, false);
    } else {
      setMessages([]);
      setHasMoreMessages(false);
    }
  }, [selectedContact, activeInstance, fetchMessages]);

  return {
    messages,
    isLoadingMessages,
    isLoadingMore,
    hasMoreMessages,
    isSendingMessage,
    sendMessage,
    loadMoreMessages,
    refreshMessages,
    addOptimisticMessage,
    updateMessage
  };
};
