
/**
 * 🎯 HOOK DE MENSAGENS OTIMIZADO - FASE 1 CORRIGIDA
 * 
 * RESPONSABILIDADES:
 * ✅ Gerenciar mensagens do chat selecionado
 * ✅ Paginação otimizada
 * ✅ Envio de mensagens via MessagingService
 * ✅ UI otimista com substituição por dados reais
 * 
 * CORREÇÕES IMPLEMENTADAS:
 * ✅ Integração com MessagingService existente
 * ✅ Substituição correta de mensagens temporárias
 * ✅ Suporte completo para mídia (texto, imagem, vídeo, áudio, documento)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message, Contact } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MessagingService } from '@/modules/whatsapp/messaging/services/messagingService';

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
  addOptimisticMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
}

const MESSAGES_PER_PAGE = 50;

// Helper function to ensure mediaType conforms to expected union type
const normalizeMediaType = (mediaType?: string): "text" | "image" | "video" | "audio" | "document" => {
  if (!mediaType) return 'text';
  
  const normalizedType = mediaType.toLowerCase();
  if (normalizedType.includes('image')) return 'image';
  if (normalizedType.includes('video')) return 'video';
  if (normalizedType.includes('audio')) return 'audio';
  if (normalizedType.includes('document')) return 'document';
  
  return 'text';
};

// Helper function to convert File to DataURL
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper function to detect media type from file
const detectMediaType = (file: File): "image" | "video" | "audio" | "document" => {
  const type = file.type.toLowerCase();
  
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  return 'document';
};

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
      mediaType: normalizeMediaType(messageData.media_type),
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

  // Adicionar mensagem otimista (REALTIME)
  const addOptimisticMessage = useCallback((message: Message) => {
    setMessages(prev => {
      const exists = prev.some(msg => msg.id === message.id);
      if (exists) return prev;
      
      return [...prev, message];
    });
  }, []);

  // Atualizar mensagem (REALTIME)
  const updateMessage = useCallback((updatedMessage: Message) => {
    setMessages(prev => prev.map(msg => 
      msg.id === updatedMessage.id ? updatedMessage : msg
    ));
  }, []);

  // 🎯 NOVA IMPLEMENTAÇÃO: Substituir mensagem temporária por real
  const replaceOptimisticMessage = useCallback((tempId: string, realMessage: Message) => {
    console.log(`[useWhatsAppChatMessages] 🔄 Substituindo mensagem temporária: ${tempId} → ${realMessage.id}`);
    
    setMessages(prev => prev.map(msg => 
      msg.id === tempId ? { ...realMessage, status: 'sent' } : msg
    ));
  }, []);

  // 🎯 NOVA IMPLEMENTAÇÃO: Remover mensagem temporária (em caso de erro)
  const removeOptimisticMessage = useCallback((tempId: string) => {
    console.log(`[useWhatsAppChatMessages] ❌ Removendo mensagem temporária: ${tempId}`);
    
    setMessages(prev => prev.filter(msg => msg.id !== tempId));
  }, []);

  // 🎯 FUNÇÃO PRINCIPAL CORRIGIDA: Enviar mensagem
  const sendMessage = useCallback(async (text: string, media?: { file: File; type: string }): Promise<boolean> => {
    if (!selectedContact || !activeInstance || !user) {
      toast.error('Dados necessários não disponíveis');
      return false;
    }

    if (!text.trim()) {
      toast.error('Mensagem não pode estar vazia');
      return false;
    }

    console.log('[useWhatsAppChatMessages] 📤 Iniciando envio de mensagem:', {
      contactId: selectedContact.id,
      instanceId: activeInstance.id,
      hasMedia: !!media,
      mediaType: media?.type
    });

    setIsSendingMessage(true);
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    try {
      // 🎯 ETAPA 1: Processar mídia se necessário
      let mediaType = 'text';
      let mediaUrl: string | undefined;

      if (media && media.file) {
        console.log('[useWhatsAppChatMessages] 📎 Processando mídia:', {
          fileName: media.file.name,
          fileSize: `${(media.file.size / 1024).toFixed(1)}KB`,
          fileType: media.file.type
        });

        // Detectar tipo de mídia baseado no arquivo
        mediaType = detectMediaType(media.file);
        
        // Converter arquivo para DataURL
        try {
          mediaUrl = await fileToDataUrl(media.file);
          console.log('[useWhatsAppChatMessages] ✅ Mídia convertida para DataURL:', {
            mediaType,
            dataUrlLength: mediaUrl.length,
            dataUrlPrefix: mediaUrl.substring(0, 50) + '...'
          });
        } catch (error) {
          console.error('[useWhatsAppChatMessages] ❌ Erro ao converter mídia:', error);
          toast.error('Erro ao processar mídia');
          return false;
        }
      }

      // 🎯 ETAPA 2: Criar mensagem otimista
      const optimisticMessage: Message = {
        id: tempId,
        text,
        fromMe: true,
        timestamp: new Date().toISOString(),
        status: 'sending',
        mediaType: normalizeMediaType(mediaType),
        mediaUrl,
        sender: 'user',
        time: new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        isIncoming: false,
        media_cache: null
      };

      // Adicionar mensagem otimista imediatamente
      addOptimisticMessage(optimisticMessage);

      // 🎯 ETAPA 3: Enviar via MessagingService (CORREÇÃO PRINCIPAL)
      console.log('[useWhatsAppChatMessages] 🚀 Enviando via MessagingService...');
      
      const result = await MessagingService.sendMessage({
        instanceId: activeInstance.id,
        phone: selectedContact.phone,
        message: text,
        mediaType: mediaType as any,
        mediaUrl
      });

      if (result.success) {
        console.log('[useWhatsAppChatMessages] ✅ Mensagem enviada com sucesso:', {
          messageId: result.messageId,
          timestamp: result.timestamp
        });

        // 🎯 ETAPA 4: Substituir mensagem otimista por dados reais
        const realMessage: Message = {
          ...optimisticMessage,
          id: result.messageId || tempId,
          timestamp: result.timestamp || new Date().toISOString(),
          status: 'sent'
        };

        // Aguardar um pouco para garantir que a mensagem foi salva no banco
        setTimeout(() => {
          replaceOptimisticMessage(tempId, realMessage);
        }, 500);

        toast.success('Mensagem enviada com sucesso!');
        return true;

      } else {
        console.error('[useWhatsAppChatMessages] ❌ Erro no envio:', result.error);
        
        // Remover mensagem otimista em caso de erro
        removeOptimisticMessage(tempId);
        
        toast.error(result.error || 'Erro ao enviar mensagem');
        return false;
      }

    } catch (error: any) {
      console.error('[useWhatsAppChatMessages] ❌ Erro crítico no envio:', error);
      
      // Remover mensagem otimista em caso de erro
      removeOptimisticMessage(tempId);
      
      toast.error(`Erro ao enviar mensagem: ${error.message}`);
      return false;
    } finally {
      setIsSendingMessage(false);
    }
  }, [selectedContact, activeInstance, user, addOptimisticMessage, replaceOptimisticMessage, removeOptimisticMessage]);

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
