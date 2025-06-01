
import { VPSHealthMonitor } from "./vpsHealthMonitor";
import { VPS_CONFIG, withRetry } from "../config/vpsConfig";

export class VPSInstanceManager {
  /**
   * Verifica se o VPS está acessível com retry
   */
  static async isVPSAccessible(): Promise<boolean> {
    try {
      await withRetry(async () => {
        const health = await VPSHealthMonitor.checkVPSHealth();
        if (!health.isOnline) {
          throw new Error(health.error || 'VPS not accessible');
        }
        return health;
      });
      return true;
    } catch (error) {
      console.error('[VPSInstanceManager] VPS accessibility check failed:', error);
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
      
      console.log('[VPSInstanceManager] Retrieved VPS instances:', instances.length);
      return Array.isArray(instances) ? instances : [];

    } catch (error) {
      console.error('[VPSInstanceManager] Failed to get VPS instances:', error);
      throw error;
    }
  }
}
