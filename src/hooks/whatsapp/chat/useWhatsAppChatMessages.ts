import { useState, useCallback, useRef, useEffect } from 'react';
import { Contact, Message } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { supabase } from '@/integrations/supabase/client';
import { MessagingService } from '@/modules/whatsapp/messaging/services/messagingService';
// ❌ REMOVIDO: import { useMessageRealtime } from './hooks/useMessageRealtime'; - Sistema antigo conflitante
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useWhatsAppDatabase } from '@/hooks/whatsapp/useWhatsAppDatabase'; // 🚀 IMPORTAR HOOK CORRIGIDO
import { toast } from 'sonner';

// Cache global otimizado com timestamps
const messagesCache = new Map<string, { data: Message[]; timestamp: number; hasMore: boolean; }>();
const CACHE_DURATION = 120 * 1000; // 2 minutos para melhor cache
const INITIAL_LOAD_LIMIT = 30; // Carregamento inicial moderado
const PAGE_SIZE = 20; // Páginas menores para melhor performance

export const useWhatsAppChatMessages = (
  selectedContact: Contact | null,
  activeInstance: WhatsAppWebInstance | null // 🚀 DEPRECADO: Será substituído por lógica específica
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Admin permissions
  const { permissions } = useUserPermissions();
  const isAdmin = permissions.canViewAllData;

  // 🚀 CORREÇÃO CRÍTICA: Usar hook multi-tenant corrigido
  const { getInstanceForLead } = useWhatsAppDatabase();

  // Refs para controle de estado e evitar loops
  const selectedContactRef = useRef(selectedContact);
  const activeInstanceRef = useRef(activeInstance);
  const currentCacheKeyRef = useRef<string>('');
  const isLoadingRef = useRef(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef(0);

  // Atualizar refs quando props mudarem
  useEffect(() => {
    selectedContactRef.current = selectedContact;
    activeInstanceRef.current = activeInstance;
  }, [selectedContact, activeInstance]);

  // ✅ FUNÇÕES DE CACHE SIMPLIFICADAS
  const getCachedMessages = useCallback((cacheKey: string) => {
    const cached = messagesCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached;
    }
    messagesCache.delete(cacheKey);
    return null;
  }, []);

  const setCachedMessages = useCallback((cacheKey: string, data: Message[], hasMore: boolean) => {
    messagesCache.set(cacheKey, {
      data: [...data],
      timestamp: Date.now(),
      hasMore
    });
  }, []);

  // ✅ FETCH DE MENSAGENS SIMPLIFICADO
  const fetchMessagesStable = useCallback(async (forceRefresh = false, loadMore = false): Promise<void> => {
    const currentContact = selectedContactRef.current;
    const currentInstance = activeInstanceRef.current;
    const now = Date.now();
    
    console.log('[WhatsApp Messages] 🔍 Fetch chamado:', {
      forceRefresh,
      loadMore,
      contactId: currentContact?.id,
      contactName: currentContact?.name,
      instanceId: currentInstance?.id,
      isLoadingRefValue: isLoadingRef.current
    });
    
    // Proteções - Admin pode ver mensagens mesmo sem instância ativa
    if (!currentContact) {
      console.warn('[WhatsApp Messages] ⚠️ Sem contato selecionado');
      return;
    }
    
    if (!currentInstance && !isAdmin) {
      console.warn('[WhatsApp Messages] ⚠️ Usuário normal sem instância ativa');
      return;
    }
    
    if (isLoadingRef.current) {
      console.warn('[WhatsApp Messages] ⚠️ Já carregando mensagens');
      return;
    }

    const cacheKey = isAdmin 
      ? `admin-${currentContact.id}` 
      : `${currentContact.id}-${currentInstance?.id}`;
    
    // Verificar cache primeiro (apenas se não for refresh forçado nem loadMore)
    if (!forceRefresh && !loadMore) {
      const cachedData = getCachedMessages(cacheKey);
      if (cachedData) {
        console.log('[WhatsApp Messages] 💾 Usando cache:', {
          contactName: currentContact.name,
          mensagens: cachedData.data.length
        });
        setMessages(cachedData.data);
        setHasMoreMessages(cachedData.hasMore);
        setIsLoadingMessages(false);
        return;
      }
    }

    // Throttling para evitar chamadas muito frequentes
    if (now - lastFetchTimeRef.current < 500 && !loadMore) {
      console.log('[WhatsApp Messages] ⚠️ Throttling ativo, ignorando');
      return;
    }

    // Debouncing para loadMore
    if (!loadMore && debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const executeQuery = async () => {
      try {
        isLoadingRef.current = true;
        
        if (loadMore) {
          setIsLoadingMore(true);
        } else {
          setIsLoadingMessages(true);
        }
        
        lastFetchTimeRef.current = now;

        const limit = loadMore ? PAGE_SIZE : INITIAL_LOAD_LIMIT;
        const offset = loadMore ? messages.length : 0;
        
        console.log('[WhatsApp Messages] 🚀 Executando query:', {
          contactId: currentContact.id,
          contactName: currentContact.name,
          instanceId: currentInstance?.id,
          isAdmin,
          loadMore,
          limit,
          offset,
          totalCarregadas: messages.length,
          userId: activeInstanceRef.current?.created_by_user_id
        });
        
        // Query adaptada para Admin vs usuário normal
        let query = supabase
          .from('messages')
          .select('*')
          .eq('lead_id', currentContact.id)
          .order('timestamp', { ascending: false })
          .range(offset, offset + limit - 1);

        // Admin vê todas as mensagens, usuário normal apenas da instância ativa
        if (!isAdmin && currentInstance?.id) {
          query = query.eq('whatsapp_number_id', currentInstance.id);
        }

        const { data: messagesData, error } = await query;

        console.log('[WhatsApp Messages] 📊 Resultado da query:', {
          sucesso: !error,
          erro: error?.message,
          mensagensRetornadas: messagesData?.length || 0,
          primeirasMensagens: messagesData?.slice(0, 3)?.map(m => ({
            id: m.id,
            text: m.text?.substring(0, 30) + '...',
            from_me: m.from_me,
            timestamp: m.timestamp
          }))
        });

        if (error) {
          console.error('[WhatsApp Messages] ❌ Erro na query:', error);
          throw new Error(`Erro ao buscar mensagens: ${error.message}`);
        }

                 // Mapear mensagens do banco para interface
         const fetchedMessages: Message[] = (messagesData || []).map(msg => ({
           id: msg.id,
           text: msg.text || '',
           sender: (msg.from_me ? "user" : "contact") as "user" | "contact",
           time: new Date(msg.timestamp).toLocaleTimeString('pt-BR', { 
             hour: '2-digit', 
             minute: '2-digit' 
           }),
           status: (msg.status as "sent" | "delivered" | "read") || "sent",
           isIncoming: !msg.from_me,
           fromMe: msg.from_me || false,
           timestamp: msg.timestamp,
           mediaType: (msg.media_type as "text" | "image" | "video" | "audio" | "document") || "text",
           mediaUrl: msg.media_url
         })).reverse(); // Inverter para ordem cronológica (mais antigas primeiro)

        const hasMore = fetchedMessages.length === limit;

        console.log('[WhatsApp Messages] ✅ Query executada:', {
          mensagensRetornadas: fetchedMessages.length,
          limit,
          hasMore,
          loadMore
        });

        if (loadMore) {
          // Adicionar novas mensagens à lista existente
          const updatedMessages = [...messages, ...fetchedMessages];
          setMessages(updatedMessages);
          setCachedMessages(cacheKey, updatedMessages, hasMore);
        } else {
          // Substituir todas as mensagens
          setMessages(fetchedMessages);
          setCachedMessages(cacheKey, fetchedMessages, hasMore);
        }

        setHasMoreMessages(hasMore);

      } catch (error: any) {
        console.error('[WhatsApp Messages] ❌ Erro ao buscar mensagens:', error);
        toast.error('Erro ao carregar mensagens');
      } finally {
        isLoadingRef.current = false;
        
        if (loadMore) {
          setIsLoadingMore(false);
        } else {
          setIsLoadingMessages(false);
        }
      }
    };

    if (!loadMore && debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (loadMore) {
      executeQuery();
    } else {
      debounceTimeoutRef.current = setTimeout(executeQuery, 100);
    }
  }, [getCachedMessages, setCachedMessages, messages.length, isAdmin]);

  // ✅ FUNÇÃO PARA CARREGAR MAIS MENSAGENS
  const loadMoreMessages = useCallback(async (): Promise<void> => {
    if (isLoadingRef.current || !hasMoreMessages) return;
    
    console.log('[WhatsApp Messages] 📚 Carregando mais mensagens...');
    await fetchMessagesStable(false, true);
  }, [fetchMessagesStable, hasMoreMessages]);

  // ✅ FUNÇÃO PARA REFRESH COMPLETO
  const fetchMessages = useCallback(async (): Promise<void> => {
    console.log('[WhatsApp Messages] 🔄 Refresh completo das mensagens...');
    await fetchMessagesStable(true, false);
  }, [fetchMessagesStable]);

  // ✅ ENVIO DE MENSAGEM CORRIGIDO PARA MULTI-TENANT
  const sendMessage = useCallback(async (text: string): Promise<boolean> => {
    const currentContact = selectedContactRef.current;
    
    if (!currentContact) {
      toast.error('Contato não selecionado');
      return false;
    }

    if (!text.trim()) {
      toast.error('Mensagem não pode estar vazia');
      return false;
    }

    // 🚀 CORREÇÃO CRÍTICA: Buscar instância específica do lead
    const correctInstance = getInstanceForLead(
      currentContact.id, 
      currentContact.leadId ? undefined : currentContact.id // Para compatibilidade
    );

    if (!correctInstance) {
      toast.error('Nenhuma instância WhatsApp conectada');
      return false;
    }

    console.log('[WhatsApp Messages] 🎯 MULTI-TENANT: Enviando mensagem via instância correta:', {
      contactId: currentContact.id,
      contactName: currentContact.name,
      leadId: currentContact.leadId,
      instanceId: correctInstance.id,
      instanceName: correctInstance.instance_name,
      instanceOwner: correctInstance.created_by_user_id,
      messageLength: text.length
    });

    setIsSending(true);
    
    try {
      // ✅ USAR MESSAGING SERVICE LIMPO COM INSTÂNCIA CORRETA
      const result = await MessagingService.sendMessage({
        instanceId: correctInstance.id,
        phone: currentContact.phone,
        message: text
      });

      if (!result.success) {
        toast.error(result.error || 'Erro ao enviar mensagem');
        return false;
      }

      toast.success('Mensagem enviada!');

      // Invalidar cache e recarregar
      const cacheKey = `${currentContact.id}-${correctInstance.id}`;
      messagesCache.delete(cacheKey);
      
      // Delay pequeno para dar tempo do webhook processar
      setTimeout(() => {
        fetchMessagesStable(true);
      }, 500);

      return true;

    } catch (error: any) {
      console.error('[WhatsApp Messages] ❌ Erro no envio:', error);
      toast.error(`Erro ao enviar mensagem: ${error.message}`);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [fetchMessagesStable, getInstanceForLead]);

  // Efeito para carregar mensagens quando contato ou instância mudarem
  useEffect(() => {
    if (selectedContact) {
      console.log('[WhatsApp Messages] 📱 Carregando mensagens para novo contato:', {
        contactId: selectedContact.id,
        contactName: selectedContact.name
      });
      fetchMessagesStable();
    } else {
      setMessages([]);
      setHasMoreMessages(true);
    }
  }, [selectedContact?.id, fetchMessagesStable]);

  // Cleanup debounce ao desmontar
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    messages,
    isLoadingMessages,
    isLoadingMore,
    hasMoreMessages,
    isSending,
    sendMessage,
    loadMoreMessages,
    fetchMessages
  };
};
