
import { VPSHealthMonitor } from "./vpsHealthMonitor";
import { VPSInstanceManager } from "./vpsInstanceManager";
import { OrphanInstanceValidator } from "./orphanInstanceValidator";
import { OrphanInstanceRecoverer } from "./orphanInstanceRecoverer";
import { StabilityQuarantineManager } from "./stabilityQuarantineManager";
import { VPS_CONFIG } from "../config/vpsConfig";
import { toast } from "sonner";

export type { OrphanInstance } from "./orphanInstanceValidator";

export class OrphanInstanceRecoveryService {
  /**
   * Encontra e recupera instâncias órfãs (VERSÃO OTIMIZADA)
   */
  static async findAndRecoverOrphanInstances(companyId: string): Promise<{
    found: any[];
    recovered: number;
    errors: string[];
  }> {
    try {
      console.log('[OrphanRecovery] 🚀 Iniciando busca OTIMIZADA por órfãs para empresa:', companyId);

      // 1. Validação inicial
      if (!companyId) {
        throw new Error('Company ID é obrigatório');
      }

      // 2. Limpeza automática de quarentenas expiradas
      const cleanedQuarantines = StabilityQuarantineManager.cleanupExpiredQuarantines(VPS_CONFIG.recovery.quarantineDuration);
      if (cleanedQuarantines > 0) {
        console.log('[OrphanRecovery] 🧹', cleanedQuarantines, 'quarentenas expiradas removidas');
      }

      // 3. Verificação robusta de saúde do VPS
      console.log('[OrphanRecovery] 🏥 Verificando saúde do VPS...');
      const pingResult = await VPSHealthMonitor.pingVPS();
      
      if (!pingResult.success) {
        const errorMsg = `VPS não responsivo (ping falhou): ${pingResult.error}`;
        console.error('[OrphanRecovery] ❌', errorMsg);
        throw new Error(errorMsg);
      }

      // Verificação completa se ping OK
      const healthStatus = await VPSHealthMonitor.checkVPSHealth();
      
      if (!healthStatus.isOnline) {
        const errorMsg = `VPS offline após ping OK: ${healthStatus.error}`;
        console.error('[OrphanRecovery] ❌', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('[OrphanRecovery] ✅ VPS online e saudável:', healthStatus.responseTime + 'ms');

      // 4. Buscar instâncias do VPS com retry robusto
      console.log('[OrphanRecovery] 📡 Buscando instâncias do VPS...');
      const vpsInstances = await VPSInstanceManager.getVPSInstances();
      
      console.log('[OrphanRecovery] 📊 Instâncias VPS encontradas:', vpsInstances.length);

      if (vpsInstances.length === 0) {
        console.log('[OrphanRecovery] ℹ️ Nenhuma instância VPS ativa');
        return { found: [], recovered: 0, errors: [] };
      }

      // 5. Buscar instâncias do banco
      console.log('[OrphanRecovery] 🗄️ Buscando instâncias do banco...');
      const dbInstances = await OrphanInstanceValidator.getDbInstances(companyId);
      
      console.log('[OrphanRecovery] 📊 Instâncias do banco encontradas:', dbInstances.length);

      // 6. Identificar órfãs usando algoritmo otimizado
      const orphanInstances = OrphanInstanceValidator.identifyOrphans(vpsInstances, dbInstances);

      console.log('[OrphanRecovery] 🔍 Instâncias órfãs identificadas:', orphanInstances.length);

      if (orphanInstances.length === 0) {
        console.log('[OrphanRecovery] ✅ Sistema sincronizado - nenhuma órfã encontrada');
        return { found: [], recovered: 0, errors: [] };
      }

      // 7. Backup de dados antes da recuperação
      for (const orphan of orphanInstances) {
        await OrphanInstanceRecoverer.backupOrphanData(orphan);
      }

      // 8. Recuperar instâncias órfãs com tratamento robusto
      console.log('[OrphanRecovery] 🔧 Iniciando recuperação de', orphanInstances.length, 'órfãs...');
      const recoveryResult = await OrphanInstanceRecoverer.recoverMultipleOrphans(orphanInstances, companyId);

      // 9. Validação pós-recuperação
      for (const orphan of orphanInstances) {
        if (recoveryResult.recovered > 0) {
          setTimeout(async () => {
            const isValid = await OrphanInstanceRecoverer.validateRecoveredInstance(orphan.vpsInstanceId);
            if (!isValid) {
              console.warn('[OrphanRecovery] ⚠️ Validação pós-recuperação falhou para:', orphan.vpsInstanceId);
            }
          }, 5000); // Validar após 5 segundos
        }
      }

      console.log('[OrphanRecovery] 🎯 Recuperação concluída:', {
        encontradas: orphanInstances.length,
        recuperadas: recoveryResult.recovered,
        erros: recoveryResult.errors.length,
        taxa_sucesso: `${Math.round((recoveryResult.recovered / orphanInstances.length) * 100)}%`
      });

      return {
        found: orphanInstances,
        recovered: recoveryResult.recovered,
        errors: recoveryResult.errors
      };

    } catch (error) {
      console.error('[OrphanRecovery] 💥 Falha geral na recuperação:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast.error(`Erro na busca por órfãs: ${errorMessage}`, { duration: 6000 });
      
      return {
        found: [],
        recovered: 0,
        errors: [errorMessage]
      };
    }
  }

  /**
   * Auto-recuperação com intervalo otimizado
   */
  static startAutoRecovery(companyId: string, intervalMinutes: number = 60) {
    console.log('[OrphanRecovery] 🤖 Iniciando auto-recuperação OTIMIZADA a cada', intervalMinutes, 'minutos');

    const autoRecovery = async () => {
      try {
        console.log('[OrphanRecovery] 🔄 Executando auto-recuperação programada...');
        
        const result = await this.findAndRecoverOrphanInstances(companyId);
        
        if (result.recovered > 0) {
          console.log('[OrphanRecovery] 🎉 Auto-recuperação bem-sucedida:', result.recovered, 'instâncias');
          toast.success(`🤖 Auto-recuperação: ${result.recovered} instância(s) restaurada(s)`, { duration: 4000 });
        } else if (result.errors.length > 0) {
          console.warn('[OrphanRecovery] ⚠️ Auto-recuperação com erros:', result.errors.length);
        } else {
          console.log('[OrphanRecovery] ✅ Auto-recuperação: sistema já sincronizado');
        }
        
      } catch (error) {
        console.error('[OrphanRecovery] ❌ Erro na auto-recuperação:', error);
      }
    };

    // Primeira execução após 2 minutos (dar tempo para sistema estabilizar)
    setTimeout(autoRecovery, 120000);
    
    // Execuções periódicas
    const interval = setInterval(autoRecovery, intervalMinutes * 60 * 1000);

    return () => {
      console.log('[OrphanRecovery] 🛑 Parando auto-recuperação');
      clearInterval(interval);
    };
  }

  /**
   * Estatísticas do sistema de recuperação
   */
  static getRecoveryStats(): {
    quarantineStatus: any;
    systemHealth: any;
  } {
    return {
      quarantineStatus: StabilityQuarantineManager.getQuarantineStatus(),
      systemHealth: VPSHealthMonitor.getHealthStatus()
    };
  }
}
