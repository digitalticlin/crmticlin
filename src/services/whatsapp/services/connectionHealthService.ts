
import { supabase } from "@/integrations/supabase/client";
import { VPS_CONFIG } from "../config/vpsConfig";
import { ServiceResponse } from "../types/whatsappWebTypes";

export interface ConnectionHealth {
  instanceId: string;
  isHealthy: boolean;
  lastHeartbeat: string;
  consecutiveFailures: number;
  needsReconnection: boolean;
}

export class ConnectionHealthService {
  // INTERVALOS REDUZIDOS DRASTICAMENTE PARA EVITAR GERAÇÃO EXCESSIVA DE QR
  private static readonly HEARTBEAT_INTERVAL = 300000; // 5 minutos (era 30s)
  private static readonly MAX_CONSECUTIVE_FAILURES = 5; // Aumentado (era 3)
  private static readonly RECONNECTION_COOLDOWN = 300000; // 5 minutos (era 1 minuto)
  
  private static activeHeartbeats = new Map<string, NodeJS.Timeout>();
  private static healthStatus = new Map<string, ConnectionHealth>();
  
  /**
   * Inicia monitoramento de saúde APENAS para instâncias conectadas
   */
  static startHealthMonitoring(instanceId: string, vpsInstanceId: string): void {
    console.log('[ConnectionHealthService] Starting REDUCED health monitoring for:', instanceId);
    
    // Para monitoramento existente se houver
    this.stopHealthMonitoring(instanceId);
    
    // Inicializa status de saúde
    this.healthStatus.set(instanceId, {
      instanceId: vpsInstanceId,
      isHealthy: true,
      lastHeartbeat: new Date().toISOString(),
      consecutiveFailures: 0,
      needsReconnection: false
    });
    
    // HEARTBEAT MUITO MAIS ESPAÇADO - apenas para instâncias conectadas
    const heartbeatInterval = setInterval(async () => {
      await this.performHealthCheck(instanceId, vpsInstanceId);
    }, this.HEARTBEAT_INTERVAL); // 5 minutos em vez de 30 segundos
    
    this.activeHeartbeats.set(instanceId, heartbeatInterval);
  }
  
  /**
   * Para monitoramento de saúde
   */
  static stopHealthMonitoring(instanceId: string): void {
    console.log('[ConnectionHealthService] Stopping health monitoring for:', instanceId);
    
    const heartbeat = this.activeHeartbeats.get(instanceId);
    if (heartbeat) {
      clearInterval(heartbeat);
      this.activeHeartbeats.delete(instanceId);
    }
    
    this.healthStatus.delete(instanceId);
  }
  
  /**
   * Realiza verificação de saúde APENAS com status endpoint (sem QR)
   */
  private static async performHealthCheck(instanceId: string, vpsInstanceId: string): Promise<void> {
    try {
      console.log('[ConnectionHealthService] LIGHT health check for:', instanceId);
      
      // USA ENDPOINT ESPECÍFICO DE HEALTH QUE NÃO GERA QR CODE
      const healthCheckResult = await this.checkVPSHealthOnly(vpsInstanceId);
      const currentHealth = this.healthStatus.get(instanceId);
      
      if (!currentHealth) return;
      
      if (healthCheckResult.success) {
        // Reset falhas
        const updatedHealth: ConnectionHealth = {
          ...currentHealth,
          isHealthy: true,
          lastHeartbeat: new Date().toISOString(),
          consecutiveFailures: 0,
          needsReconnection: false
        };
        
        this.healthStatus.set(instanceId, updatedHealth);
        console.log('[ConnectionHealthService] Light health check passed for:', instanceId);
      } else {
        // Incrementa falhas mas com tolerância maior
        const consecutiveFailures = currentHealth.consecutiveFailures + 1;
        const needsReconnection = consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES;
        
        const updatedHealth: ConnectionHealth = {
          ...currentHealth,
          isHealthy: false,
          consecutiveFailures,
          needsReconnection
        };
        
        this.healthStatus.set(instanceId, updatedHealth);
        console.warn('[ConnectionHealthService] Light health check failed for:', instanceId, 'Failures:', consecutiveFailures);
        
        // APENAS se realmente precisar reconectar e depois de muitas falhas
        if (needsReconnection) {
          console.log('[ConnectionHealthService] Instance needs reconnection after', consecutiveFailures, 'failures');
          // NÃO tenta reconexão automática - apenas marca como problemática
        }
      }
      
    } catch (error) {
      console.error('[ConnectionHealthService] Health check error for:', instanceId, error);
    }
  }
  
  /**
   * Verifica saúde APENAS com endpoint de health (sem gerar QR)
   */
  private static async checkVPSHealthOnly(vpsInstanceId: string): Promise<ServiceResponse> {
    try {
      // USA ENDPOINT /health EM VEZ DE /status PARA EVITAR QR CODES
      const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // Timeout reduzido
      });
      
      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }
      
      const data = await response.json();
      
      // Verifica se o VPS específico está na lista de instâncias ativas
      const isInstanceHealthy = data.activeInstances && 
                               data.activeInstances.includes(vpsInstanceId);
      
      return { 
        success: isInstanceHealthy, 
        data: isInstanceHealthy ? 'healthy' : 'not_active' 
      };
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Retorna status de saúde de uma instância
   */
  static getHealthStatus(instanceId: string): ConnectionHealth | null {
    return this.healthStatus.get(instanceId) || null;
  }
  
  /**
   * Retorna todas as instâncias monitoradas
   */
  static getAllHealthStatus(): Map<string, ConnectionHealth> {
    return new Map(this.healthStatus);
  }
  
  /**
   * Para todos os monitoramentos (cleanup)
   */
  static stopAllMonitoring(): void {
    console.log('[ConnectionHealthService] Stopping ALL health monitoring');
    
    this.activeHeartbeats.forEach((heartbeat, instanceId) => {
      clearInterval(heartbeat);
      console.log('[ConnectionHealthService] Stopped monitoring for:', instanceId);
    });
    
    this.activeHeartbeats.clear();
    this.healthStatus.clear();
  }

  /**
   * NOVA FUNÇÃO: Verificação manual de status (apenas quando solicitado)
   */
  static async manualHealthCheck(instanceId: string, vpsInstanceId: string): Promise<ServiceResponse> {
    console.log('[ConnectionHealthService] Manual health check requested for:', instanceId);
    return await this.checkVPSHealthOnly(vpsInstanceId);
  }
}
