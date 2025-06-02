
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  host: '31.97.24.222',
  port: 3001,
  authToken: 'default-token'
};

interface DiagnosticResult {
  step: string;
  success: boolean;
  details: any;
  responseTime?: number;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[VPS Diagnostic] Iniciando diagnóstico completo da VPS...');
    
    const diagnostics: DiagnosticResult[] = [];
    
    // PASSO 1: Teste de Conectividade Básica
    console.log('[VPS Diagnostic] Passo 1: Teste de conectividade básica');
    try {
      const startTime = Date.now();
      const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });
      const responseTime = Date.now() - startTime;
      
      diagnostics.push({
        step: '1_basic_connectivity',
        success: response.ok,
        details: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        },
        responseTime
      });
      
      if (response.ok) {
        const data = await response.text();
        diagnostics[diagnostics.length - 1].details.responseBody = data;
      }
    } catch (error) {
      diagnostics.push({
        step: '1_basic_connectivity',
        success: false,
        error: error.message,
        details: { errorType: error.name }
      });
    }

    // PASSO 2: Teste de Autenticação
    console.log('[VPS Diagnostic] Passo 2: Teste de autenticação');
    try {
      const startTime = Date.now();
      const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VPS_CONFIG.authToken}`
        },
        signal: AbortSignal.timeout(10000)
      });
      const responseTime = Date.now() - startTime;
      
      diagnostics.push({
        step: '2_authentication_test',
        success: response.ok,
        details: {
          status: response.status,
          statusText: response.statusText,
          tokenUsed: VPS_CONFIG.authToken,
          headers: Object.fromEntries(response.headers.entries())
        },
        responseTime
      });
    } catch (error) {
      diagnostics.push({
        step: '2_authentication_test',
        success: false,
        error: error.message,
        details: { tokenUsed: VPS_CONFIG.authToken }
      });
    }

    // PASSO 3: Teste do Endpoint Problemático (/instance/create)
    console.log('[VPS Diagnostic] Passo 3: Teste do endpoint /instance/create');
    try {
      const startTime = Date.now();
      const testPayload = {
        instanceId: "diagnostic_test_123",
        sessionName: "diagnostic_test",
        webhookUrl: "https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web",
        companyId: "diagnostic-test-uuid"
      };
      
      const response = await fetch(`${VPS_CONFIG.baseUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VPS_CONFIG.authToken}`
        },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(15000)
      });
      
      const responseTime = Date.now() - startTime;
      const responseText = await response.text();
      
      diagnostics.push({
        step: '3_instance_create_endpoint',
        success: response.ok,
        details: {
          status: response.status,
          statusText: response.statusText,
          requestPayload: testPayload,
          responseBody: responseText,
          headers: Object.fromEntries(response.headers.entries())
        },
        responseTime
      });
    } catch (error) {
      diagnostics.push({
        step: '3_instance_create_endpoint',
        success: false,
        error: error.message,
        details: { 
          endpoint: '/instance/create',
          method: 'POST'
        }
      });
    }

    // PASSO 4: Teste de Outros Endpoints
    console.log('[VPS Diagnostic] Passo 4: Teste de outros endpoints');
    const endpoints = ['/instances', '/status'];
    
    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${VPS_CONFIG.baseUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${VPS_CONFIG.authToken}`
          },
          signal: AbortSignal.timeout(10000)
        });
        const responseTime = Date.now() - startTime;
        
        diagnostics.push({
          step: `4_endpoint_${endpoint.replace('/', '_')}`,
          success: response.ok,
          details: {
            endpoint,
            status: response.status,
            statusText: response.statusText,
            responseBody: await response.text()
          },
          responseTime
        });
      } catch (error) {
        diagnostics.push({
          step: `4_endpoint_${endpoint.replace('/', '_')}`,
          success: false,
          error: error.message,
          details: { endpoint }
        });
      }
    }

    // PASSO 5: Análise de Resultados
    console.log('[VPS Diagnostic] Passo 5: Análise de resultados');
    const analysis = {
      totalTests: diagnostics.length,
      successfulTests: diagnostics.filter(d => d.success).length,
      failedTests: diagnostics.filter(d => !d.success).length,
      avgResponseTime: diagnostics
        .filter(d => d.responseTime)
        .reduce((acc, d) => acc + (d.responseTime || 0), 0) / diagnostics.filter(d => d.responseTime).length,
      recommendations: []
    };

    // Gerar recomendações baseadas nos resultados
    const connectivityTest = diagnostics.find(d => d.step === '1_basic_connectivity');
    const authTest = diagnostics.find(d => d.step === '2_authentication_test');
    const createEndpointTest = diagnostics.find(d => d.step === '3_instance_create_endpoint');

    if (!connectivityTest?.success) {
      analysis.recommendations.push('VPS não está acessível - verificar se está rodando e se a porta 3001 está aberta');
    }

    if (!authTest?.success) {
      analysis.recommendations.push('Problemas de autenticação - verificar se o token "default-token" está correto');
    }

    if (!createEndpointTest?.success && connectivityTest?.success) {
      analysis.recommendations.push('Endpoint /instance/create não está funcionando - verificar se está registrado no Express');
    }

    if (createEndpointTest?.details?.status === 404) {
      analysis.recommendations.push('Erro 404 confirmado - endpoint /instance/create não existe ou path está incorreto');
    }

    const result = {
      timestamp: new Date().toISOString(),
      vpsConfig: {
        baseUrl: VPS_CONFIG.baseUrl,
        host: VPS_CONFIG.host,
        port: VPS_CONFIG.port,
        authToken: VPS_CONFIG.authToken
      },
      diagnostics,
      analysis,
      hostingerGuidance: {
        expectedUrl: `http://${VPS_CONFIG.host}:${VPS_CONFIG.port}/instance/create`,
        expectedMethod: 'POST',
        expectedHeaders: {
          'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
          'Content-Type': 'application/json'
        },
        expectedPayload: {
          instanceId: 'string',
          sessionName: 'string',
          webhookUrl: 'string',
          companyId: 'string'
        }
      }
    };

    console.log('[VPS Diagnostic] Diagnóstico completo concluído');
    console.log('[VPS Diagnostic] Resultados:', JSON.stringify(analysis, null, 2));

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('[VPS Diagnostic] Erro no diagnóstico:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
