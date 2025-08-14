
import { useState } from 'react';
import { toast } from 'sonner';

export const useAIColumnMutation = () => {
  const [isAIEnabled, setIsAIEnabled] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const toggleAIColumn = async (enabled: boolean) => {
    setIsLoadingAI(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsAIEnabled(enabled);
      toast.success(`IA ${enabled ? 'ativada' : 'desativada'} com sucesso!`);
    } catch (error) {
      toast.error('Erro ao alterar configuração de IA');
    } finally {
      setIsLoadingAI(false);
    }
  };

  return {
    isAIEnabled,
    setIsAIEnabled,
    isLoadingAI,
    toggleAIColumn
  };
};
