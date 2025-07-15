import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface IntegratedCreationState {
  isCreating: boolean;
  creationStage: string;
  showModal: boolean;
  instanceId: string | null;
  instanceName: string | null;
  error: string | null;
}

interface CreateInstanceOptions {
  instanceName?: string;
  onSuccess?: (instanceId: string, instanceName: string) => void;
  onError?: (error: string) => void;
}

export const useIntegratedInstanceCreation = () => {
  const [state, setState] = useState<IntegratedCreationState>({
    isCreating: false,
    creationStage: '',
    showModal: false,
    instanceId: null,
    instanceName: null,
    error: null
  });

  const { user } = useAuth();

  const generateInstanceName = useCallback((): string => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const userPrefix = user?.email?.split('@')[0]?.toLowerCase().replace(/[^a-zA-Z0-9]/g, '') || 'user';
    return `${userPrefix}_${timestamp}_${randomId}`;
  }, [user?.email]);

  const createInstanceWithAutoModal = useCallback(async (options: CreateInstanceOptions = {}) => {
    if (!user?.email) {
      toast.error('Usuário não autenticado');
      return;
    }

    const instanceName = options.instanceName || generateInstanceName();
    
    setState(prev => ({
      ...prev,
      isCreating: true,
      creationStage: 'Preparando criação...',
      error: null
    }));

    try {
      console.log('[IntegratedCreation] 🚀 Iniciando criação integrada:', instanceName);
      
      // ETAPA 1: Criar instância via Edge Function
      setState(prev => ({ ...prev, creationStage: 'Criando instância na VPS...' }));
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'create_instance',
          instanceName: instanceName
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na chamada da função');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Falha ao criar instância');
      }

      console.log('[IntegratedCreation] ✅ Instância criada:', data.instance);
      
      // ETAPA 2: Obter ID da instância criada
      const instanceId = data.instance?.id || data.instance?.vps_instance_id || instanceName;
      
      setState(prev => ({
        ...prev,
        creationStage: 'Instância criada! Abrindo modal...',
        instanceId: instanceId,
        instanceName: instanceName
      }));

      // ETAPA 3: Aguardar um momento para sincronização
      await new Promise(resolve => setTimeout(resolve, 1000));

      // ETAPA 4: Abrir modal automaticamente
      console.log('[IntegratedCreation] 📱 Abrindo modal automático para:', instanceId);
      
      setState(prev => ({
        ...prev,
        isCreating: false,
        creationStage: '',
        showModal: true
      }));

      toast.success(`Instância "${instanceName}" criada! Modal aberto automaticamente.`);
      
      if (options.onSuccess) {
        options.onSuccess(instanceId, instanceName);
      }

    } catch (error: any) {
      console.error('[IntegratedCreation] ❌ Erro:', error);
      
      setState(prev => ({
        ...prev,
        isCreating: false,
        creationStage: '',
        error: error.message
      }));

      toast.error(`Erro ao criar instância: ${error.message}`);
      
      if (options.onError) {
        options.onError(error.message);
      }
    }
  }, [user?.email, generateInstanceName]);

  const closeModal = useCallback(() => {
    console.log('[IntegratedCreation] 🚪 Fechando modal integrado');
    
    setState(prev => ({
      ...prev,
      showModal: false,
      instanceId: null,
      instanceName: null,
      error: null
    }));
  }, []);

  const resetState = useCallback(() => {
    console.log('[IntegratedCreation] 🔄 Resetando estado');
    
    setState({
      isCreating: false,
      creationStage: '',
      showModal: false,
      instanceId: null,
      instanceName: null,
      error: null
    });
  }, []);

  return {
    ...state,
    createInstanceWithAutoModal,
    closeModal,
    resetState
  };
}; 