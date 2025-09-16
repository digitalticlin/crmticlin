import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MassActionsService } from "./massActionsService";

/**
 * Configuração para processamento em lotes
 */
const BATCH_CONFIG = {
  MAX_BATCH_SIZE: 100, // Máximo de leads por lote
  BATCH_DELAY_MS: 100, // Delay entre lotes para evitar sobrecarga
  MAX_URL_LENGTH: 6000 // Limite seguro para URL (considerando outros parâmetros)
};

export interface BatchProgress {
  current: number;
  total: number;
  percentage: number;
  processedItems: number;
  totalItems: number;
}

export interface BatchResult {
  success: boolean;
  message: string;
  totalProcessed: number;
  totalErrors: number;
  details?: any[];
}

/**
 * Utility para dividir arrays em lotes
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Sleep function para delay entre batches
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Serviço especializado em processamento em lotes para grandes volumes
 */
export class BatchingService {
  
  /**
   * Mover leads para nova etapa/funil com processamento em lotes
   */
  static async moveLeadsInBatches(
    leadIds: string[], 
    newStageId: string, 
    newFunnelId: string,
    onProgress?: (progress: BatchProgress) => void
  ): Promise<BatchResult> {
    console.log('[BatchingService] 🚀 Iniciando movimentação em lotes:', {
      totalLeads: leadIds.length,
      newStageId,
      newFunnelId,
      batchSize: BATCH_CONFIG.MAX_BATCH_SIZE
    });
    
    if (!leadIds.length || !newStageId || !newFunnelId) {
      return { 
        success: false, 
        message: 'Parâmetros inválidos para movimentação',
        totalProcessed: 0,
        totalErrors: 0
      };
    }

    // Se poucos leads, usar método direto
    if (leadIds.length <= BATCH_CONFIG.MAX_BATCH_SIZE) {
      console.log('[BatchingService] 📦 Processamento direto (poucos leads)...');
      
      try {
        const { error } = await supabase
          .from('leads')
          .update({ 
            kanban_stage_id: newStageId,
            funnel_id: newFunnelId 
          })
          .in('id', leadIds);

        if (error) throw error;

        return {
          success: true,
          message: `${leadIds.length} lead${leadIds.length > 1 ? 's' : ''} movido${leadIds.length > 1 ? 's' : ''} com sucesso!`,
          totalProcessed: leadIds.length,
          totalErrors: 0
        };
      } catch (error) {
        console.error('[BatchingService] ❌ Erro no processamento direto:', error);
        return {
          success: false,
          message: 'Erro ao mover leads. Tente novamente.',
          totalProcessed: 0,
          totalErrors: 1
        };
      }
    }

    // PROCESSAMENTO EM LOTES PARA GRANDES VOLUMES
    console.log('[BatchingService] 📊 Iniciando processamento em lotes...');
    const batches = chunkArray(leadIds, BATCH_CONFIG.MAX_BATCH_SIZE);
    console.log(`[BatchingService] 📦 Dividido em ${batches.length} lotes de até ${BATCH_CONFIG.MAX_BATCH_SIZE} leads`);
    
    let totalProcessed = 0;
    const errors: any[] = [];
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`[BatchingService] 🔄 Processando lote ${i + 1}/${batches.length} (${batch.length} leads)...`);
      
      try {
        const { error } = await supabase
          .from('leads')
          .update({ 
            kanban_stage_id: newStageId,
            funnel_id: newFunnelId 
          })
          .in('id', batch);

        if (error) {
          console.error(`[BatchingService] ❌ Erro no lote ${i + 1}:`, error);
          errors.push({ batch: i + 1, error: error.message, leadCount: batch.length });
        } else {
          totalProcessed += batch.length;
          console.log(`[BatchingService] ✅ Lote ${i + 1} processado: ${batch.length} leads`);
        }
      } catch (batchError) {
        console.error(`[BatchingService] ❌ Exceção no lote ${i + 1}:`, batchError);
        errors.push({ 
          batch: i + 1, 
          error: batchError?.message || 'Erro desconhecido',
          leadCount: batch.length 
        });
      }
      
      // Atualizar progresso
      if (onProgress) {
        const current = i + 1;
        const total = batches.length;
        const percentage = Math.round((current / total) * 100);
        onProgress({ 
          current, 
          total, 
          percentage,
          processedItems: totalProcessed,
          totalItems: leadIds.length
        });
      }
      
