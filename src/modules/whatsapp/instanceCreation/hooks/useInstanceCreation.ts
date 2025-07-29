
import { useState } from 'react';
import { toast } from 'sonner';
import { useQRCodeModal } from './useQRCodeModal';

export const useInstanceCreation = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { openModal } = useQRCodeModal();

  const createInstance = async (instanceName?: string) => {
    setIsCreating(true);
    try {
      console.log('[useInstanceCreation] Creating new instance:', instanceName);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = {
        success: true,
        instanceId: `instance_${Date.now()}`,
        instanceName: instanceName || `WhatsApp_${Date.now()}`
      };
      
      toast.success('Nova instância criada com sucesso!');
      
      // Open QR modal after successful creation
      openModal(result.instanceId, result.instanceName);
      
      return result;
      
    } catch (error: any) {
      console.error('[useInstanceCreation] Error creating instance:', error);
      toast.error(`Erro ao criar instância: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createInstance,
    isCreating
  };
};
