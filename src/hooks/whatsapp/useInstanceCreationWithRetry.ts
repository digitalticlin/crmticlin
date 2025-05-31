
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { toast } from "sonner";
import { WhatsAppWebInstance } from "./useWhatsAppWebInstances";

interface CreationState {
  isCreating: boolean;
  currentStep: string;
  retryCount: number;
  maxRetries: number;
}

export const useInstanceCreationWithRetry = (companyId?: string) => {
  const [state, setState] = useState<CreationState>({
    isCreating: false,
    currentStep: '',
    retryCount: 0,
    maxRetries: 3
  });

  const updateStep = (step: string) => {
    setState(prev => ({ ...prev, currentStep: step }));
  };

  const pollForQRCode = async (instanceId: string, maxAttempts = 10): Promise<string | null> => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        updateStep(`Buscando QR Code... (${i + 1}/${maxAttempts})`);
        
        const { data: instance, error } = await supabase
          .from('whatsapp_instances')
          .select('qr_code, vps_instance_id')
          .eq('id', instanceId)
          .single();

        if (error) throw error;

        if (instance?.qr_code) {
          return instance.qr_code;
        }

        // Se tem vps_instance_id, tentar buscar QR code do VPS
        if (instance?.vps_instance_id) {
          const result = await WhatsAppWebService.getQRCode(instance.vps_instance_id);
          if (result.success && result.qrCode) {
            // Atualizar no banco
            await supabase
              .from('whatsapp_instances')
              .update({ qr_code: result.qrCode })
              .eq('id', instanceId);
            
            return result.qrCode;
          }
        }

        // Aguardar 2 segundos antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Polling attempt ${i + 1} failed:`, error);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return null;
  };

  const cleanupFailedInstance = async (instanceId: string) => {
    try {
      await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', instanceId);
    } catch (error) {
      console.error('Error cleaning up failed instance:', error);
    }
  };

  const createInstanceWithRetry = async (instanceName: string): Promise<{
    success: boolean;
    instance?: WhatsAppWebInstance;
    qrCode?: string;
    error?: string;
  }> => {
    if (!companyId) {
      return { success: false, error: 'Company ID é obrigatório' };
    }

    setState(prev => ({ ...prev, isCreating: true, retryCount: 0 }));

    for (let attempt = 0; attempt < state.maxRetries; attempt++) {
      try {
        setState(prev => ({ ...prev, retryCount: attempt + 1 }));
        updateStep(attempt === 0 ? 'Conectando ao servidor...' : `Tentativa ${attempt + 1}/${state.maxRetries}...`);
        
        console.log(`Attempt ${attempt + 1}: Creating instance:`, instanceName);
        const result = await WhatsAppWebService.createInstance(instanceName);
        
        if (!result.success) {
          if (attempt === state.maxRetries - 1) {
            throw new Error(result.error || 'Falha ao criar instância');
          }
          await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s before retry
          continue;
        }

        const newInstance = result.instance;
        if (!newInstance) {
          throw new Error('Instância criada mas não retornada');
        }

        // Se já tem QR code, retornar
        if (newInstance.qr_code) {
          setState(prev => ({ ...prev, isCreating: false }));
          return {
            success: true,
            instance: newInstance,
            qrCode: newInstance.qr_code
          };
        }

        // Se não tem QR code, fazer polling
        updateStep('Gerando QR Code...');
        const qrCode = await pollForQRCode(newInstance.id);
        
        if (qrCode) {
          setState(prev => ({ ...prev, isCreating: false }));
          return {
            success: true,
            instance: { ...newInstance, qr_code: qrCode },
            qrCode
          };
        }

        // Se chegou aqui, falhou em obter QR Code
        if (attempt === state.maxRetries - 1) {
          await cleanupFailedInstance(newInstance.id);
          throw new Error('Não foi possível gerar o QR Code');
        }

      } catch (err) {
        console.error(`Attempt ${attempt + 1} failed:`, err);
        
        if (attempt === state.maxRetries - 1) {
          setState(prev => ({ ...prev, isCreating: false }));
          const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
          toast.error(`Erro após ${state.maxRetries} tentativas: ${errorMessage}`);
          return { success: false, error: errorMessage };
        }
        
        // Wait before retry
        updateStep(`Erro na tentativa ${attempt + 1}. Tentando novamente em 3s...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    setState(prev => ({ ...prev, isCreating: false }));
    return { success: false, error: 'Todas as tentativas falharam' };
  };

  const cancelCreation = useCallback(() => {
    setState(prev => ({ ...prev, isCreating: false, currentStep: '' }));
  }, []);

  return {
    createInstanceWithRetry,
    cancelCreation,
    isCreating: state.isCreating,
    currentStep: state.currentStep,
    retryCount: state.retryCount,
    maxRetries: state.maxRetries
  };
};
