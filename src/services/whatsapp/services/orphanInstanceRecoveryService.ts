
import { VPSHealthService } from "./vpsHealthService";
import { OrphanInstanceValidator } from "./orphanInstanceValidator";
import { OrphanInstanceRecoverer } from "./orphanInstanceRecoverer";
import { toast } from "sonner";

export type { OrphanInstance } from "./orphanInstanceValidator";

export class OrphanInstanceRecoveryService {
  /**
   * Encontra e recupera instâncias órfãs (ativas na VPS mas não no banco)
   */
  static async findAndRecoverOrphanInstances(companyId: string): Promise<{
    found: any[];
    recovered: number;
    errors: string[];
  }> {
    try {
      console.log('[OrphanRecovery] Iniciando busca por instâncias órfãs para empresa:', companyId);

      // 1. Verificar se o companyId é válido
      if (!companyId) {
        throw new Error('Company ID é obrigatório');
      }

      // 2. Verificar saúde do VPS antes de prosseguir
      console.log('[OrphanRecovery] Verificando saúde do VPS...');
      const healthStatus = await VPSHealthService.checkVPSHealth();
      
      if (!healthStatus.isOnline) {
        const errorMsg = `VPS offline ou inacessível: ${healthStatus.error}`;
        console.error('[OrphanRecovery]', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('[OrphanRecovery] ✅ VPS está online, prosseguindo...');

      // 3. Buscar instâncias do VPS
      console.log('[OrphanRecovery] Buscando instâncias do VPS...');
      const vpsInstances = await VPSHealthService.getVPSInstances();
      
      console.log('[OrphanRecovery] Instâncias VPS encontradas:', vpsInstances.length);

      // Se não há instâncias VPS, não há órfãs
      if (vpsInstances.length === 0) {
        console.log('[OrphanRecovery] Nenhuma instância VPS encontrada');
        return { found: [], recovered: 0, errors: [] };
      }

      // 4. Buscar instâncias do banco para a empresa
      console.log('[OrphanRecovery] Buscando instâncias do banco...');
      const dbInstances = await OrphanInstanceValidator.getDbInstances(companyId);
      
      console.log('[OrphanRecovery] Instâncias do banco encontradas:', dbInstances.length);

      // 5. Identificar órfãs
      const orphanInstances = OrphanInstanceValidator.identifyOrphans(vpsInstances, dbInstances);

      console.log('[OrphanRecovery] Instâncias órfãs encontradas:', orphanInstances.length);

      if (orphanInstances.length === 0) {
        console.log('[OrphanRecovery] Nenhuma instância órfã encontrada');
        return { found: [], recovered: 0, errors: [] };
      }

      // 6. Recuperar instâncias órfãs
      const recoveryResult = await OrphanInstanceRecoverer.recoverMultipleOrphans(orphanInstances, companyId);

      console.log('[OrphanRecovery] Recuperação concluída:', {
        found: orphanInstances.length,
        recovered: recoveryResult.recovered,
        errors: recoveryResult.errors.length
      });

      return {
        found: orphanInstances,
        recovered: recoveryResult.recovered,
        errors: recoveryResult.errors
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
