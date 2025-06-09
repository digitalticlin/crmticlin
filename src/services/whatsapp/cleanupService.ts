
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CleanupResult {
  success: boolean;
  orphanInstancesFound: number;
  orphanInstancesCleaned: number;
  errors: string[];
}

export class WhatsAppCleanupService {
  
  static async cleanupOrphanInstances(): Promise<CleanupResult> {
    try {
      console.log('[Cleanup] 🧹 Iniciando limpeza de instâncias órfãs');
      
      // CORREÇÃO: Não buscar instâncias órfãs por company_id, mas por created_by_user_id inválido
      const { data: orphanInstances, error: findError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .or('created_by_user_id.is.null,created_by_user_id.eq.system') // Buscar NULL ou 'system'
        .eq('connection_type', 'web');

      if (findError) {
        throw new Error(`Erro ao buscar instâncias órfãs: ${findError.message}`);
      }

      const orphanCount = orphanInstances?.length || 0;
      console.log(`[Cleanup] 📊 Encontradas ${orphanCount} instâncias órfãs`);

      if (orphanCount === 0) {
        return {
          success: true,
          orphanInstancesFound: 0,
          orphanInstancesCleaned: 0,
          errors: []
        };
      }

      const errors: string[] = [];
      let cleanedCount = 0;

      // Limpar cada instância órfã
      for (const instance of orphanInstances) {
        try {
          console.log(`[Cleanup] 🗑️ Limpando instância órfã: ${instance.id} (${instance.instance_name})`);
          
          // Tentar deletar da VPS se tiver vps_instance_id
          if (instance.vps_instance_id) {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 5000);

              await fetch(`http://31.97.24.222:3002/instance/${instance.vps_instance_id}`, {
                method: 'DELETE',
                signal: controller.signal
              });

              clearTimeout(timeoutId);
              console.log(`[Cleanup] ✅ Instância ${instance.vps_instance_id} removida da VPS`);
            } catch (vpsError) {
              console.log(`[Cleanup] ⚠️ Erro ao remover da VPS (continuando): ${vpsError}`);
            }
          }

          // Deletar do banco
          const { error: deleteError } = await supabase
            .from('whatsapp_instances')
            .delete()
            .eq('id', instance.id);

          if (deleteError) {
            throw new Error(`Erro ao deletar ${instance.id}: ${deleteError.message}`);
          }

          cleanedCount++;
          console.log(`[Cleanup] ✅ Instância órfã ${instance.id} removida com sucesso`);

        } catch (instanceError: any) {
          const errorMsg = `Erro ao limpar instância ${instance.id}: ${instanceError.message}`;
          console.error(`[Cleanup] ❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      console.log(`[Cleanup] 📊 Limpeza concluída: ${cleanedCount}/${orphanCount} instâncias removidas`);

      return {
        success: true,
        orphanInstancesFound: orphanCount,
        orphanInstancesCleaned: cleanedCount,
        errors
      };

    } catch (error: any) {
      console.error('[Cleanup] ❌ Erro na limpeza:', error);
      return {
        success: false,
        orphanInstancesFound: 0,
        orphanInstancesCleaned: 0,
        errors: [error.message]
      };
    }
  }

  static async getOrphanInstancesCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('whatsapp_instances')
        .select('*', { count: 'exact', head: true })
        .or('created_by_user_id.is.null,created_by_user_id.eq.system')
        .eq('connection_type', 'web');

      if (error) {
        console.error('[Cleanup] ❌ Erro ao contar órfãs:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('[Cleanup] ❌ Erro ao contar órfãs:', error);
      return 0;
    }
  }

  static async runCleanupWithToast(): Promise<void> {
    toast.loading('Limpando instâncias órfãs...', { id: 'cleanup' });
    
    try {
      const result = await this.cleanupOrphanInstances();
      
      if (result.success) {
        if (result.orphanInstancesCleaned > 0) {
          toast.success(
            `Limpeza concluída: ${result.orphanInstancesCleaned} instâncias órfãs removidas`,
            { id: 'cleanup' }
          );
        } else {
          toast.info('Nenhuma instância órfã encontrada', { id: 'cleanup' });
        }
        
        if (result.errors.length > 0) {
          console.warn('[Cleanup] ⚠️ Erros durante limpeza:', result.errors);
        }
      } else {
        toast.error('Erro na limpeza de instâncias órfãs', { id: 'cleanup' });
      }
    } catch (error: any) {
      toast.error(`Erro na limpeza: ${error.message}`, { id: 'cleanup' });
    }
  }
}
