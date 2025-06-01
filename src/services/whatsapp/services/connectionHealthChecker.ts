
import { supabase } from "@/integrations/supabase/client";
import { VPS_CONFIG, withRetry } from "../config/vpsConfig";
import { StabilityQuarantineManager } from "./stabilityQuarantineManager";

export interface ServiceResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class ConnectionHealthChecker {
  /**
   * Verificação de saúde SOMENTE com endpoint leve (sem gerar QR)
   */
  static async checkVPSHealthOnly(vpsInstanceId: string): Promise<ServiceResponse> {
    try {
      console.log('[ConnectionHealthChecker] Verificação leve de saúde para:', vpsInstanceId);

      // Usar endpoint /ping mais leve em vez de /health completo
      const response = await withRetry(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), VPS_CONFIG.timeouts.ping);

        const res = await fetch(`${VPS_CONFIG.baseUrl}/ping/${vpsInstanceId}`, {
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
      }, `Health Check ${vpsInstanceId}`, 3); // Só 3 tentativas para health check

      const data = await response.json();
      
      // Verificar se a instância específica está ativa
      const isInstanceHealthy = data.status === 'online' || 
                               data.active === true ||
                               data.connected === true ||
                               (data.activeInstances && data.activeInstances.includes(vpsInstanceId));
      
      if (isInstanceHealthy) {
        console.log('[ConnectionHealthChecker] ✅ Instância saudável:', vpsInstanceId);
        return { success: true, data: 'healthy' };
      } else {
        console.warn('[ConnectionHealthChecker] ⚠️ Instância não ativa:', vpsInstanceId);
        return { success: false, data: 'not_active' };
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ConnectionHealthChecker] ❌ Verificação falhou:', vpsInstanceId, errorMessage);
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  /**
   * Verificação DUPLA antes de marcar como problemática
   */
  static async doubleValidateHealth(vpsInstanceId: string): Promise<boolean> {
    console.log('[ConnectionHealthChecker] Validação dupla para:', vpsInstanceId);

    // Primeira verificação
    const firstCheck = await this.checkVPSHealthOnly(vpsInstanceId);
    
    if (firstCheck.success) {
      console.log('[ConnectionHealthChecker] ✅ Primeira verificação OK');
      return true;
    }

    console.log('[ConnectionHealthChecker] ⚠️ Primeira verificação falhou, aguardando 5 minutos...');
    
    // Aguardar 5 minutos antes da segunda verificação
    await new Promise(resolve => setTimeout(resolve, VPS_CONFIG.recovery.doubleValidationDelay));

    // Segunda verificação
    const secondCheck = await this.checkVPSHealthOnly(vpsInstanceId);
    
    if (secondCheck.success) {
      console.log('[ConnectionHealthChecker] ✅ Segunda verificação OK - falso positivo');
      return true;
    }

    console.log('[ConnectionHealthChecker] ❌ Ambas verificações falharam');
    return false;
  }

  /**
   * Marca instância como problemática usando QUARENTENA em vez de remoção
   */
  static async markAsProblematic(instanceId: string, reason: string, performDoubleValidation: boolean = true): Promise<void> {
    try {
      console.log('[ConnectionHealthChecker] Marcando como problemática (COM quarentena):', instanceId, reason);
      
      // Buscar dados da instância
      const { data: instance, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('vps_instance_id')
        .eq('id', instanceId)
        .single();

      if (fetchError || !instance?.vps_instance_id) {
        console.error('[ConnectionHealthChecker] Instância não encontrada:', instanceId);
        return;
      }

      // Verificação dupla se solicitada
      if (performDoubleValidation) {
        const isStillHealthy = await this.doubleValidateHealth(instance.vps_instance_id);
        if (isStillHealthy) {
          console.log('[ConnectionHealthChecker] Instância ainda saudável após validação dupla - não marcando como problemática');
          return;
        }
      }

      // Colocar em quarentena em vez de remover
      StabilityQuarantineManager.putInQuarantine(instanceId, reason);

      // Atualizar status no banco para indicar problema (sem desconectar)
      await supabase
        .from('whatsapp_instances')
        .update({
          web_status: 'health_issues',
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId);

      console.log('[ConnectionHealthChecker] ✅ Instância em quarentena (preservada):', instanceId);
      
    } catch (error) {
      console.error('[ConnectionHealthChecker] Erro ao marcar como problemática:', error);
    }
  }

  /**
   * Verificação manual de saúde com tolerância
   */
  static async manualHealthCheck(instanceId: string, vpsInstanceId: string): Promise<ServiceResponse> {
    try {
      console.log('[ConnectionHealthChecker] Verificação manual para:', instanceId);

      // Verificar se está em quarentena
      if (StabilityQuarantineManager.isInQuarantine(instanceId)) {
        return {
          success: false,
          error: 'Instância em quarentena'
        };
      }

      // Fazer verificação de saúde
      const healthResult = await this.checkVPSHealthOnly(vpsInstanceId);
      
      if (!healthResult.success) {
        // Não marcar como problemática imediatamente - só colocar em quarentena
        StabilityQuarantineManager.putInQuarantine(instanceId, `Manual check failed: ${healthResult.error}`);
      }

      return healthResult;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Recovery de instância específica
   */
  static async recoverInstance(instanceId: string): Promise<ServiceResponse> {
    try {
      console.log('[ConnectionHealthChecker] Recuperando instância:', instanceId);

      // Remover da quarentena
      StabilityQuarantineManager.removeFromQuarantine(instanceId);

      // Atualizar status no banco
      await supabase
        .from('whatsapp_instances')
        .update({
          web_status: 'connecting',
          connection_status: 'connecting',
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId);

      console.log('[ConnectionHealthChecker] ✅ Instância recuperada da quarentena:', instanceId);

      return {
        success: true,
        data: 'recovered'
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}
