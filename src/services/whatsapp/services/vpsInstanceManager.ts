
import { VPSHealthMonitor } from "./vpsHealthMonitor";
import { VPS_CONFIG, withRetry } from "../config/vpsConfig";

export class VPSInstanceManager {
  /**
   * Verifica se o VPS está acessível com tolerância aumentada
   */
  static async isVPSAccessible(): Promise<boolean> {
    try {
      // Primeiro faz ping leve
      const pingResult = await VPSHealthMonitor.pingVPS();
      
      if (!pingResult.success) {
        console.warn('[VPSInstanceManager] Ping falhou, mas tentando verificação completa...');
      }

      // Verificação completa com retry
      const health = await VPSHealthMonitor.checkVPSHealth();
      
      if (!health.isOnline) {
        console.error('[VPSInstanceManager] VPS não acessível:', health.error);
        return false;
      }

      console.log('[VPSInstanceManager] ✅ VPS acessível');
      return true;
      
    } catch (error) {
      console.error('[VPSInstanceManager] Erro na verificação de acessibilidade:', error);
      return false;
    }
  }

  /**
   * Obtém lista de instâncias ativas do VPS com verificação robusta
   */
  static async getVPSInstances(): Promise<any[]> {
    try {
      // Verificar se VPS está acessível ANTES de tentar buscar instâncias
      const isAccessible = await this.isVPSAccessible();
      if (!isAccessible) {
        throw new Error('VPS não está acessível - não é possível buscar instâncias');
      }

      console.log('[VPSInstanceManager] Buscando instâncias do VPS...');

      const response = await withRetry(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), VPS_CONFIG.timeouts.basic);

        const res = await fetch(`${VPS_CONFIG.baseUrl}/instances`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache' // Evitar cache desatualizado
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        return res;
      }, 'Get VPS Instances');

      const data = await response.json();
      const instances = data.instances || data.data || data || [];
      
      console.log('[VPSInstanceManager] ✅ Instâncias recuperadas:', instances.length);
      
      // Validar formato das instâncias
      const validInstances = Array.isArray(instances) ? instances.filter(instance => {
        return instance && (instance.instanceId || instance.id || instance.instance_id);
      }) : [];

      if (validInstances.length !== instances.length) {
        console.warn('[VPSInstanceManager] Algumas instâncias foram filtradas por formato inválido');
      }

      return validInstances;

    } catch (error) {
      console.error('[VPSInstanceManager] Falha ao buscar instâncias VPS:', error);
      
      // Em caso de erro, não propagar exceção imediatamente
      // Tentar novamente em alguns casos específicos
      if (error instanceof Error && error.message.includes('timeout')) {
        console.log('[VPSInstanceManager] Timeout detectado - tentando uma vez mais com timeout maior...');
        
        try {
          // Tentativa final com timeout bem maior
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 segundos

          const response = await fetch(`${VPS_CONFIG.baseUrl}/instances`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            const instances = data.instances || data.data || data || [];
            console.log('[VPSInstanceManager] ✅ Recuperação bem-sucedida na segunda tentativa');
            return Array.isArray(instances) ? instances : [];
          }
        } catch (retryError) {
          console.error('[VPSInstanceManager] Segunda tentativa também falhou');
        }
      }
      
      throw error;
    }
  }

  /**
   * Verifica status específico de uma instância VPS
   */
  static async getInstanceStatus(vpsInstanceId: string): Promise<any> {
    try {
      const response = await withRetry(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), VPS_CONFIG.timeouts.basic);

        const res = await fetch(`${VPS_CONFIG.baseUrl}/status/${vpsInstanceId}`, {
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
      }, `Get Instance Status ${vpsInstanceId}`);

      const status = await response.json();
      console.log('[VPSInstanceManager] Status da instância recuperado:', vpsInstanceId);
      
      return status;

    } catch (error) {
      console.error('[VPSInstanceManager] Erro ao buscar status da instância:', vpsInstanceId, error);
      throw error;
    }
  }
}
