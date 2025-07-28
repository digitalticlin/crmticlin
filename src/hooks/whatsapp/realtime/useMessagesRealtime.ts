/**
 * 🎯 HOOK ISOLADO: REALTIME PARA ÁREA DE MENSAGENS
 * 
 * RESPONSABILIDADE ÚNICA: Atualizar mensagens do contato selecionado
 * ✅ ESCOPO: Apenas mensagens da conversa ativa
 * ✅ EVENTOS: INSERT/UPDATE em 'messages' do contato atual
 * 
 * ❌ NÃO FAZ: Lista de contatos, cards, contadores, outros sistemas
 * 
 * ISOLAMENTO TOTAL: Este hook NÃO interfere com useChatsRealtime
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
  onReplaceOptimisticMessage?: (optimisticId: string, realMessage: Message) => void,  // ✅ NOVO: callback para substituir mensagens otimistas
  onContactUpdate?: (leadId: string, newMessage: any) => void  // ✅ NOVO: callback para notificar contatos
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

  // 💬 CONVERTER PAYLOAD PARA FORMATO MESSAGE COM MÍDIA COMPLETA
  const convertToMessage = useCallback(async (messageData: any): Promise<Message> => {
    // 🎯 BUSCAR media_cache SE NÃO VIER NO PAYLOAD
    let mediaCache = messageData.media_cache;
    
    // Se é mensagem de mídia mas não tem cache no payload, buscar
    if (messageData.media_type && messageData.media_type !== 'text' && !mediaCache) {
      console.log('[Messages Realtime - AREA] 🔍 Buscando media_cache para mensagem:', messageData.id);
      
      try {
                 // ✅ CORREÇÃO: Buscar media_cache diretamente para evitar erro 400
         const { data: mediaCacheData } = await supabase
           .from('media_cache')
           .select(`
             id,
             base64_data,
             original_url,
             cached_url,
             file_size,
             media_type,
             file_name
           `)
           .eq('message_id', messageData.id)
           .maybeSingle();
          
        const fullMessage = mediaCacheData ? { media_cache: [mediaCacheData] } : null;
          
        if (fullMessage?.media_cache?.[0]) {
          mediaCache = fullMessage.media_cache[0];
          console.log('[Messages Realtime - AREA] ✅ Media cache encontrado:', {
            cacheId: mediaCache.id,
            mediaType: mediaCache.media_type,
            hasBase64: !!mediaCache.base64_data
          });
        }
      } catch (error) {
        console.error('[Messages Realtime - AREA] ❌ Erro buscando media_cache:', error);
      }
    }

    // 🎯 CRIAR DATA URL PARA MÍDIA SE DISPONÍVEL
    let mediaUrl = messageData.media_url;
    if (!mediaUrl && mediaCache?.base64_data) {
      // ✅ USAR FALLBACK INTELIGENTE BASEADO NO MEDIA_TYPE
      const fallbackMimeTypes = {
        'image': 'image/jpeg',
        'audio': 'audio/ogg', 
        'video': 'video/mp4',
        'document': 'application/pdf'
      };
      const mimeType = fallbackMimeTypes[mediaCache.media_type as keyof typeof fallbackMimeTypes] || 'application/octet-stream';
      console.log('[Messages Realtime - AREA] ✅ Usando MIME type baseado em media_type:', mimeType);
      
      mediaUrl = `data:${mimeType};base64,${mediaCache.base64_data}`;
      console.log('[Messages Realtime - AREA] ✅ Data URL criada:', {
        mediaType: mediaCache.media_type,
        usedMimeType: mimeType,
        dataUrlPrefix: mediaUrl.substring(0, 50) + '...'
      });
    }

    return {
      id: messageData.id,
      text: messageData.text || messageData.body || '',
      sender: messageData.from_me ? 'user' : 'contact',
      time: new Date(messageData.created_at || messageData.timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      fromMe: messageData.from_me || false,
      timestamp: messageData.created_at || messageData.timestamp,
      status: messageData.status || 'sent',
      mediaType: (messageData.media_type as any) || 'text',
      mediaUrl: mediaUrl,
      media_cache: mediaCache || null,
      hasMediaCache: !!mediaCache,
      mediaCacheId: mediaCache?.id,
      isIncoming: !messageData.from_me
    };
  }, []);

  // 📨 HANDLER PARA NOVAS MENSAGENS
  const handleNewMessage = useCallback(async (payload: any) => {
    try {
      const newMessage = payload.new;
      
      console.log('[Messages Realtime - AREA] 📨 Nova mensagem recebida para área de chat:', {
        messageId: newMessage?.id,
        leadId: newMessage?.lead_id,
        fromMe: newMessage?.from_me,
        text: newMessage?.text?.substring(0, 30) + '...',
        instanceId: newMessage?.whatsapp_number_id
      });

      // 🔍 FILTRO SIMPLES: Só verificar instância ativa
      if (!activeInstance || newMessage?.whatsapp_number_id !== activeInstance.id) {
        console.log('[Messages Realtime - AREA] 🚫 Mensagem de instância diferente ignorada');
        return;
      }

      // 🎯 FILTRO RELAXADO: Aceitar mensagens do contato selecionado OU mensagens recebidas
      const isForSelectedContact = selectedContact && newMessage?.lead_id === selectedContact.id;
      const isIncomingMessage = !newMessage?.from_me; // Mensagem recebida (não enviada pelo usuário)
      const isSentByFrontend = newMessage?.import_source === 'messaging_service' || 
                               newMessage?.import_source === 'messaging_service_isolated';
      
      // ✅ PERMITIR: Mensagens do contato atual OU mensagens recebidas OU enviadas pelo frontend
      const shouldProcess = isForSelectedContact || isIncomingMessage || isSentByFrontend;
      
      if (!shouldProcess) {
        console.log('[Messages Realtime - AREA] ℹ️ Mensagem filtrada:', {
          isForSelectedContact,
          isIncomingMessage,
          isSentByFrontend,
          leadId: newMessage?.lead_id,
          selectedContactId: selectedContact?.id
        });
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
      // Para QUALQUER mensagem enviada pelo usuário (from_me = true)
      if (newMessage.from_me) {
        console.log('[Messages Realtime - AREA] 🔍 Mensagem enviada pelo usuário - verificando duplicação otimista');
        
        // 🎯 BUSCA MAIS ROBUSTA: Por texto OU mídia E características otimistas
        const optimisticMessages = (currentMessages || []).filter(m => {
          // Para MÍDIA: buscar por tipo + timing (texto pode ser diferente)
          const isMediaMessage = newMessage.media_type && newMessage.media_type !== 'text';
          const sameMediaType = isMediaMessage && m.mediaType === newMessage.media_type;
          
          // Para TEXTO: buscar por texto exato OU similar
          const sameText = !isMediaMessage && (
            m.text === newMessage.text || 
            (m.text && newMessage.text && m.text.trim() === newMessage.text.trim())
          );
          
          // Buscar por status otimista/temporário OU fromMe = true E timing recente
          const isOptimisticStatus = m.isOptimistic || 
                                   m.status === 'sending' || 
                                   m.id?.startsWith('temp_') ||
                                   (m.fromMe && m.status !== 'delivered' && m.status !== 'read');
          
          // Buscar por timing próximo (últimos 60 segundos - mais tempo)
          const isRecent = m.timestamp && (Date.now() - new Date(m.timestamp).getTime()) < 60000;
          
          // ✅ MATCH: (texto OU mídia) + otimista + recente
          return (sameText || sameMediaType) && isOptimisticStatus && isRecent;
        });

        if (optimisticMessages.length > 0) {
          const optimisticMessage = optimisticMessages[0];
          console.log('[Messages Realtime - AREA] 🔄 SUBSTITUINDO mensagem otimista por confirmação da VPS:', {
            optimisticId: optimisticMessage.id,
            realId: newMessage.id,
            text: newMessage.text?.substring(0, 30),
            mediaType: newMessage.media_type,
            optimisticMediaUrl: optimisticMessage.mediaUrl?.substring(0, 50) + '...',
            vpsHasMediaCache: !!(newMessage.media_cache || (newMessage.media_url && newMessage.media_url.startsWith('data:')))
          });
        } else {
          console.log('[Messages Realtime - AREA] ⚠️ NENHUMA mensagem otimista encontrada para substituir - nova mensagem será criada:', {
            realId: newMessage.id,
            text: newMessage.text?.substring(0, 30),
            mediaType: newMessage.media_type,
            isMedia: !!(newMessage.media_type && newMessage.media_type !== 'text'),
            totalCurrentMessages: currentMessages?.length || 0,
            optimisticCount: (currentMessages || []).filter(m => m.isOptimistic || m.id?.startsWith('temp_')).length
          });
        }
      }

      // ✅ VERIFICAÇÃO ROBUSTA: Evitar QUALQUER duplicata
      const existingMessage = (currentMessages || []).find(m => {
        // Verificar por ID exato
        if (m.id === newMessage.id) return true;
        
        // Verificar por conteúdo similar E timing próximo
        const sameContent = m.text === newMessage.text || 
                           (m.text && newMessage.text && m.text.trim() === newMessage.text.trim());
        const sameDirection = m.fromMe === newMessage.from_me;
        const isRecent = m.timestamp && newMessage.created_at && 
                        Math.abs(new Date(m.timestamp).getTime() - new Date(newMessage.created_at).getTime()) < 10000; // 10 segundos
        
        return sameContent && sameDirection && isRecent;
      });

      if (existingMessage) {
        console.log('[Messages Realtime - AREA] 🚫 DUPLICATA DETECTADA - ignorando:', {
          existingId: existingMessage.id,
          existingTimestamp: existingMessage.timestamp,
          newId: newMessage.id,
          newTimestamp: newMessage.created_at,
          text: newMessage.text?.substring(0, 30)
        });
        return;
      }

      // ✅ USAR MAPPER OFICIAL PARA GARANTIR CONVERSÃO CORRETA DE MÍDIA
      // O realtime payload pode não incluir media_cache, então usar o mapper que busca
      const message = await convertToMessage(newMessage);

      // ✅ GARANTIR COMPATIBILIDADE ADICIONAL
      const messageForUI = {
        ...message,
        isOptimistic: false // ✅ Mensagem real da VPS
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
        
        // ✅ CORREÇÃO CRÍTICA: Usar callback correto para novas mensagens
        if (onMessageInsert) {
          console.log('[Messages Realtime] ➕ Adicionando nova mensagem via callback correto');
          onMessageInsert(message);
        } else if (onMessageUpdate) {
          console.log('[Messages Realtime] ⚠️ Fallback: usando onMessageUpdate para nova mensagem');
          onMessageUpdate(message);
        }

        // 🔝 NOTIFICAR CONTATOS: Mover contato para topo (responsabilidade única)
        if (onContactUpdate && newMessage?.lead_id) {
          console.log('[Messages Realtime] 🔝 Notificando contatos para mover para topo:', newMessage.lead_id);
          onContactUpdate(newMessage.lead_id, newMessage);
        }

        throttleTimerRef.current = null;
      }, 25); // 25ms para ultra responsividade em tempo real

    } catch (error) {
      console.error('[Messages Realtime] ❌ Erro processando nova mensagem:', error);
      BigQueryOptimizer.handleError(error);
    }
  }, [selectedContact, activeInstance, convertToMessage, onMessageUpdate]);

  // 🔄 HANDLER PARA ATUALIZAÇÕES DE MENSAGENS
  const handleMessageUpdate = useCallback(async (payload: any) => {
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
      const message = await convertToMessage(updatedMessage);

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
        console.log('[Messages Realtime] ⚠️ Lazy loading: aguardando selectedContact e activeInstance', {
          hasSelectedContact: !!selectedContact,
          selectedContactId: selectedContact?.id,
          hasActiveInstance: !!activeInstance,
          activeInstanceId: activeInstance?.id
        });
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