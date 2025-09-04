
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface CreationState {
  isCreating: boolean;
  creationStage: string;
  createdInstance: any | null;
  error: string | null;
}

interface CreationResult {
  success: boolean;
  instance?: any;
  error?: string;
}

export const useOptimizedInstanceCreation = () => {
  const [state, setState] = useState<CreationState>({
    isCreating: false,
    creationStage: '',
    createdInstance: null,
    error: null
  });

  const { user } = useAuth();

  const generateIntelligentInstanceName = async (userEmail: string): Promise<string> => {
    const timestamp = Date.now();
    const baseName = userEmail.split('@')[0];
    return `whatsapp_${baseName}_${timestamp}`;
  };

  const createInstanceWithConfirmation = async (): Promise<CreationResult> => {
    if (!user?.email) {
      throw new Error('Email do usuário não disponível');
    }

    setState(prev => ({ ...prev, isCreating: true, creationStage: 'Preparando...', error: null }));

    try {
      // ETAPA 1: Gerar nome inteligente
      const intelligentName = await generateIntelligentInstanceName(user.email);
      setState(prev => ({ ...prev, creationStage: 'Criando instância...' }));
      
      console.log('[Optimized Creation] 🎯 Criando instância:', intelligentName);
      toast.loading(`Criando instância "${intelligentName}"...`, { id: 'creating-instance' });

      // ETAPA 2: Criar instância na VPS (aguardar confirmação COMPLETA)
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'create_instance',
          instanceName: intelligentName
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na chamada da função');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Falha ao criar instância');
      }

      // ETAPA 3: CONFIRMAÇÃO da VPS recebida - instância existe
      console.log('[Optimized Creation] ✅ Instância confirmada pela VPS:', data.instance);
      
      setState(prev => ({ 
        ...prev, 
        creationStage: 'Instância criada! Preparando QR...', 
        createdInstance: data.instance 
      }));

      // ETAPA 4: Aguardar breve sincronização VPS-DB
      await new Promise(resolve => setTimeout(resolve, 1000));

      setState(prev => ({ ...prev, creationStage: 'Pronto para QR Code!' }));
      toast.success(`Instância "${intelligentName}" criada! Agora podemos gerar o QR Code.`, { id: 'creating-instance' });

      return {
        success: true,
        instance: data.instance
      };

    } catch (error: any) {
      console.error('[Optimized Creation] ❌ Erro:', error);
      setState(prev => ({ ...prev, error: error.message }));
      toast.error(`Erro ao criar instância: ${error.message}`, { id: 'creating-instance' });
      
      return {
        success: false,
        error: error.message
      };
    } finally {
      setState(prev => ({ ...prev, isCreating: false, creationStage: '' }));
    }
  };

  const reset = () => {
    setState({
      isCreating: false,
      creationStage: '',
      createdInstance: null,
      error: null
    });
  };

  return {
    ...state,
    createInstanceWithConfirmation,
    reset
  };
};
