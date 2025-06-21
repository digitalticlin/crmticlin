
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { InstanceCreationService, CreateInstanceResult } from '../lib/instanceCreation';
import { toast } from 'sonner';

export const useInstanceCreation = (onSuccess?: (result: CreateInstanceResult) => void) => {
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();

  const createInstance = async (instanceName?: string): Promise<CreateInstanceResult | null> => {
    if (!user?.email) {
      toast.error('Email do usuário não disponível');
      return null;
    }

    setIsCreating(true);
    
    try {
      const result = await InstanceCreationService.createInstance({
        instanceName,
        userEmail: user.email
      });

      if (result.success) {
        toast.success(`Instância criada com sucesso!`, {
          description: "Aguarde o QR Code para conectar"
        });
        
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
