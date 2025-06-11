
import { supabase } from "@/integrations/supabase/client";

interface EndpointTestResult {
  endpoint: string;
  method: string;
  working: boolean;
  status?: number;
  response?: any;
  error?: string;
  responseTime?: number;
}

interface EndpointValidationResult {
  success: boolean;
  vpsOnline: boolean;
  totalEndpoints: number;
  workingEndpoints: number;
  failedEndpoints: number;
  results: EndpointTestResult[];
  summary: {
    health: boolean;
    instances: boolean;
    createInstance: boolean;
    qrCode: boolean;
    deleteInstance: boolean;
    sendMessage: boolean;
    status: boolean;
  };
  recommendation?: string;
}

export class EndpointValidator {
  private static readonly VPS_URL = 'http://31.97.24.222:3002';
  private static readonly AUTH_TOKEN = '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';

  static async validateAllEndpoints(): Promise<EndpointValidationResult> {
    console.log('[Endpoint Validator] 🔍 Iniciando validação completa dos endpoints...');

    try {
      const { data, error } = await supabase.functions.invoke('vps_endpoint_discovery', {
        body: {
          action: 'discover_all_endpoints',
          testInstanceId: 'validation_test_' + Date.now()
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        return {
          success: false,
          vpsOnline: false,
          totalEndpoints: 0,
          workingEndpoints: 0,
          failedEndpoints: 0,
          results: [],
          summary: {
            health: false,
            instances: false,
            createInstance: false,
            qrCode: false,
            deleteInstance: false,
            sendMessage: false,
            status: false
          }
        };
      }

      const workingEndpoints = data.workingEndpoints || {};
      const fullReport = data.fullReport || {};

      // Analisar resultados
      const summary = {
        health: !!fullReport.create?.working,
        instances: true, // GET /instances sempre existe
        createInstance: !!fullReport.create?.working,
        qrCode: !!workingEndpoints.qrCode,
        deleteInstance: !!workingEndpoints.deleteInstance,
        sendMessage: !!workingEndpoints.sendMessage,
        status: !!workingEndpoints.status
      };

      const workingCount = Object.values(summary).filter(Boolean).length;
      const totalCount = Object.keys(summary).length;

      console.log('[Endpoint Validator] 📊 Validação concluída:', {
        working: workingCount,
        total: totalCount,
        endpoints: workingEndpoints
      });

      return {
        success: true,
        vpsOnline: workingCount > 0,
        totalEndpoints: totalCount,
        workingEndpoints: workingCount,
        failedEndpoints: totalCount - workingCount,
        results: this.formatResults(fullReport),
        summary,
        recommendation: this.generateRecommendation(summary, workingEndpoints)
      };

    } catch (error: any) {
      console.error('[Endpoint Validator] ❌ Erro na validação:', error);
      
      return {
        success: false,
        vpsOnline: false,
        totalEndpoints: 0,
        workingEndpoints: 0,
        failedEndpoints: 0,
        results: [],
        summary: {
          health: false,
          instances: false,
          createInstance: false,
          qrCode: false,
          deleteInstance: false,
          sendMessage: false,
          status: false
        }
      };
    }
  }

  private static formatResults(fullReport: any): EndpointTestResult[] {
    const results: EndpointTestResult[] = [];

    // Health/Create endpoint
    if (fullReport.create) {
      results.push({
        endpoint: '/instance/create',
        method: 'POST',
        working: fullReport.create.working,
        status: fullReport.create.status,
        response: fullReport.create.data,
        error: fullReport.create.error
      });
    }

    // QR Code endpoints
    if (fullReport.qrTests) {
      fullReport.qrTests.forEach((test: any) => {
        results.push({
          endpoint: test.endpoint,
          method: test.method,
          working: test.working,
          status: test.status,
          response: test.data,
          error: test.error
        });
      });
    }

    // Send message endpoints
    if (fullReport.sendTests) {
      fullReport.sendTests.forEach((test: any) => {
        results.push({
          endpoint: test.endpoint,
          method: test.method,
          working: test.working,
          status: test.status,
          response: test.data,
          error: test.error
        });
      });
    }

    // Status endpoints
    if (fullReport.statusTests) {
      fullReport.statusTests.forEach((test: any) => {
        results.push({
          endpoint: test.endpoint,
          method: test.method,
          working: test.working,
          status: test.status,
          response: test.data,
          error: test.error
        });
      });
    }

    // Delete endpoints
    if (fullReport.deleteTests) {
      fullReport.deleteTests.forEach((test: any) => {
        results.push({
          endpoint: test.endpoint,
          method: test.method,
          working: test.working,
          status: test.status,
          response: test.data,
          error: test.error
        });
      });
    }

    return results;
  }

  private static generateRecommendation(summary: any, workingEndpoints: any): string {
    const workingCount = Object.values(summary).filter(Boolean).length;
    const totalCount = Object.keys(summary).length;

    if (workingCount === totalCount) {
      return "✅ Todos os endpoints estão funcionando perfeitamente!";
    }

    if (workingCount === 0) {
      return "❌ Nenhum endpoint está funcionando. Verifique se a VPS está online e acessível.";
    }

    if (summary.createInstance && summary.qrCode) {
      return "⚠️ Funcionalidades principais funcionando. Teste a criação de instância.";
    }

    if (summary.health && !summary.createInstance) {
      return "⚠️ VPS online mas criação de instância com problema. Verifique Puppeteer.";
    }

    return "⚠️ Alguns endpoints com problema. Analise os logs para detalhes.";
  }

  static async testDirectConnection(): Promise<{ success: boolean; responseTime?: number; data?: any }> {
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${this.VPS_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      return {
        success: response.ok,
        responseTime,
        data
      };

    } catch (error: any) {
      console.error('[Endpoint Validator] ❌ Erro na conexão direta:', error);
      return {
        success: false
      };
    }
  }

  static async quickHealthCheck(): Promise<{ online: boolean; version?: string; instances?: number }> {
    try {
      const result = await this.testDirectConnection();
      
      if (result.success && result.data) {
        return {
          online: true,
          version: result.data.version,
          instances: result.data.activeInstances
        };
      }

      return { online: false };

    } catch (error) {
      return { online: false };
    }
  }
}
