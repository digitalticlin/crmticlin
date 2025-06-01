
import { supabase } from "@/integrations/supabase/client";
import { VPS_CONFIG } from "../config/vpsConfig";
import { ServiceResponse } from "../types/whatsappWebTypes";

export class ConnectionHealthChecker {
  /**
   * Verifica saúde APENAS com endpoint de health (sem gerar QR)
   */
  static async checkVPSHealthOnly(vpsInstanceId: string): Promise<ServiceResponse> {
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
   * Marca instância como problemática no sistema de estabilidade
   */
  static async markAsProblematic(instanceId: string, reason: string) {
    try {
      console.log('[ConnectionHealthChecker] Marking as problematic (NOT removing):', instanceId, reason);
      
      // Atualizar status no banco para indicar problema
      await supabase
        .from('whatsapp_instances')
        .update({
          web_status: 'health_issues', // Novo status para indicar problemas
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId);

      console.log('[ConnectionHealthChecker] Instance marked as problematic (preserved):', instanceId);
      
    } catch (error) {
      console.error('[ConnectionHealthChecker] Error marking as problematic:', error);
    }
  }
}
