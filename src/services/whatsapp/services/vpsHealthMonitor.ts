
import { VPS_CONFIG, withRetry, checkCircuitBreaker, getCachedPing, setCachedPing, getCachedStatus, setCachedStatus } from "../config/vpsConfig";

export interface VPSHealthStatus {
  isOnline: boolean;
  responseTime: number;
  lastChecked: string;
  consecutiveFailures: number;
  error?: string;
  vpsLoad?: {
    cpu: number;
    memory: number;
    activeConnections: number;
  };
}

export class VPSHealthMonitor {
  private static healthStatus: VPSHealthStatus = {
    isOnline: false,
    responseTime: 0,
    lastChecked: new Date().toISOString(),
    consecutiveFailures: 0
  };

  private static monitoringInterval: NodeJS.Timeout | null = null;

  /**
   * Ping LEVE para verificar se VPS está respondendo
   */
  static async pingVPS(): Promise<{ success: boolean; responseTime: number; error?: string }> {
    // Verificar cache primeiro
    const cached = getCachedPing();
    if (cached) {
      return cached;
    }

    // Verificar circuit breaker
    if (!checkCircuitBreaker()) {
      const result = { success: false, responseTime: 0, error: 'Circuit breaker ativo' };
      setCachedPing(result);
      return result;
    }

    const startTime = Date.now();
    
    try {
      const result = await withRetry(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), VPS_CONFIG.timeouts.ping);

        // Usar endpoint /ping mais leve em vez de /health
        const response = await fetch(`${VPS_CONFIG.baseUrl}/ping`, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json'
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response;
      }, 'VPS Ping', 3); // Só 3 tentativas para ping

      const responseTime = Date.now() - startTime;
      const success = { success: true, responseTime };
      
      setCachedPing(success);
      return success;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const failure = {
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      setCachedPing(failure);
      return failure;
    }
  }

  /**
   * Verificação completa de saúde do VPS (menos frequente)
   */
  static async checkVPSHealth(): Promise<VPSHealthStatus> {
    console.log('[VPSHealthMonitor] Iniciando verificação de saúde do VPS...');

    // Verificar cache primeiro
    const cached = getCachedStatus();
    if (cached) {
      return cached;
    }

    const startTime = Date.now();
    
    try {
      const pingResult = await this.pingVPS();
      
      if (!pingResult.success) {
        this.healthStatus = {
          isOnline: false,
          responseTime: pingResult.responseTime,
          lastChecked: new Date().toISOString(),
          consecutiveFailures: this.healthStatus.consecutiveFailures + 1,
          error: pingResult.error
        };
        
        setCachedStatus(this.healthStatus);
        return this.healthStatus;
      }

      // Se ping OK, fazer verificação completa
      const healthData = await withRetry(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), VPS_CONFIG.timeouts.health);

        const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json'
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      }, 'VPS Health Check');

      const responseTime = Date.now() - startTime;

      this.healthStatus = {
        isOnline: true,
        responseTime,
        lastChecked: new Date().toISOString(),
        consecutiveFailures: 0, // Reset contador em caso de sucesso
        vpsLoad: {
          cpu: healthData.cpu || 0,
          memory: healthData.memory || 0,
          activeConnections: healthData.activeConnections || 0
        }
      };

      console.log('[VPSHealthMonitor] ✅ VPS online -', responseTime + 'ms');
      
      setCachedStatus(this.healthStatus);
      return this.healthStatus;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.healthStatus = {
        isOnline: false,
        responseTime,
        lastChecked: new Date().toISOString(),
        consecutiveFailures: this.healthStatus.consecutiveFailures + 1,
        error: errorMessage
      };

      console.error('[VPSHealthMonitor] ❌ VPS offline:', errorMessage);
      
      setCachedStatus(this.healthStatus);
      return this.healthStatus;
    }
  }

  /**
   * Inicia monitoramento automático CONSERVADOR
   */
  static startHealthMonitoring(intervalMinutes: number = 30): void {
    if (this.monitoringInterval) {
      console.log('[VPSHealthMonitor] Parando monitoramento existente');
      clearInterval(this.monitoringInterval);
    }

    console.log(`[VPSHealthMonitor] Iniciando monitoramento conservador a cada ${intervalMinutes} minutos`);

    // Primeira verificação imediata (com delay para não sobrecarregar)
    setTimeout(() => {
      this.checkVPSHealth().catch(err => {
        console.error('[VPSHealthMonitor] Erro na verificação inicial:', err);
      });
    }, 10000); // 10 segundos de delay

    // Monitoramento periódico MUITO menos frequente
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkVPSHealth();
      } catch (error) {
        console.error('[VPSHealthMonitor] Erro no monitoramento periódico:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Para o monitoramento
   */
  static stopHealthMonitoring(): void {
    if (this.monitoringInterval) {
      console.log('[VPSHealthMonitor] Parando monitoramento de saúde');
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Obtém status atual
   */
  static getHealthStatus(): VPSHealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Verifica se VPS está em estado crítico
   */
  static isVPSCritical(): boolean {
    return this.healthStatus.consecutiveFailures >= VPS_CONFIG.monitoring.maxConsecutiveFailures;
  }

  /**
   * Reset manual do contador de falhas
   */
  static resetFailureCount(): void {
    console.log('[VPSHealthMonitor] Reset manual do contador de falhas');
    this.healthStatus.consecutiveFailures = 0;
  }
}
