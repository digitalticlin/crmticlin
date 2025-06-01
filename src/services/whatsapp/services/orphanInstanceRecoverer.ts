
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OrphanInstance } from "./orphanInstanceValidator";

export class OrphanInstanceRecoverer {
  /**
   * Recupera uma instância órfã específica
   */
  static async recoverSingleOrphan(orphan: OrphanInstance, companyId: string): Promise<boolean> {
    try {
      console.log('[OrphanRecoverer] Recuperando instância órfã:', {
        vpsInstanceId: orphan.vpsInstanceId,
        phone: orphan.phone,
        name: orphan.name
      });

      const { data: recoveredInstance, error: insertError } = await supabase
        .from('whatsapp_instances')
        .insert({
          company_id: companyId,
          instance_name: orphan.sessionName,
          vps_instance_id: orphan.vpsInstanceId,
          connection_type: 'web',
          web_status: 'ready',
          connection_status: 'open',
          phone: orphan.phone || '',
          profile_name: orphan.name || '',
          date_connected: new Date().toISOString(),
          server_url: 'http://31.97.24.222:3001',
          session_data: {
            recovered: true,
            recoveredAt: new Date().toISOString(),
            originalState: orphan.state,
            recoveryMethod: 'orphan_recovery_service'
          }
        })
        .select()
        .single();

      if (insertError) {
        console.error('[OrphanRecoverer] Erro ao recuperar:', orphan.vpsInstanceId, insertError);
        return false;
      }

      console.log('[OrphanRecoverer] Instância recuperada com sucesso:', recoveredInstance);
      
      toast.success(
        `Instância ${orphan.phone || orphan.vpsInstanceId.substring(0, 8)} recuperada!`, 
        { duration: 5000 }
      );

      return true;
    } catch (error) {
      console.error('[OrphanRecoverer] Erro inesperado ao recuperar:', orphan.vpsInstanceId, error);
      return false;
    }
  }

  /**
   * Recupera múltiplas instâncias órfãs
   */
  static async recoverMultipleOrphans(orphans: OrphanInstance[], companyId: string): Promise<{
    recovered: number;
    errors: string[];
  }> {
    const recovered: number[] = [];
    const errors: string[] = [];

    for (const orphan of orphans) {
      try {
        const success = await this.recoverSingleOrphan(orphan, companyId);
        if (success) {
          recovered.push(1);
        } else {
          errors.push(`${orphan.vpsInstanceId}: Falha na recuperação`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        errors.push(`${orphan.vpsInstanceId}: ${errorMessage}`);
      }
    }

    const totalRecovered = recovered.length;
    
    // Toast de resumo
    if (totalRecovered > 0) {
      toast.success(`✅ ${totalRecovered} instância(s) recuperada(s) com sucesso!`);
    }

    if (errors.length > 0) {
      toast.error(`❌ ${errors.length} erro(s) durante a recuperação`);
    }

    return {
      recovered: totalRecovered,
      errors
    };
  }
}
