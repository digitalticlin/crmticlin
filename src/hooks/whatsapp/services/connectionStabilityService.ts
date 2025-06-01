
import { OrphanInstanceRecoveryService } from "@/services/whatsapp/services/orphanInstanceRecoveryService";
import { StabilityService } from "@/services/whatsapp/services/stabilityService";
import { VPSHealthService } from "@/services/whatsapp/services/vpsHealthService";

export class ConnectionStabilityService {
  private static recoveryCleanup: (() => void) | null = null;
  private static stabilityCleanup: (() => void) | null = null;

  /**
   * Inicia sistema completo de estabilidade de conexão
   */
  static startStabilitySystem(companyId: string) {
    console.log('[ConnectionStability] Iniciando sistema completo de estabilidade para empresa:', companyId);

    // 1. Iniciar monitoramento de saúde do VPS
    VPSHealthService.startHealthMonitoring(5); // A cada 5 minutos

    // 2. Aplicar configurações de estabilidade
    StabilityService.applyStabilitySettings();

    // 3. Executar recuperação imediata de órfãs
    this.performImmediateRecovery(companyId);

    // 4. Iniciar auto-recuperação
    this.recoveryCleanup = OrphanInstanceRecoveryService.startAutoRecovery(companyId, 10); // A cada 10 minutos

    // 5. Iniciar monitoramento conservador
    this.stabilityCleanup = StabilityService.startConservativeMonitoring();

    console.log('[ConnectionStability] Sistema de estabilidade iniciado com sucesso');
  }

  /**
   * Executa recuperação imediata
   */
  private static async performImmediateRecovery(companyId: string) {
    try {
      console.log('[ConnectionStability] Executando recuperação imediata...');
      
      const result = await OrphanInstanceRecoveryService.findAndRecoverOrphanInstances(companyId);
      
      console.log('[ConnectionStability] Resultado da recuperação imediata:', {
        encontradas: result.found.length,
        recuperadas: result.recovered,
        erros: result.errors.length
      });

      if (result.recovered > 0) {
        console.log('[ConnectionStability] ✅ INSTÂNCIAS RECUPERADAS:', result.recovered);
      }

      if (result.errors.length > 0) {
        console.error('[ConnectionStability] Erros na recuperação:', result.errors);
      }

    } catch (error) {
      console.error('[ConnectionStability] Erro na recuperação imediata:', error);
    }
  }

  /**
   * Para o sistema de estabilidade
   */
  static stopStabilitySystem() {
    console.log('[ConnectionStability] Parando sistema de estabilidade');

    // Parar monitoramento de saúde do VPS
    VPSHealthService.stopHealthMonitoring();

    if (this.recoveryCleanup) {
      this.recoveryCleanup();
      this.recoveryCleanup = null;
    }

    if (this.stabilityCleanup) {
      this.stabilityCleanup();
      this.stabilityCleanup = null;
    }
  }

  /**
   * Força recuperação manual
   */
  static async forceRecovery(companyId: string) {
    console.log('[ConnectionStability] Forçando recuperação manual...');
    
    // 1. Recuperar órfãs
    const orphanResult = await OrphanInstanceRecoveryService.findAndRecoverOrphanInstances(companyId);
    
    // 2. Recuperar da quarentena
    await StabilityService.forceRecoveryFromQuarantine();

    return {
      orphanRecovery: orphanResult,
      quarantineRecovery: StabilityService.getQuarantineStatus()
    };
  }

  /**
   * Obtém status do sistema
   */
  static getSystemStatus() {
    const vpsHealth = VPSHealthService.getHealthStatus();
    
    return {
      recoveryActive: this.recoveryCleanup !== null,
      stabilityActive: this.stabilityCleanup !== null,
      quarantinedInstances: StabilityService.getQuarantineStatus(),
      removalDisabled: !StabilityService.isRemovalAllowed(),
      vpsHealth: {
        isOnline: vpsHealth.isOnline,
        responseTime: vpsHealth.responseTime,
        lastChecked: vpsHealth.lastChecked,
        consecutiveFailures: vpsHealth.consecutiveFailures,
        error: vpsHealth.error
      }
    };
  }
}
