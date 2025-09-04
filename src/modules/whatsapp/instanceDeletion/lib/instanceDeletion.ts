import { supabase } from "@/integrations/supabase/client";
import { DeleteInstanceParams, DeleteInstanceResult } from '../types/instanceDeletionTypes';

export class InstanceDeletionService {
  static async deleteInstance(params: DeleteInstanceParams): Promise<DeleteInstanceResult> {
    try {
      console.log('[InstanceDeletion] 🗑️ Deletando instância diretamente do banco (trigger cuida da VPS):', params.instanceId);

      const { error } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', params.instanceId);

      if (error) {
        console.error('[InstanceDeletion] ❌ Erro ao deletar do banco:', error);
        throw new Error(`Erro na deleção: ${error.message || JSON.stringify(error)}`);
      }

      // SUCESSO: Deletado do banco, trigger cuida da VPS
      console.log('[InstanceDeletion] ✅ Instância deletada do banco, trigger sincronizando com VPS:', {
        instanceId: params.instanceId
      });
      
      return { 
        success: true,
        details: { message: 'Deletado do banco, trigger sincronizando com VPS' }
      };

    } catch (error: any) {
      const errorMessage = error.message || 'Erro desconhecido ao deletar instância';
      console.error('[InstanceDeletion] ❌ Erro ao deletar instância:', {
        instanceId: params.instanceId,
        error: errorMessage,
        stack: error.stack,
        originalError: error
      });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}

// Export the types for external use
export type { DeleteInstanceParams, DeleteInstanceResult } from '../types/instanceDeletionTypes';
