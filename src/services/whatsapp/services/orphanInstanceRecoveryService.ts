
import { supabase } from "@/integrations/supabase/client";
import { VPSAuditService } from "./vpsAuditService";
import { toast } from "sonner";

export interface OrphanInstance {
  vpsInstanceId: string;
  sessionName: string;
  state: string;
  isReady: boolean;
  phone?: string;
  name?: string;
}

export class OrphanInstanceRecoveryService {
  /**
   * Encontra e recupera instâncias órfãs (ativas na VPS mas não no banco)
   */
  static async findAndRecoverOrphanInstances(companyId: string): Promise<{
    found: OrphanInstance[];
    recovered: number;
    errors: string[];
  }> {
    try {
      console.log('[OrphanRecovery] Iniciando busca por instâncias órfãs para empresa:', companyId);

      // 1. Verificar se o companyId é válido
      if (!companyId) {
        throw new Error('Company ID é obrigatório');
      }

      // 2. Buscar todas as conexões VPS com melhor tratamento de erro
      console.log('[OrphanRecovery] Buscando conexões VPS...');
      const vpsResult = await VPSAuditService.listVPSConnections();
      
      if (!vpsResult.success) {
        console.error('[OrphanRecovery] Falha ao listar VPS:', vpsResult.error);
        throw new Error(`Falha ao conectar com VPS: ${vpsResult.error}`);
      }

      const vpsConnections = vpsResult.data || [];
      console.log('[OrphanRecovery] Conexões VPS encontradas:', vpsConnections.length);

      // Se não há conexões VPS, não há órfãs
      if (vpsConnections.length === 0) {
        console.log('[OrphanRecovery] Nenhuma conexão VPS encontrada');
        return { found: [], recovered: 0, errors: [] };
      }

      // 3. Buscar instâncias do banco para a empresa
      console.log('[OrphanRecovery] Buscando instâncias do banco...');
      const { data: dbInstances, error: dbError } = await supabase
        .from('whatsapp_instances')
        .select('vps_instance_id, phone, web_status, connection_status')
        .eq('company_id', companyId)
        .eq('connection_type', 'web');

      if (dbError) {
        console.error('[OrphanRecovery] Erro no banco:', dbError);
        throw new Error(`Erro no banco: ${dbError.message}`);
      }

      console.log('[OrphanRecovery] Instâncias do banco encontradas:', dbInstances?.length || 0);

      const dbInstanceIds = new Set(
        dbInstances?.map(i => i.vps_instance_id).filter(Boolean) || []
      );
      
      // 4. Identificar órfãs (VPS ativo mas não no banco)
      const orphanInstances: OrphanInstance[] = vpsConnections
        .filter(vps => {
          const isConnected = vps.state === 'CONNECTED';
          const isReady = vps.isReady === true;
          const notInDB = !dbInstanceIds.has(vps.instanceId);
          
          console.log('[OrphanRecovery] Analisando VPS:', {
            instanceId: vps.instanceId,
            state: vps.state,
            isReady: vps.isReady,
            notInDB,
            willInclude: isConnected && isReady && notInDB
          });
          
          return isConnected && isReady && notInDB;
        })
        .map(vps => ({
          vpsInstanceId: vps.instanceId,
          sessionName: vps.sessionName || `recovered_${Date.now()}`,
          state: vps.state,
          isReady: vps.isReady,
          phone: vps.phone,
          name: vps.name
        }));

      console.log('[OrphanRecovery] Instâncias órfãs encontradas:', orphanInstances.length);

      if (orphanInstances.length === 0) {
        console.log('[OrphanRecovery] Nenhuma instância órfã encontrada');
        return { found: [], recovered: 0, errors: [] };
      }

      // 5. Recuperar instâncias órfãs
      const recovered: number[] = [];
      const errors: string[] = [];

      for (const orphan of orphanInstances) {
        try {
          console.log('[OrphanRecovery] Recuperando instância órfã:', {
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
              server_url: 'http://31.97.24.222:3001', // URL do VPS
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
            console.error('[OrphanRecovery] Erro ao recuperar:', orphan.vpsInstanceId, insertError);
            errors.push(`${orphan.vpsInstanceId}: ${insertError.message}`);
          } else {
            console.log('[OrphanRecovery] Instância recuperada com sucesso:', recoveredInstance);
            recovered.push(1);
            
            toast.success(
              `Instância ${orphan.phone || orphan.vpsInstanceId.substring(0, 8)} recuperada!`, 
              { duration: 5000 }
            );
          }
        } catch (error) {
          console.error('[OrphanRecovery] Erro inesperado ao recuperar:', orphan.vpsInstanceId, error);
          errors.push(`${orphan.vpsInstanceId}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }

      const totalRecovered = recovered.length;
      console.log('[OrphanRecovery] Recuperação concluída:', {
        found: orphanInstances.length,
        recovered: totalRecovered,
        errors: errors.length
      });

      // Toast de resumo
      if (totalRecovered > 0) {
        toast.success(`✅ ${totalRecovered} instância(s) recuperada(s) com sucesso!`);
      }

      if (errors.length > 0) {
        toast.error(`❌ ${errors.length} erro(s) durante a recuperação`);
      }

      return {
        found: orphanInstances,
        recovered: totalRecovered,
        errors
      };

    } catch (error) {
      console.error('[OrphanRecovery] Falha geral na recuperação:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast.error(`Erro na busca: ${errorMessage}`);
      
      return {
        found: [],
        recovered: 0,
        errors: [errorMessage]
      };
    }
  }

  /**
   * Executa recuperação automática em intervalo
   */
  static startAutoRecovery(companyId: string, intervalMinutes: number = 10) {
    console.log('[OrphanRecovery] Iniciando auto-recuperação a cada', intervalMinutes, 'minutos');

    const autoRecovery = async () => {
      try {
        const result = await this.findAndRecoverOrphanInstances(companyId);
        if (result.recovered > 0) {
          console.log('[OrphanRecovery] Auto-recuperação:', result.recovered, 'instâncias recuperadas');
        }
      } catch (error) {
        console.error('[OrphanRecovery] Erro na auto-recuperação:', error);
      }
    };

    // Primeira execução após 30 segundos
    setTimeout(autoRecovery, 30000);
    
    // Depois em intervalos regulares
    const interval = setInterval(autoRecovery, intervalMinutes * 60 * 1000);

    return () => {
      console.log('[OrphanRecovery] Parando auto-recuperação');
      clearInterval(interval);
    };
  }
}
