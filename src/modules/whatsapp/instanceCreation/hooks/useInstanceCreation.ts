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

      if (result.success && result.instance?.id) {
        console.log('[useInstanceCreation] ✅ Instância criada:', result.instance.id);
        
        toast.success(`Instância criada com sucesso!`, {
          description: "Aguarde o QR Code para conectar"
        });
        
        // Verificação explícita para debug
        if (typeof openModal === 'function') {
          console.log('[useInstanceCreation] 📱 openModal é uma função válida');
        } else {
          console.error('[useInstanceCreation] ⚠️ openModal não é uma função:', openModal);
        }
        
        // CORREÇÃO: Abrir modal imediatamente sem delays e verificações
        console.log('[useInstanceCreation] 📱 Abrindo modal QR imediatamente para ID:', result.instance.id);
        
        // Envolva em setTimeout para garantir que é processado após outras operações
        setTimeout(() => {
          console.log('[useInstanceCreation] ⏱️ Executando abertura do modal após timeout mínimo');
          openModal(result.instance.id);
        }, 100);
        
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
