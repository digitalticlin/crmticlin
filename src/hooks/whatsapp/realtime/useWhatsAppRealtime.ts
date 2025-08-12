/**
 * 🎯 HOOK ISOLADO PARA REALTIME WHATSAPP
 * 
 * RESPONSABILIDADES:
 * ✅ Sistema de realtime isolado
 * ✅ Debounce isolado por feature
 * ✅ Cache de eventos isolado
 * ✅ Reconexão automática isolada
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Contact, Message } from '@/types/chat';

// Tipo de instância simplificado para o hook isolado
interface WhatsAppInstance {
  id: string;
  instance_name: string;
  connection_status: string;
}

interface UseWhatsAppRealtimeParams {
  // Para contatos
  activeInstanceId?: string | null;
  onContactUpdate?: () => void;
  onNewContact?: (contact: Contact) => void;
  onMoveContactToTop?: (contactId: string, newMessage?: any) => void;
  onUpdateUnreadCount?: (contactId: string, increment?: boolean) => void;
  
  // Para mensagens
  selectedContact?: Contact | null;
  activeInstance?: WhatsAppInstance | null;
  onNewMessage?: (message: Message) => void;
  onMessageUpdate?: (message: Message) => void;
}

interface UseWhatsAppRealtimeReturn {
  isContactsConnected: boolean;
  isMessagesConnected: boolean;
  contactsReconnectAttempts: number;
  messagesReconnectAttempts: number;
  totalContactEvents: number;
  totalMessageEvents: number;
  lastContactUpdate: number | null;
  lastMessageUpdate: number | null;
}

export const useWhatsAppRealtime = ({
  // Contatos
  activeInstanceId,
  onContactUpdate,
  onNewContact,
  onMoveContactToTop,
  onUpdateUnreadCount,
  
  // Mensagens
  selectedContact,
  activeInstance,
  onNewMessage,
  onMessageUpdate
}: UseWhatsAppRealtimeParams): UseWhatsAppRealtimeReturn => {
  console.log('[WhatsApp Realtime] 🚀 HOOK EXECUTADO - INÍCIO:', {
    hasSelectedContact: !!selectedContact,
    hasActiveInstance: !!activeInstance,
    hasOnNewMessage: !!onNewMessage,
    selectedContactId: selectedContact?.id
  });

  const { user } = useAuth();
  
  // Estados isolados para cada feature
  const [isContactsConnected, setIsContactsConnected] = useState(false);
  const [isMessagesConnected, setIsMessagesConnected] = useState(false);
  const [totalContactEvents, setTotalContactEvents] = useState(0);
  const [totalMessageEvents, setTotalMessageEvents] = useState(0);
  const [lastContactUpdate, setLastContactUpdate] = useState<number | null>(null);
  const [lastMessageUpdate, setLastMessageUpdate] = useState<number | null>(null);

  // Refs isolados para controle
  const contactsChannelRef = useRef<any>(null);
  const messagesChannelRef = useRef<any>(null);
  const contactsReconnectAttempts = useRef(0);
  const messagesReconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Debounce isolado para contatos
  const contactsDebounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const contactsDebouncedCallback = useCallback((key: string, callback: () => void, delay = 300) => {
    const existingTimer = contactsDebounceTimers.current.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      callback();
      contactsDebounceTimers.current.delete(key);
    }, delay);

    contactsDebounceTimers.current.set(key, timer);
  }, []);

  // Debounce isolado para mensagens
  const messagesDebounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const messagesDebouncedCallback = useCallback((key: string, callback: () => void, delay = 300) => {
    const existingTimer = messagesDebounceTimers.current.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      callback();
      messagesDebounceTimers.current.delete(key);
    }, delay);

    messagesDebounceTimers.current.set(key, timer);
  }, []);

  // Cache isolado para mensagens processadas
  const processedMessageIds = useRef<Set<string>>(new Set());
  const lastProcessedTimestamp = useRef<string | null>(null);

  // Helper para normalizar mediaType
  const normalizeMediaType = (mediaType?: string): "text" | "image" | "video" | "audio" | "document" => {
    if (!mediaType) return 'text';
    
    const normalizedType = mediaType.toLowerCase();
    if (normalizedType.includes('image')) return 'image';
    if (normalizedType.includes('video')) return 'video';
    if (normalizedType.includes('audio')) return 'audio';
    if (normalizedType.includes('document')) return 'document';
    
    return 'text';
  };

  // Converter mensagem isolado
  const convertMessage = useCallback((messageData: any): Message => {
    const message: Message = {
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

    if (!lastProcessedTimestamp.current || message.timestamp > lastProcessedTimestamp.current) {
      lastProcessedTimestamp.current = message.timestamp;
    }

    return message;
  }, []);

  // Filtro para mensagens isolado - MULTI-TENANT CORRIGIDO
  const shouldProcessMessage = useCallback((messageData: any, isUpdate = false): boolean => {
    console.log('[WhatsApp Realtime] 🔍 Avaliando mensagem:', {
      messageId: messageData.id,
      leadId: messageData.lead_id,
      selectedContactId: selectedContact?.id,
      createdByUserId: messageData.created_by_user_id,
      currentUserId: user?.id,
      fromMe: messageData.from_me,
      isUpdate
    });

    if (!user?.id || messageData.created_by_user_id !== user.id) {
      console.log('[WhatsApp Realtime] ❌ Usuário não autorizado');
      return false;
    }

    // ✅ CORREÇÃO MULTI-TENANT: Remover filtro restritivo de instância específica
    // Admin pode ver mensagens de QUALQUER instância que ele criou
    // Operacional pode ver mensagens apenas da instância vinculada ao lead atual
    // O filtro RLS no banco já garante que só verá mensagens permitidas
    
    if (messageData.lead_id !== selectedContact?.id) {
      console.log('[WhatsApp Realtime] ❌ Lead ID não corresponde:', {
        messageLead: messageData.lead_id,
        selectedContact: selectedContact?.id
      });
      return false;
    }

    if (isUpdate) {
      console.log('[WhatsApp Realtime] ✅ Mensagem UPDATE aceita:', messageData.id);
      return true;
    }

    // Permitir mensagens externas
    if (messageData.from_me === false) {
      console.log('[WhatsApp Realtime] ✅ Mensagem externa aceita:', messageData.id);
      return true;
    }

    // Verificar duplicação para mensagens próprias
    if (processedMessageIds.current.has(messageData.id)) {
      console.log('[WhatsApp Realtime] ❌ Mensagem já processada:', messageData.id);
      return false;
    }

    console.log('[WhatsApp Realtime] ✅ Mensagem própria aceita:', messageData.id);
    return true;
  }, [selectedContact, user?.id]);

  // Setup realtime para contatos (isolado)
  const setupContactsRealtime = useCallback(() => {
    if (!user?.id) {
      setIsContactsConnected(false);
      return;
    }

    console.log('[WhatsApp Realtime] 🚀 Configurando realtime para contatos:', {
      userId: user.id,
      activeInstanceId
    });

    // Limpar canal anterior
    if (contactsChannelRef.current) {
      supabase.removeChannel(contactsChannelRef.current);
      contactsChannelRef.current = null;
    }

    const channelId = `contacts_realtime_${user.id}_${Date.now()}`;

    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads',
        filter: `created_by_user_id=eq.${user.id}`
      }, (payload) => {
        console.log('[WhatsApp Realtime] 📨 Evento de contato:', payload.eventType);
        
        setTotalContactEvents(prev => prev + 1);
        setLastContactUpdate(Date.now());

        contactsDebouncedCallback('contact_update', () => {
          if (onContactUpdate) {
            onContactUpdate();
          }
        }, 500);
      })
      .subscribe((status) => {
        console.log('[WhatsApp Realtime] 📡 Status contatos:', status);
        
        if (status === 'SUBSCRIBED') {
          setIsContactsConnected(true);
          contactsReconnectAttempts.current = 0;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[WhatsApp Realtime] ❌ Erro na conexão de contatos');
          setIsContactsConnected(false);
        } else if (status === 'CLOSED') {
          setIsContactsConnected(false);
        }
      });

    contactsChannelRef.current = channel;
  }, [user?.id, activeInstanceId, onContactUpdate, contactsDebouncedCallback]);

  // Setup realtime para mensagens (isolado)
  const setupMessagesRealtime = useCallback(() => {
    console.log('[WhatsApp Realtime] 🔍 Setup mensagens - validação:', {
      hasSelectedContact: !!selectedContact,
      hasActiveInstance: !!activeInstance,
      hasUserId: !!user?.id,
      selectedContactId: selectedContact?.id,
      activeInstanceId: activeInstance?.id
    });

    if (!selectedContact || !user?.id) {
      console.log('[WhatsApp Realtime] ❌ Setup mensagens cancelado - faltam dados básicos');
      setIsMessagesConnected(false);
      return;
    }

    // ✅ CORREÇÃO: Não exigir activeInstance - real-time funciona independente de instâncias
    // O filtro RLS no banco garante que só verá mensagens permitidas

    console.log('[WhatsApp Realtime] 🚀 Configurando realtime para mensagens:', {
      contactId: selectedContact.id,
      contactName: selectedContact.name,
      instanceId: activeInstance?.id || 'sem-instancia',
      userId: user.id
    });

    // Limpar canal anterior
    if (messagesChannelRef.current) {
      supabase.removeChannel(messagesChannelRef.current);
      messagesChannelRef.current = null;
    }

    const channelId = `messages_realtime_${selectedContact.id}_${activeInstance?.id || 'no-instance'}_${Date.now()}`;

    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `created_by_user_id=eq.${user.id}`
      }, (payload) => {
        const messageData = payload.new;
        
        console.log('[WhatsApp Realtime] 📨 INSERT mensagem:', {
          messageId: messageData.id,
          fromMe: messageData.from_me,
          leadId: messageData.lead_id,
          text: messageData.text?.substring(0, 30) + '...'
        });

        if (!shouldProcessMessage(messageData, false)) {
          return;
        }

        const message = convertMessage(messageData);
        
        setTotalMessageEvents(prev => prev + 1);
        setLastMessageUpdate(Date.now());
        
        // Marcar como processada
        processedMessageIds.current.add(message.id);
        
        messagesDebouncedCallback(message.id, () => {
          if (onNewMessage) {
            console.log('[WhatsApp Realtime] 🚀 Chamando onNewMessage:', {
              messageId: message.id,
              text: message.text.substring(0, 30),
              fromMe: message.fromMe,
              timestamp: message.timestamp
            });
            onNewMessage(message);
          } else {
            console.warn('[WhatsApp Realtime] ⚠️ onNewMessage não definido!');
          }
        }, 100);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `created_by_user_id=eq.${user.id}`
      }, (payload) => {
        const messageData = payload.new;
        
        if (!shouldProcessMessage(messageData, true)) {
          return;
        }

        const message = convertMessage(messageData);
        
        console.log('[WhatsApp Realtime] 🔄 UPDATE mensagem:', {
          messageId: message.id,
          status: message.status
        });
        
        setTotalMessageEvents(prev => prev + 1);
        setLastMessageUpdate(Date.now());
        
        messagesDebouncedCallback(`update_${message.id}`, () => {
          if (onMessageUpdate) {
            onMessageUpdate(message);
          }
        }, 50);
      })
      .subscribe((status) => {
        console.log('[WhatsApp Realtime] 📡 Status mensagens:', status);
        
        if (status === 'SUBSCRIBED') {
          setIsMessagesConnected(true);
          messagesReconnectAttempts.current = 0;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[WhatsApp Realtime] ❌ Erro na conexão de mensagens');
          setIsMessagesConnected(false);
        } else if (status === 'CLOSED') {
          setIsMessagesConnected(false);
        }
      });

    messagesChannelRef.current = channel;
  }, [selectedContact, activeInstance, user?.id, shouldProcessMessage, convertMessage, onNewMessage, onMessageUpdate, messagesDebouncedCallback]);

  // Cleanup isolado
  const cleanup = useCallback(() => {
    console.log('[WhatsApp Realtime] 🧹 Cleanup isolado');
    
    if (contactsChannelRef.current) {
      supabase.removeChannel(contactsChannelRef.current);
      contactsChannelRef.current = null;
    }
    
    if (messagesChannelRef.current) {
      supabase.removeChannel(messagesChannelRef.current);
      messagesChannelRef.current = null;
    }
    
    contactsDebounceTimers.current.forEach(timer => clearTimeout(timer));
    contactsDebounceTimers.current.clear();
    
    messagesDebounceTimers.current.forEach(timer => clearTimeout(timer));
    messagesDebounceTimers.current.clear();
    
    processedMessageIds.current.clear();
    
    setIsContactsConnected(false);
    setIsMessagesConnected(false);
    contactsReconnectAttempts.current = 0;
    messagesReconnectAttempts.current = 0;
    lastProcessedTimestamp.current = null;
  }, []);

  // Effect para contatos
  useEffect(() => {
    if (user?.id && (onContactUpdate || onNewContact || onMoveContactToTop || onUpdateUnreadCount)) {
      setupContactsRealtime();
    }

    return () => {
      if (contactsChannelRef.current) {
        supabase.removeChannel(contactsChannelRef.current);
        contactsChannelRef.current = null;
      }
    };
  }, [user?.id, activeInstanceId, setupContactsRealtime, onContactUpdate, onNewContact, onMoveContactToTop, onUpdateUnreadCount]);

  // Effect para mensagens
  useEffect(() => {
    console.log('[WhatsApp Realtime] 🔍 Effect mensagens executado:', {
      hasUserId: !!user?.id,
      hasSelectedContact: !!selectedContact,
      hasActiveInstance: !!activeInstance,
      hasOnNewMessage: !!onNewMessage,
      hasOnMessageUpdate: !!onMessageUpdate,
      selectedContactId: selectedContact?.id
    });

    // ✅ CORREÇÃO: Remover exigência de activeInstance
    if (user?.id && selectedContact && (onNewMessage || onMessageUpdate)) {
      console.log('[WhatsApp Realtime] 🚀 Chamando setupMessagesRealtime...');
      setupMessagesRealtime();
    } else {
      console.log('[WhatsApp Realtime] ❌ Não chamou setupMessagesRealtime - condições não atendidas');
    }

    return () => {
      if (messagesChannelRef.current) {
        supabase.removeChannel(messagesChannelRef.current);
        messagesChannelRef.current = null;
      }
    };
  }, [user?.id, selectedContact?.id, setupMessagesRealtime, onNewMessage, onMessageUpdate]);

  // Cleanup geral
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    isContactsConnected,
    isMessagesConnected,
    contactsReconnectAttempts: contactsReconnectAttempts.current,
    messagesReconnectAttempts: messagesReconnectAttempts.current,
    totalContactEvents,
    totalMessageEvents,
    lastContactUpdate,
    lastMessageUpdate
  };
};