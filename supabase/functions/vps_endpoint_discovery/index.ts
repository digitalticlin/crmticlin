
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EndpointTest {
  path: string;
  method: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[VPS Endpoint Discovery] 🔍 Iniciando descoberta de endpoints');

    // VPS Configuration
    const VPS_CONFIG = {
      host: '31.97.24.222',
      port: '3001',
      get baseUrl() {
        return `http://${this.host}:${this.port}`;
      },
      authToken: Deno.env.get('VPS_API_TOKEN') || 'default-token'
    };

    const getVPSHeaders = () => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
      'User-Agent': 'Supabase-VPS-Discovery/1.0',
      'Accept': 'application/json'
    });

    // Lista abrangente de endpoints para testar
    const endpointsToTest: EndpointTest[] = [
      // Endpoints conhecidos (funcionam)
      { path: '/health', method: 'GET', description: 'Health Check', priority: 'high' },
      { path: '/status', method: 'GET', description: 'Status Check', priority: 'high' },
      { path: '/instances', method: 'GET', description: 'List Instances', priority: 'high' },
      
      // Endpoints para criação de instâncias (variações possíveis)
      { path: '/instances', method: 'POST', description: 'Create Instance via /instances', priority: 'high' },
      { path: '/instance/create', method: 'POST', description: 'Create Instance via /instance/create', priority: 'high' },
      { path: '/whatsapp/create', method: 'POST', description: 'Create WhatsApp Instance', priority: 'high' },
      { path: '/session/create', method: 'POST', description: 'Create Session', priority: 'high' },
      { path: '/api/instances', method: 'POST', description: 'Create via /api/instances', priority: 'high' },
      { path: '/api/whatsapp/create', method: 'POST', description: 'Create via /api/whatsapp', priority: 'high' },
      { path: '/v1/instances', method: 'POST', description: 'Create via /v1/instances', priority: 'medium' },
      { path: '/create-instance', method: 'POST', description: 'Create via /create-instance', priority: 'medium' },
      { path: '/new-instance', method: 'POST', description: 'Create via /new-instance', priority: 'medium' },
      { path: '/client/create', method: 'POST', description: 'Create Client', priority: 'medium' },
      
      // Endpoints para QR Code
      { path: '/qr', method: 'GET', description: 'Get QR Code', priority: 'medium' },
      { path: '/qrcode', method: 'GET', description: 'Get QR Code Alt', priority: 'medium' },
      { path: '/instance/qr', method: 'GET', description: 'Instance QR', priority: 'medium' },
      
      // Endpoints de gestão
      { path: '/instance/delete', method: 'DELETE', description: 'Delete Instance', priority: 'medium' },
      { path: '/instance/stop', method: 'POST', description: 'Stop Instance', priority: 'medium' },
      { path: '/instance/start', method: 'POST', description: 'Start Instance', priority: 'medium' },
      
      // Outros endpoints comuns
      { path: '/webhook', method: 'POST', description: 'Webhook Config', priority: 'low' },
      { path: '/send-message', method: 'POST', description: 'Send Message', priority: 'low' },
      { path: '/api', method: 'GET', description: 'API Info', priority: 'low' },
      { path: '/docs', method: 'GET', description: 'Documentation', priority: 'low' },
      { path: '/version', method: 'GET', description: 'Version Info', priority: 'low' },
    ];

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    console.log(`[VPS Discovery] Testando ${endpointsToTest.length} endpoints...`);

    // Testar cada endpoint
    for (const endpoint of endpointsToTest) {
      const startTime = Date.now();
      
      try {
        console.log(`[VPS Discovery] Testando: ${endpoint.method} ${endpoint.path}`);
        
        const requestOptions: RequestInit = {
          method: endpoint.method,
          headers: getVPSHeaders(),
          signal: AbortSignal.timeout(8000) // 8s timeout
        };

        // Para POST requests, adicionar um payload de teste
        if (endpoint.method === 'POST') {
          requestOptions.body = JSON.stringify({
            instanceName: 'test_discovery',
            sessionName: 'test_discovery',
            name: 'test_discovery'
          });
        }

        const response = await fetch(`${VPS_CONFIG.baseUrl}${endpoint.path}`, requestOptions);
        const duration = Date.now() - startTime;
        
        let responseData = '';
        let isJson = false;
        
        try {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            responseData = JSON.stringify(await response.json());
            isJson = true;
          } else {
            responseData = await response.text();
          }
        } catch {
          responseData = 'Could not parse response';
        }

        const result = {
          endpoint: endpoint.path,
          method: endpoint.method,
          description: endpoint.description,
          priority: endpoint.priority,
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          duration,
          isJson,
          responseLength: responseData.length,
          responseSample: responseData.substring(0, 200),
          headers: Object.fromEntries(response.headers.entries()),
          timestamp: new Date().toISOString()
        };

        results.push(result);

        if (response.ok) {
          successCount++;
          console.log(`[VPS Discovery] ✅ ${endpoint.method} ${endpoint.path}: ${response.status}`);
        } else {
          errorCount++;
          console.log(`[VPS Discovery] ❌ ${endpoint.method} ${endpoint.path}: ${response.status} ${response.statusText}`);
        }

      } catch (error: any) {
        const duration = Date.now() - startTime;
        errorCount++;
        
        const result = {
          endpoint: endpoint.path,
          method: endpoint.method,
          description: endpoint.description,
          priority: endpoint.priority,
          status: 0,
          statusText: 'ERROR',
          success: false,
          duration,
          error: error.message,
          timestamp: new Date().toISOString()
        };

        results.push(result);
        console.log(`[VPS Discovery] 💥 ${endpoint.method} ${endpoint.path}: ${error.message}`);
      }
    }

    // Análise dos resultados
    const workingEndpoints = results.filter(r => r.success);
    const failedEndpoints = results.filter(r => !r.success);
    const creationCandidates = workingEndpoints.filter(r => 
      r.method === 'POST' && (
        r.endpoint.includes('instance') || 
        r.endpoint.includes('create') || 
        r.endpoint.includes('whatsapp') ||
        r.endpoint.includes('session')
      )
    );

    console.log(`[VPS Discovery] Descoberta concluída: ${successCount} sucessos, ${errorCount} falhas`);
    console.log(`[VPS Discovery] Endpoints funcionais encontrados: ${workingEndpoints.length}`);
    console.log(`[VPS Discovery] Candidatos para criação: ${creationCandidates.length}`);

    // Gerar recomendações
    const recommendations = [];
    
    if (creationCandidates.length > 0) {
      recommendations.push(`✅ Encontrados ${creationCandidates.length} endpoints candidatos para criação de instâncias`);
      creationCandidates.forEach(candidate => {
        recommendations.push(`🎯 Testar: ${candidate.method} ${candidate.endpoint} (${candidate.status}) - ${candidate.description}`);
      });
    } else {
      recommendations.push('❌ Nenhum endpoint de criação funcional encontrado');
      recommendations.push('🔍 Verificar documentação da VPS ou contatar suporte');
    }

    if (workingEndpoints.length > 2) {
      recommendations.push(`✅ VPS está funcionando - ${workingEndpoints.length} endpoints respondem corretamente`);
    }

    const discoveryResult = {
      success: true,
      summary: {
        totalTested: endpointsToTest.length,
        successCount,
        errorCount,
        workingEndpoints: workingEndpoints.length,
        creationCandidates: creationCandidates.length
      },
      workingEndpoints: workingEndpoints.map(e => ({
        endpoint: e.endpoint,
        method: e.method,
        status: e.status,
        description: e.description,
        isJson: e.isJson,
        priority: e.priority
      })),
      creationCandidates: creationCandidates.map(e => ({
        endpoint: e.endpoint,
        method: e.method,
        status: e.status,
        description: e.description,
        priority: e.priority,
        responseSample: e.responseSample
      })),
      failedEndpoints: failedEndpoints.map(e => ({
        endpoint: e.endpoint,
        method: e.method,
        status: e.status,
        error: e.error || e.statusText,
        priority: e.priority
      })),
      recommendations,
      fullResults: results,
      timestamp: new Date().toISOString(),
      vpsConfig: {
        host: VPS_CONFIG.host,
        port: VPS_CONFIG.port,
        tokenLength: VPS_CONFIG.authToken.length
      }
    };

    return new Response(JSON.stringify(discoveryResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[VPS Discovery] ❌ Erro geral:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
