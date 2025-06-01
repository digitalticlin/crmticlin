
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
  private static readonly HEARTBEAT_INTERVAL = 30000; // 30 segundos
  private static readonly MAX_CONSECUTIVE_FAILURES = 3;
  private static readonly RECONNECTION_COOLDOWN = 60000; // 1 minuto
  
  private static activeHeartbeats = new Map<string, NodeJS.Timeout>();
  private static healthStatus = new Map<string, ConnectionHealth>();
  
  /**
   * Inicia monitoramento de saúde para uma instância
   */
  static startHealthMonitoring(instanceId: string, vpsInstanceId: string): void {
    console.log('[ConnectionHealthService] Starting health monitoring for:', instanceId);
    
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
    
    // Inicia heartbeat periódico
    const heartbeatInterval = setInterval(async () => {
      await this.performHealthCheck(instanceId, vpsInstanceId);
    }, this.HEARTBEAT_INTERVAL);
    
    this.activeHeartbeats.set(instanceId, heartbeatInterval);
  }
  
  /**
   * Para monitoramento de saúde para uma instância
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
   * Realiza verificação de saúde de uma instância
   */
  private static async performHealthCheck(instanceId: string, vpsInstanceId: string): Promise<void> {
    try {
      console.log('[ConnectionHealthService] Performing health check for:', instanceId);
      
      const healthCheckResult = await this.checkVPSHealth(vpsInstanceId);
      const currentHealth = this.healthStatus.get(instanceId);
      
      if (!currentHealth) return;
      
      if (healthCheckResult.success) {
        // Instância saudável - reset falhas
        const updatedHealth: ConnectionHealth = {
          ...currentHealth,
          isHealthy: true,
          lastHeartbeat: new Date().toISOString(),
          consecutiveFailures: 0,
          needsReconnection: false
        };
        
        this.healthStatus.set(instanceId, updatedHealth);
        console.log('[ConnectionHealthService] Health check passed for:', instanceId);
      } else {
        // Instância com problema - incrementa falhas
        const consecutiveFailures = currentHealth.consecutiveFailures + 1;
        const needsReconnection = consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES;
        
        const updatedHealth: ConnectionHealth = {
          ...currentHealth,
          isHealthy: false,
          consecutiveFailures,
          needsReconnection
        };
        
        this.healthStatus.set(instanceId, updatedHealth);
        console.warn('[ConnectionHealthService] Health check failed for:', instanceId, 'Failures:', consecutiveFailures);
        
        if (needsReconnection) {
          await this.attemptAutoReconnection(instanceId, vpsInstanceId);
        }
      }
      
      // Atualiza status no banco se necessário
      await this.updateDatabaseStatus(instanceId, currentHealth);
      
    } catch (error) {
      console.error('[ConnectionHealthService] Health check error for:', instanceId, error);
    }
  }
  
  /**
   * Verifica saúde no VPS
   */
  private static async checkVPSHealth(vpsInstanceId: string): Promise<ServiceResponse> {
    try {
      const response = await fetch(`${VPS_CONFIG.baseUrl}/health/${vpsInstanceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(15000) // 15 segundos timeout
      });
      
      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }
      
      const data = await response.json();
      return { success: true, data };
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Tenta reconexão automática
   */
  private static async attemptAutoReconnection(instanceId: string, vpsInstanceId: string): Promise<void> {
    try {
      console.log('[ConnectionHealthService] Attempting auto-reconnection for:', instanceId);
      
      const reconnectResult = await fetch(`${VPS_CONFIG.baseUrl}/reconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceId: vpsInstanceId,
          autoReconnect: true
        }),
        signal: AbortSignal.timeout(30000) // 30 segundos para reconexão
      });
      
      if (reconnectResult.ok) {
        console.log('[ConnectionHealthService] Auto-reconnection successful for:', instanceId);
        
        // Reset status de saúde
        const currentHealth = this.healthStatus.get(instanceId);
        if (currentHealth) {
          this.healthStatus.set(instanceId, {
            ...currentHealth,
            isHealthy: true,
            consecutiveFailures: 0,
            needsReconnection: false,
            lastHeartbeat: new Date().toISOString()
          });
        }
      } else {
        console.error('[ConnectionHealthService] Auto-reconnection failed for:', instanceId);
      }
      
    } catch (error) {
      console.error('[ConnectionHealthService] Auto-reconnection error for:', instanceId, error);
    }
  }
  
  /**
   * Atualiza status no banco de dados se necessário
   */
  private static async updateDatabaseStatus(instanceId: string, health: ConnectionHealth): Promise<void> {
    try {
      // Só atualiza se detectar mudança significativa de status
      if (!health.isHealthy && health.consecutiveFailures >= 2) {
        await supabase
          .from('whatsapp_instances')
          .update({
            web_status: 'connection_unstable',
            updated_at: new Date().toISOString()
          })
          .eq('id', instanceId);
      }
    } catch (error) {
      console.error('[ConnectionHealthService] Database update error:', error);
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
    console.log('[ConnectionHealthService] Stopping all health monitoring');
    
    this.activeHeartbeats.forEach((heartbeat, instanceId) => {
      clearInterval(heartbeat);
      console.log('[ConnectionHealthService] Stopped monitoring for:', instanceId);
    });
    
    this.activeHeartbeats.clear();
    this.healthStatus.clear();
  }
}
