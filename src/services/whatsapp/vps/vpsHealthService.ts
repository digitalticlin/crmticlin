
import { supabase } from "@/integrations/supabase/client";

export interface VPSHealthResult {
  success: boolean;
  status: string;
  details: {
    connectivity: boolean;
    authentication: boolean;
    serverProcess: boolean;
    instanceCount: number;
    errors: string[];
  };
  recommendations: string[];
}

export class VPSHealthService {
  /**
   * Diagnóstico completo da VPS via Edge Function segura
   */
  static async performHealthCheck(): Promise<VPSHealthResult> {
    console.log('[VPS Health] 🏥 Iniciando diagnóstico completo da VPS...');
    
    const result: VPSHealthResult = {
      success: false,
      status: 'unknown',
      details: {
        connectivity: false,
        authentication: false,
        serverProcess: false,
        instanceCount: 0,
        errors: []
      },
      recommendations: []
    };

    try {
      const { data, error } = await supabase.functions.invoke('secure_whatsapp_service', {
        body: {
          action: 'health_check'
        }
      });

      if (error) {
        result.details.errors.push(`Edge Function error: ${error.message}`);
        result.status = 'error';
        return result;
      }

      if (data?.healthCheck) {
        const healthData = data.healthCheck;
        result.details = {
          connectivity: healthData.connectivity || false,
          authentication: healthData.authentication || false,
          serverProcess: healthData.serverProcess || false,
          instanceCount: healthData.instanceCount || 0,
          errors: healthData.errors || []
        };
        
        result.success = healthData.success || false;
        result.status = healthData.status || 'unknown';
        result.recommendations = healthData.recommendations || [];
      }

      console.log('[VPS Health] ✅ Diagnóstico concluído:', result);
      return result;

    } catch (error: any) {
      console.error('[VPS Health] ❌ Erro durante diagnóstico:', error);
      result.details.errors.push(`Erro inesperado: ${error.message}`);
      result.status = 'error';
      return result;
    }
  }

  /**
   * Teste de conectividade básica via Edge Function
   */
  private static async testConnectivity(): Promise<{success: boolean; error?: string}> {
    try {
      const { data, error } = await supabase.functions.invoke('secure_whatsapp_service', {
        body: {
          action: 'test_connectivity'
        }
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: data?.success || false,
        error: data?.error
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Teste de autenticação via Edge Function
   */
  private static async testAuthentication(): Promise<{success: boolean; error?: string}> {
    try {
      const { data, error } = await supabase.functions.invoke('secure_whatsapp_service', {
        body: {
          action: 'test_auth'
        }
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: data?.success || false,
        error: data?.error
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Teste do processo do servidor via Edge Function
   */
  private static async testServerProcess(): Promise<{success: boolean; error?: string}> {
    try {
      const { data, error } = await supabase.functions.invoke('secure_whatsapp_service', {
        body: {
          action: 'test_server_process'
        }
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: data?.success || false,
        error: data?.error
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Contar instâncias ativas via Edge Function
   */
  private static async countInstances(): Promise<{count: number; error?: string}> {
    try {
      const { data, error } = await supabase.functions.invoke('secure_whatsapp_service', {
        body: {
          action: 'count_instances'
        }
      });

      if (error) {
        return {
          count: 0,
          error: error.message
        };
      }

      return {
        count: data?.count || 0,
        error: data?.error
      };
    } catch (error: any) {
      return {
        count: 0,
        error: error.message
      };
    }
  }
}
