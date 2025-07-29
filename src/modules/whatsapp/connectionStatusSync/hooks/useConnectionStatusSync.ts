import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyData } from '@/hooks/useCompanyData';
import { ConnectionStatusSyncOptions, ConnectionStatusData } from '../types/connectionStatusTypes';

export const useConnectionStatusSync = (options: ConnectionStatusSyncOptions = {}) => {
  const { userId, companyId } = useCompanyData();
  const channelRef = useRef<any>(null);
  const { onConnectionDetected, onModalClose, onInstanceUpdate } = options;
  
  const handleConnectionUpdate = useCallback((payload: any) => {
    const instanceData = payload.new;
    
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
      
      // Notificar sobre a conexão detectada
      if (onConnectionDetected) {
        onConnectionDetected(connectionData);
      }
      
      // Fechar modal se especificado
      if (onModalClose) {
        onModalClose();
      }
      
      // Atualizar lista de instâncias se especificado
      if (onInstanceUpdate) {
        onInstanceUpdate();
      }
    }
  }, [onConnectionDetected, onModalClose, onInstanceUpdate]);
  
  const startListening = useCallback(() => {
    if (!userId || channelRef.current) {
      return;
    }
    
    const channel = supabase
      .channel(`connection-status-sync-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'whatsapp_instances',
        filter: userId ? `created_by_user_id=eq.${userId}` : undefined
      }, handleConnectionUpdate)
      .subscribe();
      
    channelRef.current = channel;
  }, [userId, handleConnectionUpdate]);
  
  const stopListening = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);
  
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
    isListening: !!channelRef.current
  };
};
