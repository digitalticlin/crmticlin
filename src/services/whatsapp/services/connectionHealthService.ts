
import { supabase } from "@/integrations/supabase/client";
import { VPS_CONFIG } from "../config/vpsConfig";
import { ServiceResponse } from "../types/whatsappWebTypes";
import { StabilityService } from "./stabilityService";

export interface ConnectionHealth {
  instanceId: string;
  isHealthy: boolean;
  lastHeartbeat: string;
  consecutiveFailures: number;
  needsReconnection: boolean;
}

export class ConnectionHealthService {
  // INTERVALOS EXTREMAMENTE REDUZIDOS PARA MÁXIMA ESTABILIDADE
  private static readonly HEARTBEAT_INTERVAL = 900000; // 15 MINUTOS (era 5 minutos)
  private static readonly MAX_CONSECUTIVE_FAILURES = 15; // MUITO AUMENTADO (era 5)
  private static readonly RECONNECTION_COOLDOWN = 600000; // 10 minutos (era 5 minutos)
  
  private static activeHeartbeats = new Map<string, NodeJS.Timeout>();
  private static healthStatus = new Map<string, ConnectionHealth>();
  
  /**
   * Inicia monitoramento de saúde APENAS para instâncias conectadas
   * AGORA MUITO MENOS AGRESSIVO E COM PROTEÇÕES
   */
  static startHealthMonitoring(instanceId: string, vpsInstanceId: string): void {
    // VERIFICAR SE REMOÇÃO ESTÁ DESABILITADA
    if (!StabilityService.isRemovalAllowed()) {
      console.log('[ConnectionHealthService] Monitoramento DESABILITADO por segurança para:', instanceId);
      return;
    }

    console.log('[ConnectionHealthService] Starting ULTRA-CONSERVATIVE health monitoring for:', instanceId);
    
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
    
    // HEARTBEAT EXTREMAMENTE ESPAÇADO - 15 minutos em vez de 5
    const heartbeatInterval = setInterval(async () => {
      await this.performUltraConservativeHealthCheck(instanceId, vpsInstanceId);
    }, this.HEARTBEAT_INTERVAL);
    
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
   * Realiza verificação de saúde ULTRA CONSERVADORA
   */
  private static async performUltraConservativeHealthCheck(instanceId: string, vpsInstanceId: string): Promise<void> {
    try {
      // VERIFICAR NOVAMENTE SE REMOÇÃO ESTÁ PERMITIDA
      if (!StabilityService.isRemovalAllowed()) {
        console.log('[ConnectionHealthService] Pulando health check - remoção desabilitada para:', instanceId);
        return;
      }

      console.log('[ConnectionHealthService] ULTRA-CONSERVATIVE health check for:', instanceId);
      
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
        console.log('[ConnectionHealthService] Ultra-conservative health check PASSED for:', instanceId);
      } else {
        // Incrementa falhas mas com TOLERÂNCIA MÁXIMA
        const consecutiveFailures = currentHealth.consecutiveFailures + 1;
        const needsReconnection = consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES; // 15 falhas consecutivas!
        
        const updatedHealth: ConnectionHealth = {
          ...currentHealth,
          isHealthy: consecutiveFailures < 10, // Considera saudável até 10 falhas
          consecutiveFailures,
          needsReconnection
        };
        
        this.healthStatus.set(instanceId, updatedHealth);
        console.warn('[ConnectionHealthService] Ultra-conservative health check failed for:', instanceId, 'Failures:', consecutiveFailures, '/ Tolerance:', this.MAX_CONSECUTIVE_FAILURES);
        
        // APENAS marca como problemática - NÃO remove mais automaticamente
        if (needsReconnection) {
          console.log('[ConnectionHealthService] Instance needs attention after', consecutiveFailures, 'failures, but NOT removing automatically');
          
          // Em vez de remover, marca como problemática no sistema de estabilidade
          await this.markAsProblematic(instanceId, `${consecutiveFailures} health check failures`);
        }
      }
      
    } catch (error) {
      console.error('[ConnectionHealthService] Ultra-conservative health check error for:', instanceId, error);
      // MESMO em caso de erro, não remove - apenas registra
    }
  }
  
  /**
   * Marca instância como problemática no sistema de estabilidade
   */
  private static async markAsProblematic(instanceId: string, reason: string) {
    try {
      console.log('[ConnectionHealthService] Marking as problematic (NOT removing):', instanceId, reason);
      
      // Atualizar status no banco para indicar problema
      await supabase
        .from('whatsapp_instances')
        .update({
          web_status: 'health_issues', // Novo status para indicar problemas
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId);

      console.log('[ConnectionHealthService] Instance marked as problematic (preserved):', instanceId);
      
    } catch (error) {
      console.error('[ConnectionHealthService] Error marking as problematic:', error);
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
        signal: AbortSignal.timeout(15000) // Timeout aumentado para 15 segundos
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
    console.log('[ConnectionHealthService] Stopping ALL health monitoring for STABILITY');
    
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

  /**
   * NOVA: Força reset de todas as contagens de falha
   */
  static resetAllFailureCounts(): void {
    console.log('[ConnectionHealthService] Resetting ALL failure counts for stability');
    
    this.healthStatus.forEach((health, instanceId) => {
      const resetHealth: ConnectionHealth = {
        ...health,
        isHealthy: true,
        consecutiveFailures: 0,
        needsReconnection: false,
        lastHeartbeat: new Date().toISOString()
      };
      this.healthStatus.set(instanceId, resetHealth);
    });
  }
}
