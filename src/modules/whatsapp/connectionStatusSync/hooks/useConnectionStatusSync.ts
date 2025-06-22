
import { useEffect, useCallback, useRef } from 'react';
import { useRealtimeManager } from '@/hooks/realtime/useRealtimeManager';
import { useCompanyData } from '@/hooks/useCompanyData';
import { ConnectionStatusSyncOptions, ConnectionStatusData } from '../types/connectionStatusTypes';

export const useConnectionStatusSync = (options: ConnectionStatusSyncOptions = {}) => {
  const { registerCallback, unregisterCallback } = useRealtimeManager();
  const { userId, companyId } = useCompanyData();
  const callbackIdRef = useRef<string | null>(null);
  const { onConnectionDetected, onModalClose, onInstanceUpdate } = options;
  
  const handleConnectionUpdate = useCallback((payload: any) => {
    console.log('[ConnectionStatusSync] 📡 Recebeu atualização de instância:', payload);
    
    const instanceData = payload.new;
    
    // Verificar se a instância foi conectada (ready, connected, open)
    const connectedStatuses = ['ready', 'connected', 'open'];
    const isConnected = connectedStatuses.includes(instanceData.connection_status?.toLowerCase());
    
    if (isConnected) {
      console.log('[ConnectionStatusSync] 🎉 Instância conectada detectada!', {
        id: instanceData.id,
        name: instanceData.instance_name,
        status: instanceData.connection_status,
        phone: instanceData.phone
      });
      
      const connectionData: ConnectionStatusData = {
        instanceId: instanceData.id,
        instanceName: instanceData.instance_name,
        phone: instanceData.phone,
        profileName: instanceData.profile_name,
        connectionStatus: instanceData.connection_status,
        webStatus: instanceData.web_status
      };
      
      // Notificar sobre a conexão detectada
      if (onConnectionDetected) {
        onConnectionDetected(connectionData);
      }
      
      // Fechar modal se especificado
      if (onModalClose) {
        console.log('[ConnectionStatusSync] 🚪 Fechando modal automaticamente');
        onModalClose();
      }
      
      // Atualizar lista de instâncias se especificado
      if (onInstanceUpdate) {
        console.log('[ConnectionStatusSync] 🔄 Atualizando lista de instâncias');
        onInstanceUpdate();
      }
    }
  }, [onConnectionDetected, onModalClose, onInstanceUpdate]);
  
  const startListening = useCallback(() => {
    if (!userId || callbackIdRef.current) {
      return;
    }
    
    const callbackId = `connection-status-sync-${Date.now()}`;
    callbackIdRef.current = callbackId;
    
    console.log('[ConnectionStatusSync] 🎧 Iniciando escuta para atualizações de conexão');
    
    registerCallback(
      callbackId,
      'whatsappInstanceUpdate',
      handleConnectionUpdate,
      {
        companyId: companyId || undefined
      }
    );
  }, [userId, companyId, registerCallback, handleConnectionUpdate]);
  
  const stopListening = useCallback(() => {
    if (callbackIdRef.current) {
      console.log('[ConnectionStatusSync] 🛑 Parando escuta para atualizações de conexão');
      unregisterCallback(callbackIdRef.current);
      callbackIdRef.current = null;
    }
  }, [unregisterCallback]);
  
  // Auto-iniciar escuta quando o hook é montado
  useEffect(() => {
    startListening();
    
    return () => {
      stopListening();
    };
  }, [startListening, stopListening]);
  
  return {
    startListening,
    stopListening,
    isListening: !!callbackIdRef.current
  };
};
