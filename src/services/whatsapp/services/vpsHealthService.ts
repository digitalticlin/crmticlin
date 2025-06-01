
import { VPS_CONFIG, withRetry } from "../config/vpsConfig";
import { toast } from "sonner";

interface VPSHealthStatus {
  isOnline: boolean;
  responseTime: number;
  lastChecked: Date;
  consecutiveFailures: number;
  instanceCount?: number;
  error?: string;
}

export class VPSHealthService {
  private static healthStatus: VPSHealthStatus = {
    isOnline: false,
    responseTime: 0,
    lastChecked: new Date(),
    consecutiveFailures: 0
  };

  private static healthCheckInterval: NodeJS.Timeout | null = null;
  private static isMonitoring = false;

  /**
   * Verifica se o VPS está online e responsivo
   */
  static async checkVPSHealth(): Promise<VPSHealthStatus> {
    const startTime = Date.now();
    
    try {
      console.log('[VPSHealth] Checking VPS health...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), VPS_CONFIG.timeouts.health);

      const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const healthData = await response.json();
      
      this.healthStatus = {
        isOnline: true,
        responseTime,
        lastChecked: new Date(),
        consecutiveFailures: 0,
        instanceCount: healthData.instances?.length || 0
      };

      console.log('[VPSHealth] ✅ VPS is healthy:', {
        responseTime: `${responseTime}ms`,
        instances: this.healthStatus.instanceCount
      });

      return this.healthStatus;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = this.getErrorMessage(error);
      
      this.healthStatus = {
        isOnline: false,
        responseTime,
        lastChecked: new Date(),
        consecutiveFailures: this.healthStatus.consecutiveFailures + 1,
        error: errorMessage
      };

      console.error('[VPSHealth] ❌ VPS health check failed:', {
        error: errorMessage,
        responseTime: `${responseTime}ms`,
        consecutiveFailures: this.healthStatus.consecutiveFailures
      });

      // Alertar após várias falhas consecutivas
      if (this.healthStatus.consecutiveFailures >= 3) {
        toast.error(`VPS com problemas: ${errorMessage}`, {
          duration: 10000,
          description: `${this.healthStatus.consecutiveFailures} falhas consecutivas`
        });
      }

      return this.healthStatus;
    }
  }

  /**
   * Inicia monitoramento contínuo da saúde do VPS
   */
  static startHealthMonitoring(intervalMinutes: number = 5): void {
    if (this.isMonitoring) {
      console.log('[VPSHealth] Health monitoring already running');
      return;
    }

    console.log('[VPSHealth] Starting VPS health monitoring every', intervalMinutes, 'minutes');
    
    // Primeira verificação imediata
    this.checkVPSHealth();
    
    // Verificações periódicas
    this.healthCheckInterval = setInterval(() => {
      this.checkVPSHealth();
    }, intervalMinutes * 60 * 1000);

    this.isMonitoring = true;
  }

  /**
   * Para o monitoramento de saúde
   */
  static stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.isMonitoring = false;
    console.log('[VPSHealth] Health monitoring stopped');
  }

  /**
   * Obtém o status atual da saúde do VPS
   */
  static getHealthStatus(): VPSHealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Verifica se o VPS está acessível com retry
   */
  static async isVPSAccessible(): Promise<boolean> {
    try {
      await withRetry(async () => {
        const health = await this.checkVPSHealth();
        if (!health.isOnline) {
          throw new Error(health.error || 'VPS not accessible');
        }
        return health;
      });
      return true;
    } catch (error) {
      console.error('[VPSHealth] VPS accessibility check failed:', error);
      return false;
    }
  }

  /**
   * Obtém lista de instâncias ativas do VPS com verificação de saúde
   */
  static async getVPSInstances(): Promise<any[]> {
    try {
      // Primeiro verifica se o VPS está acessível
      const isAccessible = await this.isVPSAccessible();
      if (!isAccessible) {
        throw new Error('VPS não está acessível');
      }

      const response = await withRetry(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), VPS_CONFIG.timeouts.basic);

        const res = await fetch(`${VPS_CONFIG.baseUrl}/instances`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        return res;
      });

      const data = await response.json();
      const instances = data.instances || data.data || data || [];
      
      console.log('[VPSHealth] Retrieved VPS instances:', instances.length);
      return Array.isArray(instances) ? instances : [];

    } catch (error) {
      console.error('[VPSHealth] Failed to get VPS instances:', error);
      throw error;
    }
  }

  /**
   * Normaliza mensagem de erro
   */
  private static getErrorMessage(error: any): string {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return 'Timeout: VPS não respondeu em tempo hábil';
      } else if (error.message.includes('Failed to fetch')) {
        return 'Falha na conexão: VPS pode estar offline';
      } else if (error.message.includes('CORS')) {
        return 'Erro CORS: problema na configuração do VPS';
      } else if (error.message.includes('NetworkError')) {
        return 'Erro de rede: verifique a conectividade';
      } else {
        return error.message;
      }
    }
    return 'Erro desconhecido na comunicação com VPS';
  }
}
