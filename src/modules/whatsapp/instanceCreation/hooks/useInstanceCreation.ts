
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
      console.log('[useInstanceCreation] 🚀 Criando instância para:', user.email);
      
      const result = await InstanceCreationService.createInstance({
        instanceName,
        userEmail: user.email
      });

      if (result.success) {
        toast.success(`Instância criada com sucesso!`, {
          description: "Aguarde o QR Code para conectar"
        });
        
        // Abrir modal QR automaticamente se a instância foi criada
        if (result.instance?.id) {
          console.log('[useInstanceCreation] 📱 Abrindo modal QR para:', result.instance.id);
          openModal(result.instance.id);
        }
        
        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        toast.error(`Erro ao criar instância: ${result.error}`);
      }

      return result;

    } catch (error: any) {
      console.error('[useInstanceCreation] ❌ Erro:', error);
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
