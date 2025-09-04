
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { InstanceCreationService, CreateInstanceResult } from '../lib/instanceCreation';
import { toast } from 'sonner';

// Estados de criação da instância
type CreationState = 
  | 'idle'           // Estado inicial
  | 'creating_vps'   // Criando na VPS
  | 'vps_created'    // VPS criada, abrindo modal
  | 'failed'         // Falha na criação

export const useInstanceCreation = (onSuccess?: (result: CreateInstanceResult) => void) => {
  const [creationState, setCreationState] = useState<CreationState>('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Computed states para compatibilidade
  const isCreating = creationState === 'creating_vps';
  const isOpeningModal = creationState === 'vps_created';

  const createInstance = async (instanceName?: string): Promise<CreateInstanceResult | null> => {
    if (!user?.email) {
      toast.error('Email do usuário não disponível');
      return null;
    }

    // Resetar estado
    setCreationState('creating_vps');
    setError(null);
    
    // Toast inicial: preparando conexão
    const toastId = toast.loading('🔄 Preparando conexão WhatsApp...', {
      description: 'Criando instância na VPS...'
    });
    
    try {
      console.log('[useInstanceCreation] 🚀 NOVA UX: Criando instância para:', user.email);
      
      const result = await InstanceCreationService.createInstance({
        instanceName,
        userEmail: user.email
      });

      if (result.success && result.instance?.id) {
        console.log('[useInstanceCreation] ✅ VPS criada com sucesso:', result.instance.id);
        
        // Atualizar estado
        setCreationState('vps_created');
        
        // Toast de sucesso: VPS criada  
        toast.success('⚡ Instância criada na VPS!', {
          id: toastId,
          description: 'Preparando QR Code...'
        });
        
        // Resetar estado - não mais abrindo modal aqui
        setTimeout(() => {
          setCreationState('idle');
          if (onSuccess) {
            onSuccess(result);
          }
        }, 100);
        
      } else {
        console.error('[useInstanceCreation] ❌ Falha na criação:', result.error);
        setCreationState('failed');
        setError(result.error || 'Erro desconhecido');
        
        toast.error('❌ Falha ao criar instância', {
          id: toastId,
          description: result.error || 'Tente novamente em alguns segundos'
        });
      }

      return result;

    } catch (error: any) {
      console.error('[useInstanceCreation] ❌ Erro inesperado:', error);
      setCreationState('failed');
      setError(error.message);
      
      toast.error('❌ Erro ao conectar com servidor', {
        id: toastId,
        description: 'Verifique sua conexão e tente novamente'
      });
      
      return null;
    }
  };

  // Função para resetar estado (útil para retry)
  const resetState = () => {
    setCreationState('idle');
    setError(null);
  };

  return {
    // Estados
    creationState,
    isCreating,
    isOpeningModal,
    error,
    
    // Funções
    createInstance,
    resetState,
    
    // Computed states para compatibilidade com componentes existentes
    isLoading: isCreating || isOpeningModal
  };
};
