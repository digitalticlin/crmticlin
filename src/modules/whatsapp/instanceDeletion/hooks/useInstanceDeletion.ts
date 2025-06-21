
import { useState } from 'react';
import { InstanceDeletionService, DeleteInstanceResult } from '../lib/instanceDeletion';
import { toast } from 'sonner';

export const useInstanceDeletion = (onSuccess?: () => void) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteInstance = async (instanceId: string): Promise<DeleteInstanceResult | null> => {
    setIsDeleting(true);
    
    try {
      const result = await InstanceDeletionService.deleteInstance({ instanceId });

      if (result.success) {
        toast.success('Instância deletada com sucesso!');
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(`Erro ao deletar instância: ${result.error}`);
      }

      return result;

    } catch (error: any) {
      console.error('[useInstanceDeletion] ❌ Erro:', error);
      toast.error(`Erro ao deletar instância: ${error.message}`);
      return null;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteInstance,
    isDeleting
  };
};
