
import { supabase } from "@/integrations/supabase/client";
import { ConnectionHealthService } from "./connectionHealthService";
import { StabilityQuarantineManager } from "./stabilityQuarantineManager";

export interface StabilityConfig {
  healthCheckInterval: number; // minutos
  maxConsecutiveFailures: number;
  quarantineTimeout: number; // minutos
  autoRecoveryEnabled: boolean;
  aggressiveRemovalDisabled: boolean;
}

export class StabilityService {
  private static config: StabilityConfig = {
    healthCheckInterval: 15, // AUMENTADO de 5 para 15 minutos
    maxConsecutiveFailures: 10, // AUMENTADO de 5 para 10
    quarantineTimeout: 30, // NOVO: 30 minutos de quarentena
    autoRecoveryEnabled: true,
    aggressiveRemovalDisabled: true // NOVO: desabilita remoção agressiva
  };

  /**
   * Aplica configurações de estabilidade conservadoras
   */
  static applyStabilitySettings() {
    console.log('[StabilityService] Aplicando configurações de estabilidade conservadoras:', this.config);

    // Para todo o monitoramento agressivo existente
    ConnectionHealthService.stopAllMonitoring();

    // Reinicia com configurações mais conservadoras
    this.startConservativeMonitoring();
  }

  /**
   * Inicia monitoramento conservador (menos agressivo)
   */
  static startConservativeMonitoring() {
    console.log('[StabilityService] Iniciando monitoramento CONSERVADOR');

    // Monitoramento muito menos frequente e mais tolerante
    const conservativeInterval = setInterval(async () => {
      await this.performConservativeHealthCheck();
    }, this.config.healthCheckInterval * 60 * 1000); // Em minutos

    return () => {
      clearInterval(conservativeInterval);
    };
  }

  /**
   * Verificação de saúde conservadora
   */
  private static async performConservativeHealthCheck() {
    try {
      console.log('[StabilityService] Verificação conservadora de saúde...');

      // Buscar instâncias conectadas
      const { data: connectedInstances, error } = await supabase
        .from('whatsapp_instances')
        .select('id, vps_instance_id, web_status, connection_status, phone')
        .in('web_status', ['ready', 'open'])
        .not('vps_instance_id', 'is', null);

      if (error) {
        console.error('[StabilityService] Erro ao buscar instâncias:', error);
        return;
      }

      for (const instance of connectedInstances || []) {
        await this.conservativeInstanceCheck(instance);
      }

    } catch (error) {
      console.error('[StabilityService] Erro na verificação conservadora:', error);
    }
  }

  /**
   * Verificação conservadora de instância individual
   */
  private static async conservativeInstanceCheck(instance: any) {
    try {
      const instanceId = instance.id;
      const vpsInstanceId = instance.vps_instance_id;

      // Verificar se está em quarentena
      if (StabilityQuarantineManager.isInQuarantine(instanceId, this.config.quarantineTimeout)) {
        console.log('[StabilityService] Instância ainda em quarentena:', instanceId);
        return; // Não verifica instâncias em quarentena
      }

      // Verificação de saúde MUITO mais tolerante
      const healthResult = await ConnectionHealthService.manualHealthCheck(instanceId, vpsInstanceId);
      
      if (!healthResult.success) {
        console.warn('[StabilityService] Falha na verificação, mas sendo CONSERVADOR:', instanceId);
        
        // Em vez de remover, apenas coloca em quarentena
        StabilityQuarantineManager.putInQuarantine(instanceId, 'health_check_failed', 1);
      } else {
        console.log('[StabilityService] Instância saudável:', instanceId);
      }

    } catch (error) {
      console.error('[StabilityService] Erro na verificação de instância:', instance.id, error);
    }
  }

  /**
   * Força recuperação de instâncias em quarentena
   */
  static async forceRecoveryFromQuarantine() {
    return await StabilityQuarantineManager.forceRecoveryFromQuarantine();
  }

  /**
   * Obtém status de quarentena
   */
  static getQuarantineStatus() {
    return StabilityQuarantineManager.getQuarantineStatus();
  }

  /**
   * Desabilita completamente remoções automáticas
   */
  static disableAutomaticRemoval() {
    console.log('[StabilityService] DESABILITANDO remoções automáticas por segurança');
    this.config.aggressiveRemovalDisabled = true;
  }

  /**
   * Verifica se remoção é permitida (para usar em outros serviços)
   */
  static isRemovalAllowed(): boolean {
    return !this.config.aggressiveRemovalDisabled;
  }
}
