import { supabase } from "@/integrations/supabase/client";
import { DeleteInstanceParams, DeleteInstanceResult } from '../types/instanceDeletionTypes';

export class InstanceDeletionService {
  static async deleteInstance(params: DeleteInstanceParams): Promise<DeleteInstanceResult> {
    try {
      console.log('[InstanceDeletion] 🗑️ Deletando instância via Edge Function (com cascade):', params.instanceId);

      const { data, error } = await supabase.functions.invoke('whatsapp_instance_delete', {
        body: {
          instanceId: params.instanceId
        }
      });

      // CORREÇÃO: Melhorar tratamento de erro do Supabase
      if (error) {
        console.error('[InstanceDeletion] ❌ Erro do Supabase:', error);
        throw new Error(`Erro na Edge Function: ${error.message || JSON.stringify(error)}`);
      }

      // CORREÇÃO: Verificar se data existe e tem estrutura esperada
      if (!data) {
        console.error('[InstanceDeletion] ❌ Resposta vazia da Edge Function');
        throw new Error('Resposta vazia da Edge Function');
      }

      // CORREÇÃO CRÍTICA: Verificar corretamente se foi sucesso
      // A Edge Function retorna { success: true } quando funciona
      if (data.success !== true) {
        const errorMessage = data.error || data.message || 'Falha desconhecida na deleção';
        console.error('[InstanceDeletion] ❌ Falha na deleção:', {
          error: errorMessage,
          data: JSON.stringify(data),
          executionId: data.executionId
        });
        throw new Error(errorMessage);
      }

      // SUCESSO: A Edge Function confirmou que deletou
      console.log('[InstanceDeletion] ✅ Instância deletada com sucesso via Edge Function:', {
        instanceId: params.instanceId,
        details: data.details,
        executionId: data.executionId,
        message: data.message
      });
      
      return { 
        success: true,
        details: data.details 
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
