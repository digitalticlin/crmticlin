/**
 * 🚀 HOOK DE REALTIME PARA MENSAGENS - ISOLADO
 * 
 * Responsabilidade ÚNICA: Gerenciar updates em tempo real das mensagens
 * - Novas mensagens do contato selecionado
 * - Atualizações de status de mensagens (entregue, lida, etc.)
 * - Adicionar mensagens à lista em tempo real
 * 
 * ❌ NÃO mexe com: lista de contatos, contadores gerais
 */

import { useEffect, useRef, useCallback } from 'react';
// 🎯 TIPOS
import { Contact, Message } from '../../../types/chat';
import { WhatsAppWebInstance } from '../../../types/whatsapp';
import { supabase } from '@/integrations/supabase/client';
import { MessagesRealtimeConfig, RealtimeConnectionStatus } from './types';
import { BigQueryOptimizer } from '@/utils/immediate-bigquery-fix';

export const useMessagesRealtime = (
  selectedContact: Contact | null,
  activeInstance: WhatsAppWebInstance | null,
  onMessageInsert?: (message: Message) => void,
  onMessageUpdate?: (message: Message, rawMessage?: any) => void,
  currentMessages?: Message[],  // ✅ NOVO: receber mensagens atuais como prop
  onReplaceOptimisticMessage?: (optimisticId: string, realMessage: Message) => void  // ✅ NOVO: callback para substituir mensagens otimistas
) => {
  
  // 🔧 REFS PARA GERENCIAMENTO DE ESTADO
  const channelRef = useRef<any>(null);
  const lastContactIdRef = useRef<string | null>(null);
  const lastInstanceIdRef = useRef<string | null>(null);
  const isSubscribedRef = useRef(false);
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);
  // 🔧 PROCESSAMENTO DE MENSAGENS
  const processedMessagesRef = useRef<Set<string>>(new Set());
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const statsRef = useRef({
    totalEvents: 0,
    lastUpdate: null as number | null,
    connectionStatus: 'disconnected' as RealtimeConnectionStatus,
    reconnectAttempts: 0
  });

  // 🧹 CLEANUP OTIMIZADO
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      console.log('[Messages Realtime] 🧹 Removendo canal de mensagens');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
      statsRef.current.connectionStatus = 'disconnected';
    }
    
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
      throttleTimerRef.current = null;
    }
    
    // Reset contadores de reconexão e cache de duplicação
    reconnectAttemptsRef.current = 0;
    statsRef.current.reconnectAttempts = 0;
    processedMessagesRef.current.clear();
  }, []);

  // 💬 CONVERTER PAYLOAD PARA FORMATO MESSAGE
  const convertToMessage = useCallback((messageData: any): Message => {
    return {
      id: messageData.id,
      text: messageData.text || messageData.body || '',
      sender: messageData.from_me ? 'user' : 'contact',
      time: new Date(messageData.created_at || messageData.timestamp).toLocaleTimeString(),
      fromMe: messageData.from_me || false,
      timestamp: messageData.created_at || messageData.timestamp,
      status: messageData.status || 'sent',
      mediaType: messageData.media_type || 'text',
      mediaUrl: messageData.media_url,
      isIncoming: !messageData.from_me
    };
  }, []);

  // 📨 HANDLER PARA NOVAS MENSAGENS
  const handleNewMessage = useCallback((payload: any) => {
    try {
      const newMessage = payload.new;
      
      console.log('[Messages Realtime] 📨 Nova mensagem recebida:', {
        messageId: newMessage?.id,
        leadId: newMessage?.lead_id,
        fromMe: newMessage?.from_me,
        text: newMessage?.text?.substring(0, 30) + '...',
        instanceId: newMessage?.whatsapp_number_id
      });

      // 🔍 FILTRO SIMPLES: Só verificar instância ativa
      if (!activeInstance || newMessage?.whatsapp_number_id !== activeInstance.id) {
        console.log('[Messages Realtime] 🚫 Mensagem de instância diferente ignorada');
        return;
      }

      // ✅ NOVO: Filtrar por contato selecionado APENAS SE NECESSÁRIO
      // Permitir que TODAS as mensagens da instância sejam processadas
      // O componente pai decidirá se deve mostrar ou não
      const isForSelectedContact = selectedContact && newMessage?.lead_id === selectedContact.id;
      
      // ✅ CORREÇÃO: Se não há lead_id, pode ser mensagem sendo processada
      // Verificar se é mensagem enviada pelo frontend (import_source)
      const isSentByFrontend = newMessage?.import_source === 'messaging_service' || 
                               newMessage?.import_source === 'messaging_service_isolated';
      
      if (!isForSelectedContact && !isSentByFrontend) {
        console.log('[Messages Realtime] ℹ️ Mensagem de outro contato - não processando para tela atual');
        // ✅ NÃO BLOQUEAR - pode ser útil para atualizar lista de contatos
        return;
      }

      // ✅ SE É MENSAGEM ENVIADA PELO FRONTEND, buscar lead_id pelo telefone
      if (isSentByFrontend && !newMessage?.lead_id && selectedContact) {
        console.log('[Messages Realtime] 🔍 Mensagem enviada pelo frontend - assumindo contato atual');
        // Assumir que é para o contato selecionado se foi enviada pelo frontend
        newMessage.lead_id = selectedContact.id;
      }

      // ✅ MENSAGEM VÁLIDA PARA O CONTATO ATUAL - VERIFICAR DUPLICAÇÃO
      console.log('[Messages Realtime] 📨 Nova mensagem capturada via realtime:', {
        messageId: newMessage.id,
        text: newMessage.text?.substring(0, 50),
        fromMe: newMessage.from_me,
        leadId: newMessage.lead_id,
        importSource: newMessage.import_source,
        timestamp: newMessage.created_at
      });

      // 🚀 DETECÇÃO DE MENSAGEM OTIMISTA - EVITAR DUPLICAÇÃO
      // Se é uma mensagem enviada pelo frontend (import_source: messaging_service)
      // E há mensagens otimistas pendentes, substituir ao invés de duplicar
      if (newMessage.import_source === 'messaging_service' && newMessage.from_me) {
        console.log('[Messages Realtime] 🔍 Detectada mensagem de confirmação do frontend');
        
        // Buscar mensagem otimista correspondente pelo texto e timestamp próximo
        const optimisticMessages = (currentMessages || []).filter(m => 
          m.isOptimistic && 
          m.text === newMessage.text &&
          (m.status === 'sending' || m.status === 'sent')
        );

        if (optimisticMessages.length > 0) {
          const optimisticMessage = optimisticMessages[0];
          console.log('[Messages Realtime] 🔄 Substituindo mensagem otimista por confirmação real:', {
            optimisticId: optimisticMessage.id,
            realId: newMessage.id
          });

          // ✅ CRIAR MENSAGEM DE SUBSTITUIÇÃO
          const replacementMessage = {
            ...optimisticMessage,
            id: newMessage.id,
            status: 'sent' as const,
            isOptimistic: false,
            timestamp: newMessage.created_at,
            fromMe: true // ✅ FORÇAR TRUE para mensagens enviadas
          };

          // ✅ CALLBACK ESPECIAL PARA SUBSTITUIÇÃO
          if (onReplaceOptimisticMessage) {
            onReplaceOptimisticMessage(optimisticMessage.id, replacementMessage);
            console.log('[Messages Realtime] ✅ Mensagem otimista substituída com sucesso');
            return;
          }
        }
      }

      // ✅ CONVERTER MENSAGEM PARA FORMATO DA UI
      const messageForUI = {
        id: newMessage.id,
        text: newMessage.text || '',
        fromMe: newMessage.from_me || false,
        sender: newMessage.from_me ? 'user' as const : 'contact' as const,
        time: new Date(newMessage.created_at || new Date()).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        timestamp: newMessage.created_at,
        status: newMessage.status as any || 'sent',
        isIncoming: !newMessage.from_me,
        mediaType: newMessage.media_type as any || 'text',
        mediaUrl: newMessage.media_url || undefined,
        media_cache: newMessage.media_cache || null,
        hasMediaCache: !!newMessage.media_cache,
        mediaCacheId: newMessage.media_cache?.id || undefined
      };

      // Marcar como processada
      processedMessagesRef.current.add(newMessage.id);
      
      // Limpar cache antigas (manter apenas últimas 100 mensagens)
      if (processedMessagesRef.current.size > 100) {
        const messagesArray = Array.from(processedMessagesRef.current);
        const toDelete = messagesArray.slice(0, 50); // Remove as 50 mais antigas
        toDelete.forEach(id => processedMessagesRef.current.delete(id));
      }

      statsRef.current.totalEvents++;
      statsRef.current.lastUpdate = Date.now();

      // Converter para formato Message
      const message = convertToMessage(newMessage);

      console.log('[Messages Realtime] ✅ Processando nova mensagem:', {
        messageId: message.id,
        fromMe: message.fromMe,
        text: message.text.substring(0, 50) + '...'
      });

      // 🚀 THROTTLING OTIMIZADO para máxima responsividade
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }

      throttleTimerRef.current = setTimeout(() => {
        // Reset do contador de reconexão após mensagem bem-sucedida
        reconnectAttemptsRef.current = 0;
        statsRef.current.reconnectAttempts = 0;
        
        // Callback para nova mensagem
        if (onMessageUpdate) {
          onMessageUpdate(message);
        }

        throttleTimerRef.current = null;
      }, 25); // 25ms para ultra responsividade em tempo real

    } catch (error) {
      console.error('[Messages Realtime] ❌ Erro processando nova mensagem:', error);
      BigQueryOptimizer.handleError(error);
    }
  }, [selectedContact, activeInstance, convertToMessage, onMessageUpdate]);

  // 🔄 HANDLER PARA ATUALIZAÇÕES DE MENSAGENS
  const handleMessageUpdate = useCallback((payload: any) => {
    try {
      const updatedMessage = payload.new;
      
      console.log('[Messages Realtime] 🔄 Mensagem atualizada:', {
        messageId: updatedMessage?.id,
        leadId: updatedMessage?.lead_id,
        status: updatedMessage?.status,
        instanceId: updatedMessage?.whatsapp_number_id
      });

      // 🔍 FILTRO SIMPLES: Só verificar instância ativa
      if (!activeInstance || updatedMessage?.whatsapp_number_id !== activeInstance.id) {
        console.log('[Messages Realtime] 🚫 Update de instância diferente ignorado');
        return;
      }

      // ✅ NOVO: Filtrar por contato selecionado APENAS SE NECESSÁRIO
      const isForSelectedContact = selectedContact && updatedMessage?.lead_id === selectedContact.id;
      
      if (!isForSelectedContact) {
        console.log('[Messages Realtime] ℹ️ Update de outro contato - não processando para tela atual');
        return;
      }

      // ✅ UPDATE VÁLIDO PARA O CONTATO ATUAL - PROCESSAR
      statsRef.current.totalEvents++;
      statsRef.current.lastUpdate = Date.now();

      // Converter para formato Message
      const message = convertToMessage(updatedMessage);

      console.log('[Messages Realtime] ✅ Processando atualização de mensagem:', {
        messageId: message.id,
        status: message.status
      });

      // Throttling para atualizações
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }

      throttleTimerRef.current = setTimeout(() => {
        // Callback de atualização
        if (onMessageUpdate) {
          onMessageUpdate(message);
        }

        throttleTimerRef.current = null;
      }, 100); // 100ms para updates (menos críticos que inserções)

    } catch (error) {
      console.error('[Messages Realtime] ❌ Erro processando atualização de mensagem:', error);
      BigQueryOptimizer.handleError(error);
    }
  }, [selectedContact, activeInstance, convertToMessage, onMessageUpdate]);

  // 🚀 CONFIGURAR SUBSCRIPTION QUANDO NECESSÁRIO
  useEffect(() => {
    // 🚀 LAZY LOADING: Verificar se deve ativar
    const shouldActivate = !!selectedContact && !!activeInstance;
    
    if (!shouldActivate) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Messages Realtime] ⚠️ Lazy loading: aguardando selectedContact e activeInstance');
      }
      // Cleanup se estava ativo antes
      cleanup();
      return;
    }

    // Verificar se precisa reconfigurar
    const needsReconfigure = 
      lastContactIdRef.current !== selectedContact?.id ||
      lastInstanceIdRef.current !== activeInstance?.id ||
      !isSubscribedRef.current;

    if (!needsReconfigure) {
      return;
    }

    // Cleanup anterior
    cleanup();

    // Atualizar refs
    lastContactIdRef.current = selectedContact?.id;
    lastInstanceIdRef.current = activeInstance?.id;

    // Criar novo canal
    const channelId = `messages-realtime-${selectedContact?.id}-${activeInstance?.id}-${Date.now()}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Messages Realtime] 🚀 Configurando subscription para mensagens:', {
        selectedContactId: selectedContact?.id,
        activeInstanceId: activeInstance?.id,
        channelId
      });
    }

    statsRef.current.connectionStatus = 'connecting';

    const channel = supabase
      .channel(channelId)
      
      // 📨 CORREÇÃO: FILTRO APENAS POR INSTÂNCIA (MENOS RESTRITIVO)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `whatsapp_number_id=eq.${activeInstance?.id}` // ✅ SÓ INSTÂNCIA
      }, handleNewMessage)
      
      // 🔄 SUBSCRIPTION PARA ATUALIZAÇÕES DE MENSAGENS - SÓ INSTÂNCIA
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `whatsapp_number_id=eq.${activeInstance?.id}` // ✅ SÓ INSTÂNCIA
      }, handleMessageUpdate)
      
      .subscribe((status) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Messages Realtime] 📡 Status da subscription de mensagens:', status);
        }
        
        if (status === 'SUBSCRIBED') {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Messages Realtime] ✅ Realtime de mensagens ativo para contato:', selectedContact?.id);
          }
          isSubscribedRef.current = true;
          statsRef.current.connectionStatus = 'connected';
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Messages Realtime] ❌ Erro no canal de mensagens - tentando reconectar');
          isSubscribedRef.current = false;
          statsRef.current.connectionStatus = 'error';
          
          // 🔄 RECONEXÃO AUTOMÁTICA INTELIGENTE após erro
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++;
            statsRef.current.reconnectAttempts = reconnectAttemptsRef.current;
            
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 30000); // Backoff exponencial até 30s
            console.log(`[Messages Realtime] 🔄 Tentativa ${reconnectAttemptsRef.current}/${maxReconnectAttempts} em ${delay}ms`);
            
            setTimeout(() => {
              if (selectedContact && activeInstance) {
                console.log('[Messages Realtime] 🔄 Executando reconexão automática...');
                cleanup();
                // O useEffect irá recriar a conexão automaticamente
              }
            }, delay);
          } else {
            console.error('[Messages Realtime] ❌ Máximo de tentativas de reconexão atingido');
            statsRef.current.connectionStatus = 'failed';
          }
          
        } else if (status === 'CLOSED') {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Messages Realtime] 🔒 Canal de mensagens fechado');
          }
          isSubscribedRef.current = false;
          statsRef.current.connectionStatus = 'disconnected';
          
          // 🔄 RECONEXÃO AUTOMÁTICA após desconexão inesperada
          if (selectedContact && activeInstance) {
            setTimeout(() => {
              console.log('[Messages Realtime] 🔄 Reconectando após desconexão...');
              cleanup();
              // O useEffect irá recriar a conexão automaticamente
            }, 2000); // Aguardar 2s antes de reconectar
          }
        }
      });

    channelRef.current = channel;

  }, [selectedContact, activeInstance, handleNewMessage, handleMessageUpdate, cleanup]);

  // 🧹 CLEANUP GERAL
  useEffect(() => {
    return () => {
      console.log('[Messages Realtime] 🔌 Cleanup geral');
      cleanup();
    };
  }, [cleanup]);

  // 📊 RETORNAR ESTATÍSTICAS E CONTROLES AVANÇADOS
  return {
    isConnected: isSubscribedRef.current,
    connectionStatus: statsRef.current.connectionStatus,
    totalEvents: statsRef.current.totalEvents,
    lastUpdate: statsRef.current.lastUpdate,
    reconnectAttempts: statsRef.current.reconnectAttempts,
    processedMessagesCount: processedMessagesRef.current.size,
    forceDisconnect: cleanup,
    forceReconnect: useCallback(() => {
      console.log('[Messages Realtime] 🔄 Forçando reconexão manual...');
      reconnectAttemptsRef.current = 0; // Reset contador para permitir reconexão
      cleanup();
    }, [cleanup])
  };
}; 