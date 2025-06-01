
import { supabase } from "@/integrations/supabase/client";
import { OrphanInstance } from "./orphanInstanceValidator";

export class OrphanInstanceRecoverer {
  /**
   * Recupera múltiplas instâncias órfãs com tratamento robusto de erros
   */
  static async recoverMultipleOrphans(orphanInstances: OrphanInstance[], companyId: string): Promise<{
    recovered: number;
    errors: string[];
  }> {
    console.log('[OrphanRecoverer] Iniciando recuperação de', orphanInstances.length, 'instâncias órfãs');

    let recovered = 0;
    const errors: string[] = [];

    for (const orphan of orphanInstances) {
      try {
        console.log('[OrphanRecoverer] Recuperando órfã:', orphan.vpsInstanceId);
        
        const result = await this.recoverSingleOrphan(orphan, companyId);
        
        if (result.success) {
          recovered++;
          console.log('[OrphanRecoverer] ✅ Órfã recuperada:', orphan.vpsInstanceId);
        } else {
          errors.push(`${orphan.vpsInstanceId}: ${result.error}`);
          console.error('[OrphanRecoverer] ❌ Falha na recuperação:', orphan.vpsInstanceId, result.error);
        }
        
        // Pequeno delay entre recuperações para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${orphan.vpsInstanceId}: ${errorMessage}`);
        console.error('[OrphanRecoverer] Erro na recuperação:', orphan.vpsInstanceId, errorMessage);
      }
    }

    console.log('[OrphanRecoverer] Recuperação concluída:', {
      total: orphanInstances.length,
      recovered,
      errors: errors.length
    });

    return { recovered, errors };
  }

  /**
   * Recupera uma instância órfã individual
   */
  private static async recoverSingleOrphan(orphan: OrphanInstance, companyId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Verificar se já existe no banco (prevenção de duplicatas)
      const { data: existing, error: checkError } = await supabase
        .from('whatsapp_instances')
        .select('id')
        .eq('vps_instance_id', orphan.vpsInstanceId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw new Error(`Erro na verificação: ${checkError.message}`);
      }

      if (existing) {
        return {
          success: false,
          error: 'Instância já existe no banco de dados'
        };
      }

      // Criar nova entrada no banco
      const { data: newInstance, error: insertError } = await supabase
        .from('whatsapp_instances')
        .insert({
          company_id: companyId,
          instance_name: orphan.sessionName,
          vps_instance_id: orphan.vpsInstanceId,
          phone: orphan.phone || '',
          profile_name: orphan.name || '',
          connection_type: 'web',
          web_status: 'ready',
          connection_status: 'open',
          date_connected: new Date().toISOString(),
          server_url: 'http://31.97.24.222:3001'
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Erro na inserção: ${insertError.message}`);
      }

      console.log('[OrphanRecoverer] Nova instância criada no banco:', newInstance.id);

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validação final pós-recuperação
   */
  static async validateRecoveredInstance(vpsInstanceId: string): Promise<boolean> {
    try {
      // Verificar se realmente foi criada no banco
      const { data: instance, error } = await supabase
        .from('whatsapp_instances')
        .select('id, web_status, connection_status')
        .eq('vps_instance_id', vpsInstanceId)
        .maybeSingle();

      if (error) {
        console.error('[OrphanRecoverer] Erro na validação:', error);
        return false;
      }

      if (!instance) {
        console.error('[OrphanRecoverer] Instância não encontrada após recuperação');
        return false;
      }

      const isConnected = ['ready', 'open'].includes(instance.web_status) ||
                         ['ready', 'open'].includes(instance.connection_status);

      if (!isConnected) {
        console.warn('[OrphanRecoverer] Instância recuperada mas não conectada:', instance.id);
        return false;
      }

      console.log('[OrphanRecoverer] ✅ Validação pós-recuperação bem-sucedida:', instance.id);
      return true;

    } catch (error) {
      console.error('[OrphanRecoverer] Erro na validação pós-recuperação:', error);
      return false;
    }
  }

  /**
   * Backup de dados da instância antes da recuperação
   */
  static async backupOrphanData(orphan: OrphanInstance): Promise<void> {
    try {
      console.log('[OrphanRecoverer] Fazendo backup dos dados da órfã:', orphan.vpsInstanceId);
      
      // Aqui você pode implementar backup em arquivo local ou tabela de auditoria
      const backupData = {
        timestamp: new Date().toISOString(),
        vpsInstanceId: orphan.vpsInstanceId,
        sessionName: orphan.sessionName,
        state: orphan.state,
        phone: orphan.phone,
        name: orphan.name,
        action: 'orphan_recovery'
      };

      // Por enquanto, só loggar os dados
      console.log('[OrphanRecoverer] Backup:', JSON.stringify(backupData, null, 2));
      
    } catch (error) {
      console.error('[OrphanRecoverer] Erro no backup:', error);
      // Não falhar a recuperação por causa do backup
    }
  }
}
