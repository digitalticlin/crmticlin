
import { useState, useCallback } from 'react';
import { AutoConnectState } from '../types/whatsappWebTypes';

export const useAutoConnect = (createInstance: (name: string) => Promise<any>) => {
  const [autoConnectState, setAutoConnectState] = useState<AutoConnectState>({
    isConnecting: false,
    showQRModal: false,
    activeInstanceId: null,
  });

  // Auto connection flow
  const startAutoConnection = useCallback(async () => {
    try {
      setAutoConnectState(prev => ({ ...prev, isConnecting: true }));
      
      const instanceName = `whatsapp_${Date.now()}`;
      const instance = await createInstance(instanceName);
      
      if (instance && instance.qr_code) {
        setAutoConnectState({
          isConnecting: false,
          showQRModal: true,
          activeInstanceId: instance.id
        });
      }
    } catch (error) {
      setAutoConnectState(prev => ({ ...prev, isConnecting: false }));
    }
  }, [createInstance]);

  const closeQRModal = useCallback(() => {
    setAutoConnectState(prev => ({ 
      ...prev, 
      showQRModal: false, 
      activeInstanceId: null 
    }));
  }, []);

  const openQRModal = useCallback((instanceId: string) => {
    setAutoConnectState(prev => ({ 
      ...prev, 
      showQRModal: true, 
      activeInstanceId: instanceId 
    }));
  }, []);

  return {
    autoConnectState,
    startAutoConnection,
    closeQRModal,
    openQRModal
  };
};
