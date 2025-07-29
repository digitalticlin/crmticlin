
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { InstanceCreationService, CreateInstanceResult } from '../lib/instanceCreation';
import { toast } from 'sonner';
import { useQRCodeModal } from './useQRCodeModal';

export const useInstanceCreation = (onSuccess?: (result: CreateInstanceResult) => void) => {
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();
  const { openModal } = useQRCodeModal();

  const createInstance = async (instanceName?: string): Promise<CreateInstanceResult | null> => {
    if (!user?.email) {
      toast.error('Email do usuário não disponível');
      return null;
    }

    setIsCreating(true);
    
    try {
      console.log('[useInstanceCreation] 🚀 NÍVEL 8: Criando instância para:', user.email);
      
      const result = await InstanceCreationService.createInstance({
        instanceName,
        userEmail: user.email
      });

      if (result.success && result.instance?.id) {
        console.log('[useInstanceCreation] ✅ NÍVEL 8: Instância criada:', result.instance.id);
        
        toast.success(`Instância criada com sucesso!`, {
          description: "Modal abrindo automaticamente..."
        });
        
        // CORREÇÃO NÍVEL 8: Abrir modal imediatamente sem delays
        console.log('[useInstanceCreation] 📱 NÍVEL 8: Abrindo modal para ID:', result.instance.id);
        openModal(result.instance.id);
        
        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        toast.error(`Erro ao criar instância: ${result.error}`);
      }

      return result;

    } catch (error: any) {
      console.error('[useInstanceCreation] ❌ NÍVEL 8: Erro:', error);
      toast.error(`Erro ao criar instância: ${error.message}`);
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createInstance,
    isCreating
  };
};
