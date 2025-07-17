
import { supabase } from "@/integrations/supabase/client";

interface VPSHealthResponse {
  success: boolean;
  online: boolean;
  responseTime?: number;
  error?: string;
  timestamp: string;
}

export class VPSHealthService {
  private static readonly VPS_BASE_URL = 'http://31.97.163.57:3001'; // CORREÇÃO: VPS correta
  private static readonly HEALTH_TIMEOUT = 5000; // 5 segundos

  static async checkVPSHealth(): Promise<VPSHealthResponse> {
    const startTime = Date.now();
    
    try {
      console.log('[VPS Health] 🔍 Verificando saúde da VPS...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.HEALTH_TIMEOUT);

      const response = await fetch(`${this.VPS_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        console.log(`[VPS Health] ✅ VPS online - tempo: ${responseTime}ms`);
        return {
          success: true,
          online: true,
          responseTime,
          timestamp: new Date().toISOString()
        };
      } else {
        console.log(`[VPS Health] ⚠️ VPS respondeu com status: ${response.status}`);
        return {
          success: false,
          online: false,
          responseTime,
          error: `HTTP ${response.status}`,
          timestamp: new Date().toISOString()
        };
      }

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.error('[VPS Health] ❌ Erro ao verificar VPS:', error.message);
      
      return {
        success: false,
        online: false,
        responseTime,
        error: error.name === 'AbortError' ? 'Timeout' : error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  static async logHealthCheck(): Promise<void> {
    try {
      const healthResult = await this.checkVPSHealth();
      
      // Log no banco para monitoramento
      await supabase
        .from('sync_logs')
        .insert({
          function_name: 'vps_health_check',
          status: healthResult.success ? 'success' : 'error',
          result: {
            online: healthResult.online,
            responseTime: healthResult.responseTime,
            error: healthResult.error,
            timestamp: healthResult.timestamp
          }
        });

    } catch (error) {
      console.error('[VPS Health] ❌ Erro ao registrar health check:', error);
    }
  }

  static async waitForVPSOnline(maxAttempts: number = 3, delayMs: number = 2000): Promise<boolean> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`[VPS Health] 🔄 Tentativa ${attempt}/${maxAttempts} de conectar com VPS`);
      
      const health = await this.checkVPSHealth();
      
      if (health.online) {
        console.log(`[VPS Health] ✅ VPS online na tentativa ${attempt}`);
        return true;
      }
      
      if (attempt < maxAttempts) {
        console.log(`[VPS Health] ⏳ Aguardando ${delayMs}ms antes da próxima tentativa`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    console.log(`[VPS Health] ❌ VPS permanece offline após ${maxAttempts} tentativas`);
    return false;
  }
}
