
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { InstanceCreationService, CreateInstanceResult } from '../lib/instanceCreation';
import { toast } from 'sonner';
import { useQRCodeModal } from './useQRCodeModal';

export const useInstanceCreation = (onSuccess?: (result: CreateInstanceResult) => void) => {
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();
  const { openModal } = useQRCodeModal();

  // CORREÇÃO: Função para aguardar instância estar disponível
  const waitForInstanceAvailability = async (instanceId: string, maxAttempts = 10): Promise<boolean> => {
    console.log('[useInstanceCreation] 🔍 Aguardando instância estar disponível:', instanceId);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error } = await supabase
          .from('whatsapp_instances')
          .select('id, instance_name, connection_status')
          .eq('id', instanceId)
          .single();

        if (!error && data) {
          console.log('[useInstanceCreation] ✅ Instância encontrada no banco:', data);
          return true;
        }

        console.log('[useInstanceCreation] ⏳ Tentativa', attempt, 'de', maxAttempts);
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.log('[useInstanceCreation] ❌ Erro ao verificar instância:', error);
      }
    }

    console.log('[useInstanceCreation] ❌ Timeout aguardando instância');
    return false;
  };

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
        
        // CORREÇÃO: Aguardar instância estar disponível no banco antes de abrir modal
        const isAvailable = await waitForInstanceAvailability(result.instance.id);
        
        if (isAvailable) {
          console.log('[useInstanceCreation] 📱 Abrindo modal QR após confirmação no banco');
          
          // CORREÇÃO: Delay adicional para garantir sincronização
          setTimeout(() => {
            openModal(result.instance.id);
          }, 200);
        } else {
          console.warn('[useInstanceCreation] ⚠️ Instância não encontrada no banco, mas continuando...');
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
