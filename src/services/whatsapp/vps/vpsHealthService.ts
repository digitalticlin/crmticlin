
import { VPS_CONFIG } from "../config/vpsConfig";

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
   * Diagnóstico completo da VPS
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
      // Teste 1: Conectividade básica
      console.log('[VPS Health] 🔗 Testando conectividade básica...');
      const connectivityTest = await this.testConnectivity();
      result.details.connectivity = connectivityTest.success;
      
      if (!connectivityTest.success) {
        result.details.errors.push(`Conectividade falhou: ${connectivityTest.error}`);
        result.recommendations.push('Verificar se a VPS está online e acessível');
        return result;
      }

      // Teste 2: Autenticação
      console.log('[VPS Health] 🔐 Testando autenticação...');
      const authTest = await this.testAuthentication();
      result.details.authentication = authTest.success;
      
      if (!authTest.success) {
        result.details.errors.push(`Autenticação falhou: ${authTest.error}`);
        result.recommendations.push('Verificar token de autenticação VPS_API_TOKEN');
      }

      // Teste 3: Processo do servidor
      console.log('[VPS Health] ⚙️ Testando processo do servidor...');
      const processTest = await this.testServerProcess();
      result.details.serverProcess = processTest.success;
      
      if (!processTest.success) {
        result.details.errors.push(`Processo do servidor: ${processTest.error}`);
        result.recommendations.push('Verificar se whatsapp-server.js está rodando na VPS');
      }

      // Teste 4: Contar instâncias
      if (result.details.authentication && result.details.serverProcess) {
        console.log('[VPS Health] 📊 Contando instâncias ativas...');
        const instancesTest = await this.countInstances();
        result.details.instanceCount = instancesTest.count;
        
        if (instancesTest.count === 0) {
          result.recommendations.push('Nenhuma instância ativa encontrada - possível perda após restart');
        }
      }

      // Determinar status geral
      if (result.details.connectivity && result.details.authentication && result.details.serverProcess) {
        result.success = true;
        result.status = 'healthy';
      } else if (result.details.connectivity) {
        result.status = 'partial';
      } else {
        result.status = 'offline';
      }

      console.log('[VPS Health] ✅ Diagnóstico concluído:', result);
      return result;

    } catch (error) {
      console.error('[VPS Health] ❌ Erro durante diagnóstico:', error);
      result.details.errors.push(`Erro inesperado: ${error.message}`);
      result.status = 'error';
      return result;
    }
  }

  /**
   * Teste de conectividade básica
   */
  private static async testConnectivity(): Promise<{success: boolean; error?: string}> {
    try {
      const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });

      return {
        success: response.ok,
        error: response.ok ? undefined : `HTTP ${response.status}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Teste de autenticação
   */
  private static async testAuthentication(): Promise<{success: boolean; error?: string}> {
    try {
      const response = await fetch(`${VPS_CONFIG.baseUrl}/instances`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VPS_CONFIG.authToken}`
        },
        signal: AbortSignal.timeout(10000)
      });

      if (response.status === 401) {
        return {
          success: false,
          error: 'Token de autenticação inválido'
        };
      }

      return {
        success: response.ok,
        error: response.ok ? undefined : `HTTP ${response.status}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Teste do processo do servidor
   */
  private static async testServerProcess(): Promise<{success: boolean; error?: string}> {
    try {
      const response = await fetch(`${VPS_CONFIG.baseUrl}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VPS_CONFIG.authToken}`
        },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: data.status === 'online',
          error: data.status !== 'online' ? `Status: ${data.status}` : undefined
        };
      }

      return {
        success: false,
        error: `HTTP ${response.status}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Contar instâncias ativas
   */
  private static async countInstances(): Promise<{count: number; error?: string}> {
    try {
      const response = await fetch(`${VPS_CONFIG.baseUrl}/instances`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VPS_CONFIG.authToken}`
        },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data = await response.json();
        return {
          count: data.instances?.length || 0
        };
      }

      return {
        count: 0,
        error: `HTTP ${response.status}`
      };
    } catch (error) {
      return {
        count: 0,
        error: error.message
      };
    }
  }
}
