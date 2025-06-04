
import { useState, useEffect } from 'react';
import { useWhatsAppWebInstances, WhatsAppWebInstance } from './useWhatsAppWebInstances';

export const useActiveWhatsAppInstance = () => {
  const [activeInstance, setActiveInstance] = useState<WhatsAppWebInstance | undefined>();
  const { instances } = useWhatsAppWebInstances();

  useEffect(() => {
    if (instances.length > 0) {
      // Get the first connected instance or the first one available
      const connectedInstance = instances.find(
        instance => instance.connection_status === 'connected'
      );
      
      if (connectedInstance) {
        setActiveInstance(connectedInstance);
      } else {
        setActiveInstance(instances[0]);
      }
    } else {
      setActiveInstance(undefined);
    }
  }, [instances]);

  const updateActiveInstance = (updatedInstance: Partial<WhatsAppWebInstance>) => {
    if (activeInstance) {
      setActiveInstance({
        ...activeInstance,
        ...updatedInstance
      });
    }
  };

  return {
    activeInstance,
    setActiveInstance,
    updateActiveInstance,
    hasActiveInstance: !!activeInstance
  };
};
