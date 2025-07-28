
/**
 * 🎯 HOOK REALTIME PARA MENSAGENS - VERSÃO OTIMIZADA
 * 
 * Responsabilidade: Escutar mensagens em tempo real para contato selecionado
 * Melhorias: Filtros otimizados, debounce, tratamento de erros
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact, Message } from '../../../types/chat';
import { WhatsAppWebInstance } from '../../../types/whatsapp';

interface UseMessagesRealtimeProps {
  selectedContact: Contact | null;
  activeInstance: WhatsAppWebInstance | null;
  onNewMessage?: (message: Message) => void;
  onMessageUpdate?: (message: Message) => void;
}

export const useMessagesRealtime = ({
  selectedContact,
  activeInstance,
  onNewMessage,
  onMessageUpdate
}: UseMessagesRealtimeProps) => {
  
  const channelRef = useRef<any>(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  
  // ✅ CONVERSÃO OTIMIZADA DE MENSAGEM
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
    } satisfies Message;
  }, []);

  // ✅ CLEANUP COM RETRY RESET
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      console.log('[Messages Realtime] 🧹 Limpando canal');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    reconnectAttempts.current = 0;
  }, []);

  // ✅ RECONEXÃO AUTOMÁTICA
  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[Messages Realtime] ❌ Máximo de tentativas de reconexão atingido');
      return;
    }

    reconnectAttempts.current++;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000); // Exponential backoff
    
    console.log(`[Messages Realtime] 🔄 Tentativa de reconexão ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS} em ${delay}ms`);
    
    setTimeout(() => {
      if (selectedContact && activeInstance) {
        // Recriar a conexão
        cleanup();
        // O useEffect será executado novamente devido às dependências
      }
    }, delay);
  }, [selectedContact, activeInstance, cleanup]);

  useEffect(() => {
    // 🚫 SEM CONTATO OU INSTÂNCIA = SEM REALTIME
    if (!selectedContact || !activeInstance) {
      cleanup();
      return;
    }

    console.log('[Messages Realtime] 🚀 Configurando realtime para:', {
      contactId: selectedContact.id,
      instanceId: activeInstance.id
    });

    // 🧹 LIMPAR CANAL ANTERIOR
    cleanup();

    // 🔌 CRIAR NOVO CANAL COM ID ÚNICO
    const channelId = `messages-${selectedContact.id}-${activeInstance.id}-${Date.now()}`;

    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `lead_id=eq.${selectedContact.id}`
        },
        (payload) => {
          console.log('[Messages Realtime] 📨 Nova mensagem:', payload);
          
          const messageData = payload.new;
          
          // ✅ FILTRO OTIMIZADO: Verificar instância
          if (messageData.whatsapp_number_id !== activeInstance.id) {
            console.log('[Messages Realtime] 🚫 Mensagem de outra instância ignorada');
            return;
          }

          // ✅ DEBOUNCE PARA EVITAR MÚLTIPLAS ATUALIZAÇÕES
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }

          debounceTimerRef.current = setTimeout(() => {
            try {
              const message = convertMessage(messageData);
              
              if (onNewMessage) {
                console.log('[Messages Realtime] ➕ Adicionando nova mensagem');
                onNewMessage(message);
              }
              
              // Reset reconnect attempts on successful message
              reconnectAttempts.current = 0;
            } catch (error) {
              console.error('[Messages Realtime] ❌ Erro ao processar nova mensagem:', error);
            }
          }, 100); // 100ms debounce
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `lead_id=eq.${selectedContact.id}`
        },
        (payload) => {
          console.log('[Messages Realtime] 🔄 Mensagem atualizada:', payload);
          
          const messageData = payload.new;
          
          // ✅ FILTRO: Só processar se for da instância correta
          if (messageData.whatsapp_number_id !== activeInstance.id) {
            return;
          }

          try {
            const message = convertMessage(messageData);
            
            if (onMessageUpdate) {
              console.log('[Messages Realtime] 🔄 Atualizando mensagem');
              onMessageUpdate(message);
            }
          } catch (error) {
            console.error('[Messages Realtime] ❌ Erro ao processar atualização:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Messages Realtime] 📡 Status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('[Messages Realtime] ✅ Conectado com sucesso');
          reconnectAttempts.current = 0;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[Messages Realtime] ❌ Erro na conexão:', status);
          attemptReconnect();
        } else if (status === 'CLOSED') {
          console.log('[Messages Realtime] 🔒 Canal fechado');
        }
      });

    channelRef.current = channel;

    return cleanup;
  }, [selectedContact, activeInstance, convertMessage, onNewMessage, onMessageUpdate, cleanup, attemptReconnect]);

  // ✅ CLEANUP GERAL
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    isConnected: !!channelRef.current,
    reconnectAttempts: reconnectAttempts.current
  };
};
