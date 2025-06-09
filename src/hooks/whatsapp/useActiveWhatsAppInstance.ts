
import { useState, useEffect } from 'react';
import { useWhatsAppWebInstances, WhatsAppWebInstance } from './useWhatsAppWebInstances';

export const useActiveWhatsAppInstance = () => {
  const [activeInstance, setActiveInstance] = useState<WhatsAppWebInstance | null>(null);
  const { instances } = useWhatsAppWebInstances();

  useEffect(() => {
    const connectedInstance = instances.find(
      instance => instance.connection_status === 'connected' || instance.connection_status === 'ready'
    );
    
    setActiveInstance(connectedInstance || null);
  }, [instances]);

  return {
    activeInstance,
    hasActiveInstance: !!activeInstance
  };
};
