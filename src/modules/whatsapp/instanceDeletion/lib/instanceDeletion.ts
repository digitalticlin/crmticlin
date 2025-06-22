
import { supabase } from "@/integrations/supabase/client";
import { DeleteInstanceParams, DeleteInstanceResult } from '../types/instanceDeletionTypes';

export class InstanceDeletionService {
  static async deleteInstance(params: DeleteInstanceParams): Promise<DeleteInstanceResult> {
    try {
      console.log('[InstanceDeletion] 🗑️ Deletando instância via whatsapp_instance_delete:', params.instanceId);

      const { data, error } = await supabase.functions.invoke('whatsapp_instance_delete', {
        body: {
          instanceId: params.instanceId
        }
      });

      if (error) {
        console.error('[InstanceDeletion] ❌ Erro do Supabase:', error);
        throw new Error(error.message);
      }

      if (!data?.success) {
        console.error('[InstanceDeletion] ❌ Falha na deleção:', data?.error);
        throw new Error(data?.error || 'Falha ao deletar instância');
      }

      console.log('[InstanceDeletion] ✅ Instância deletada com sucesso via whatsapp_instance_delete');
      
      return { success: true };

    } catch (error: any) {
      console.error('[InstanceDeletion] ❌ Erro ao deletar instância:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export the types for external use
export type { DeleteInstanceParams, DeleteInstanceResult } from '../types/instanceDeletionTypes';
