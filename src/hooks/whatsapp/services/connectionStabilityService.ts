
import { OrphanInstanceRecoveryService } from "@/services/whatsapp/services/orphanInstanceRecoveryService";
import { StabilityService } from "@/services/whatsapp/services/stabilityService";
import { VPSHealthMonitor } from "@/services/whatsapp/services/vpsHealthMonitor";
import { StabilityQuarantineManager } from "@/services/whatsapp/services/stabilityQuarantineManager";
import { getSystemStatus } from "@/services/whatsapp/config/vpsConfig";

export class ConnectionStabilityService {
  private static recoveryCleanup: (() => void) | null = null;
  private static stabilityCleanup: (() => void) | null = null;

  /**
   * Inicia sistema OTIMIZADO de estabilidade
   */
  static startStabilitySystem(companyId: string) {
    console.log('[ConnectionStability] 🚀 Iniciando sistema OTIMIZADO de estabilidade para empresa:', companyId);

    // 1. Iniciar monitoramento conservador de saúde do VPS (30 minutos)
    VPSHealthMonitor.startHealthMonitoring(30);

    // 2. Aplicar configurações de estabilidade conservadoras
    StabilityService.applyStabilitySettings();

    // 3. Executar recuperação inicial suave (com delay)
    this.performInitialRecovery(companyId);

    // 4. Iniciar auto-recuperação robusta (1 hora)
    this.recoveryCleanup = OrphanInstanceRecoveryService.startAutoRecovery(companyId, 60);

    // 5. Iniciar monitoramento ultra-conservador
    this.stabilityCleanup = StabilityService.startConservativeMonitoring();

    console.log('[ConnectionStability] ✅ Sistema de estabilidade OTIMIZADO iniciado com sucesso');
  }

  /**
   * Recuperação inicial suave (não bloqueia UI)
   */
  private static async performInitialRecovery(companyId: string) {
    // Delay de 30 segundos para não sobrecarregar na inicialização
    setTimeout(async () => {
      try {
        console.log('[ConnectionStability] 🔄 Executando recuperação inicial suave...');
        
        const result = await OrphanInstanceRecoveryService.findAndRecoverOrphanInstances(companyId);
        
        console.log('[ConnectionStability] 📊 Resultado da recuperação inicial:', {
          encontradas: result.found.length,
          recuperadas: result.recovered,
          erros: result.errors.length
        });

        if (result.recovered > 0) {
          console.log('[ConnectionStability] 🎉 INSTÂNCIAS RECUPERADAS NA INICIALIZAÇÃO:', result.recovered);
        }

        if (result.errors.length > 0) {
          console.error('[ConnectionStability] ⚠️ Erros na recuperação inicial:', result.errors);
        }

      } catch (error) {
        console.error('[ConnectionStability] ❌ Erro na recuperação inicial:', error);
      }
    }, 30000); // 30 segundos de delay
  }

  /**
   * Para o sistema de estabilidade
   */
  static stopStabilitySystem() {
    console.log('[ConnectionStability] 🛑 Parando sistema de estabilidade');

    // Parar monitoramento de saúde do VPS
    VPSHealthMonitor.stopHealthMonitoring();

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
   * Força recuperação COMPLETA do sistema
   */
  static async forceRecovery(companyId: string) {
    console.log('[ConnectionStability] 🔧 Forçando recuperação COMPLETA do sistema...');
    
    try {
      // 1. Reset do circuit breaker e sistema
      console.log('[ConnectionStability] 🔄 Resetando circuit breaker...');
      VPSHealthMonitor.resetFailureCount();

      // 2. Recuperar órfãs
      console.log('[ConnectionStability] 🔍 Recuperando instâncias órfãs...');
      const orphanResult = await OrphanInstanceRecoveryService.findAndRecoverOrphanInstances(companyId);
      
      // 3. Recuperar da quarentena
      console.log('[ConnectionStability] 🔓 Liberando quarentena...');
      const quarantineResult = await StabilityQuarantineManager.forceRecoveryFromQuarantine();

      // 4. Força recuperação da quarentena do stability service
      await StabilityService.forceRecoveryFromQuarantine();

      console.log('[ConnectionStability] ✅ Recuperação COMPLETA concluída:', {
        orphanRecovery: orphanResult,
        quarantineRecovery: quarantineResult
      });

      return {
        orphanRecovery: orphanResult,
        quarantineRecovery: quarantineResult
      };
      
    } catch (error) {
      console.error('[ConnectionStability] ❌ Erro na recuperação completa:', error);
      throw error;
    }
  }

  /**
   * Obtém status COMPLETO do sistema
   */
  static getSystemStatus() {
    const vpsHealth = VPSHealthMonitor.getHealthStatus();
    const systemConfig = getSystemStatus();
    const quarantineStatus = StabilityQuarantineManager.getQuarantineStatus();
    
    return {
      recoveryActive: this.recoveryCleanup !== null,
      stabilityActive: this.stabilityCleanup !== null,
      quarantinedInstances: quarantineStatus,
      removalDisabled: !StabilityService.isRemovalAllowed(),
      vpsHealth: {
        isOnline: vpsHealth.isOnline,
        responseTime: vpsHealth.responseTime,
        lastChecked: vpsHealth.lastChecked,
        consecutiveFailures: vpsHealth.consecutiveFailures,
        error: vpsHealth.error,
        vpsLoad: vpsHealth.vpsLoad
      },
      systemConfig,
      stats: {
        circuitBreakerActive: systemConfig.circuitBreaker?.isOpen || false,
        rateLimitStatus: `${systemConfig.rateLimit?.callsThisMinute || 0}/10`,
        cacheStatus: {
          statusCached: systemConfig.cache?.statusCached || false,
          pingCached: systemConfig.cache?.pingCached || false
        }
      }
    };
  }

  /**
   * Diagnóstico completo do sistema
   */
  static async performSystemDiagnostic(companyId: string): Promise<{
    vpsHealth: any;
    orphanCheck: any;
    quarantineStatus: any;
    systemConfig: any;
  }> {
    console.log('[ConnectionStability] 🔍 Executando diagnóstico completo do sistema...');

    try {
      // 1. Verificar saúde do VPS
      const vpsHealth = await VPSHealthMonitor.checkVPSHealth();

      // 2. Fazer busca rápida por órfãs (sem recuperar)
      const recoveryStats = OrphanInstanceRecoveryService.getRecoveryStats();

      // 3. Status da quarentena
      const quarantineStatus = StabilityQuarantineManager.getQuarantineStatus();

      // 4. Configuração do sistema
      const systemConfig = getSystemStatus();

      return {
        vpsHealth,
        orphanCheck: recoveryStats,
        quarantineStatus,
        systemConfig
      };

    } catch (error) {
      console.error('[ConnectionStability] ❌ Erro no diagnóstico:', error);
      throw error;
    }
  }
}
