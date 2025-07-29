
import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ConnectionStatusSyncOptions, ConnectionStatusData } from '../types/connectionStatusTypes';

export const useConnectionStatusSync = (options: ConnectionStatusSyncOptions = {}) => {
  const { user } = useAuth(); // 🚀 CORREÇÃO: Conectar diretamente ao useAuth
  const channelRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const { onConnectionDetected, onModalClose, onInstanceUpdate } = options;

  // 🚀 CORREÇÃO: Debounce para callbacks
  const debouncedCallbacks = useRef<{
    onConnectionDetected?: NodeJS.Timeout;
    onModalClose?: NodeJS.Timeout;
    onInstanceUpdate?: NodeJS.Timeout;
  }>({});

  const debounceCallback = useCallback((callback: () => void, type: keyof typeof debouncedCallbacks.current) => {
    if (debouncedCallbacks.current[type]) {
      clearTimeout(debouncedCallbacks.current[type]);
    }
    
    debouncedCallbacks.current[type] = setTimeout(callback, 300);
  }, []);

  const handleConnectionUpdate = useCallback((payload: any) => {
    const instanceData = payload.new;
    
    // 🚀 CORREÇÃO: Validação dupla de ownership
    if (!user?.id || instanceData.created_by_user_id !== user.id) {
      console.warn('[ConnectionStatusSync] 🚨 Tentativa de acesso cross-user bloqueada:', {
        userId: user?.id,
        instanceOwner: instanceData.created_by_user_id,
        instanceId: instanceData.id
      });
      return;
    }
    
    // Verificar se a instância foi conectada (ready, connected, open)
    const connectedStatuses = ['ready', 'connected', 'open'];
    const isConnected = connectedStatuses.includes(instanceData.connection_status?.toLowerCase());
    
    if (isConnected) {
      const connectionData: ConnectionStatusData = {
        instanceId: instanceData.id,
        instanceName: instanceData.instance_name,
        phone: instanceData.phone,
        profileName: instanceData.profile_name,
        connectionStatus: instanceData.connection_status,
        webStatus: instanceData.web_status
      };
      
      // 🚀 CORREÇÃO: Aplicar debounce nos callbacks
      if (onConnectionDetected) {
        debounceCallback(() => onConnectionDetected(connectionData), 'onConnectionDetected');
      }
      
      if (onModalClose) {
        debounceCallback(() => onModalClose(), 'onModalClose');
      }
      
      if (onInstanceUpdate) {
        debounceCallback(() => onInstanceUpdate(), 'onInstanceUpdate');
      }
    }
  }, [user?.id, onConnectionDetected, onModalClose, onInstanceUpdate, debounceCallback]);

  // 🚀 CORREÇÃO: Sistema de reconnection com retry exponencial
  const reconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error('[ConnectionStatusSync] ❌ Máximo de tentativas de reconnection atingido');
      return;
    }

    const delay = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
    reconnectAttempts.current++;
    
    console.log(`[ConnectionStatusSync] 🔄 Tentativa de reconnection ${reconnectAttempts.current}/${maxReconnectAttempts} em ${delay}ms`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      startListening();
    }, delay);
  }, []);

  const startListening = useCallback(() => {
    // 🚀 CORREÇÃO: Validação rigorosa de usuário
    if (!user?.id) {
      console.warn('[ConnectionStatusSync] ⚠️ Usuário não autenticado');
      return;
    }

    if (channelRef.current) {
      console.log('[ConnectionStatusSync] 🔄 Removendo canal existente antes de recriar');
      supabase.removeChannel(channelRef.current);
    }
    
    // 🚀 CORREÇÃO: Filtro rigoroso de multitenancy
    const channelId = `connection-status-sync-${user.id}-${Date.now()}`;
    
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'whatsapp_instances',
        filter: `created_by_user_id=eq.${user.id}` // 🚀 CORREÇÃO: Filtro rigoroso
      }, handleConnectionUpdate)
      .subscribe((status) => {
        console.log(`[ConnectionStatusSync] 📡 Status da subscription: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          reconnectAttempts.current = 0; // Reset tentativas após sucesso
          console.log('[ConnectionStatusSync] ✅ Conectado com sucesso');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[ConnectionStatusSync] ❌ Erro no canal, tentando reconnection');
          reconnect();
        } else if (status === 'TIMED_OUT') {
          console.error('[ConnectionStatusSync] ⏱️ Timeout, tentando reconnection');
          reconnect();
        }
      });
      
    channelRef.current = channel;
  }, [user?.id, handleConnectionUpdate, reconnect]);
  
  const stopListening = useCallback(() => {
    // Limpar timeouts de reconnection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Limpar timeouts de debounce
    Object.values(debouncedCallbacks.current).forEach(timeout => {
      if (timeout) clearTimeout(timeout);
    });
    debouncedCallbacks.current = {};
    
    if (channelRef.current) {
      console.log('[ConnectionStatusSync] 🔌 Parando escuta');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    reconnectAttempts.current = 0;
  }, []);

  // 🚀 CORREÇÃO: Auto-iniciar apenas quando usuário estiver autenticado
  useEffect(() => {
    if (user?.id) {
      startListening();
    } else {
      stopListening();
    }
    
    return () => {
      stopListening();
    };
  }, [user?.id, startListening, stopListening]);

  // 🚀 CORREÇÃO: Heartbeat para detectar conexões mortas
  useEffect(() => {
    if (!channelRef.current) return;
    
    const heartbeat = setInterval(() => {
      if (channelRef.current && channelRef.current.state === 'closed') {
        console.log('[ConnectionStatusSync] 💔 Conexão morta detectada, reconnectando...');
        reconnect();
      }
    }, 30000); // Check a cada 30 segundos

    return () => clearInterval(heartbeat);
  }, [reconnect]);

  return {
    startListening,
    stopListening,
    isListening: !!channelRef.current,
    reconnectAttempts: reconnectAttempts.current
  };
};