      // Delay entre lotes para não sobrecarregar
      if (i < batches.length - 1) {
        await sleep(BATCH_CONFIG.BATCH_DELAY_MS);
      }
    }
    
    // Resultado final
    const totalErrors = errors.length;
    const hasErrors = totalErrors > 0;
    const hasSuccesses = totalProcessed > 0;
    
    if (!hasErrors) {
      // Sucesso total
      const successMessage = `${totalProcessed} lead${totalProcessed > 1 ? 's' : ''} movido${totalProcessed > 1 ? 's' : ''} com sucesso!`;
      console.log('[BatchingService] 🎉 Processamento concluído com sucesso:', successMessage);
      return {
        success: true,
        message: successMessage,
        totalProcessed,
        totalErrors: 0
      };
    } else if (hasSuccesses) {
      // Sucesso parcial
      const partialMessage = `${totalProcessed} de ${leadIds.length} leads movidos. ${totalErrors} lote(s) falharam.`;
      console.warn('[BatchingService] ⚠️ Sucesso parcial:', partialMessage);
      return {
        success: true,
        message: partialMessage,
        totalProcessed,
        totalErrors,
        details: errors
      };
    } else {
      // Falha total
      const errorMessage = `Erro ao mover leads. Todos os ${batches.length} lotes falharam.`;
      console.error('[BatchingService] ❌ Falha total:', errorMessage);
      return {
        success: false,
        message: errorMessage,
        totalProcessed: 0,
        totalErrors,
        details: errors
      };
    }
  }

  /**
   * Excluir leads em lotes
   */
  static async deleteLeadsInBatches(
    leadIds: string[],
    onProgress?: (progress: BatchProgress) => void
  ): Promise<BatchResult> {
    console.log('[BatchingService] 🗑️ Iniciando exclusão em lotes:', {
      totalLeads: leadIds.length,
      batchSize: BATCH_CONFIG.MAX_BATCH_SIZE
    });
    
    if (!leadIds.length) {
      return { 
        success: false, 
        message: 'Nenhum lead selecionado para exclusão',
        totalProcessed: 0,
        totalErrors: 0
      };
    }

    // Se poucos leads, usar método direto com exclusão completa
    if (leadIds.length <= BATCH_CONFIG.MAX_BATCH_SIZE) {
      return await MassActionsService.deleteLeads(leadIds);
    }

    // PROCESSAMENTO EM LOTES
    const batches = chunkArray(leadIds, BATCH_CONFIG.MAX_BATCH_SIZE);
    let totalProcessed = 0;
    const errors: any[] = [];
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`[BatchingService] 🗑️ Excluindo lote ${i + 1}/${batches.length} (${batch.length} leads)...`);
      
      try {
        // Usar MassActionsService para exclusão completa (leads + mensagens)
        const result = await MassActionsService.deleteLeads(batch);

        if (!result.success) {
          console.error(`[BatchingService] ❌ Erro na exclusão do lote ${i + 1}:`, result.message);
          errors.push({ batch: i + 1, error: result.message, leadCount: batch.length });
        } else {
          totalProcessed += batch.length;
          console.log(`[BatchingService] ✅ Lote ${i + 1} excluído: ${batch.length} leads`);
        }
      } catch (batchError) {
        console.error(`[BatchingService] ❌ Exceção na exclusão do lote ${i + 1}:`, batchError);
        errors.push({ 
          batch: i + 1, 
          error: batchError?.message || 'Erro desconhecido',
          leadCount: batch.length 
        });
      }
      
      // Atualizar progresso
      if (onProgress) {
        const current = i + 1;
        const total = batches.length;
        const percentage = Math.round((current / total) * 100);
        onProgress({ 
          current, 
          total, 
          percentage,
          processedItems: totalProcessed,
          totalItems: leadIds.length
        });
      }
      
      // Delay entre lotes
      if (i < batches.length - 1) {
        await sleep(BATCH_CONFIG.BATCH_DELAY_MS);
      }
    }
    
    // Resultado final para exclusão
    const totalErrors = errors.length;
    
    if (totalErrors === 0) {
      const successMessage = `${totalProcessed} lead${totalProcessed > 1 ? 's' : ''} excluído${totalProcessed > 1 ? 's' : ''} com sucesso!`;
      return {
        success: true,
        message: successMessage,
        totalProcessed,
        totalErrors: 0
      };
    } else if (totalProcessed > 0) {
      const partialMessage = `${totalProcessed} de ${leadIds.length} leads excluídos. ${totalErrors} lote(s) falharam.`;
      return {
        success: true,
        message: partialMessage,
        totalProcessed,
        totalErrors,
        details: errors
      };
    } else {
      const errorMessage = `Erro ao excluir leads. Todos os ${batches.length} lotes falharam.`;
      return {
        success: false,
        message: errorMessage,
        totalProcessed: 0,
        totalErrors,
        details: errors
      };
    }
  }
}