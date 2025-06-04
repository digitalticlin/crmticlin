
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
    console.log('[VPS Endpoint Discovery] 🔍 Iniciando descoberta de endpoints (FASE 3)');

    // CORREÇÃO FASE 3: VPS Configuration com token correto
    const VPS_CONFIG = {
      host: '31.97.24.222',
      port: '3001',
      get baseUrl() {
        return `http://${this.host}:${this.port}`;
      },
      // CORREÇÃO FASE 3: Usar token que VPS espera conforme descoberto via SSH
      authToken: 'default-token'
    };

    const getVPSHeaders = () => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
      'User-Agent': 'Supabase-VPS-Discovery/3.0-FASE3',
      'Accept': 'application/json'
    });

    // CORREÇÃO FASE 3: Lista de endpoints baseada na descoberta SSH
    const endpointsToTest: EndpointTest[] = [
      // Endpoints CONFIRMADOS que funcionam (via SSH)
      { path: '/health', method: 'GET', description: 'Health Check', priority: 'high' },
      { path: '/status', method: 'GET', description: 'Status Check', priority: 'high' },
      { path: '/instances', method: 'GET', description: 'List Instances', priority: 'high' },
      { path: '/', method: 'GET', description: 'Root endpoint', priority: 'high' },
      
      // Endpoints CONFIRMADOS para operações (via SSH)
      { path: '/instance/create', method: 'POST', description: 'Create Instance (CONFIRMED)', priority: 'high' },
      { path: '/instance/delete', method: 'POST', description: 'Delete Instance (CONFIRMED)', priority: 'high' },
      { path: '/instance/status', method: 'POST', description: 'Instance Status (CONFIRMED)', priority: 'high' },
      { path: '/instance/qr', method: 'POST', description: 'Get QR Code (CONFIRMED)', priority: 'high' },
      
      // Endpoints que NÃO funcionam (confirmado via SSH) - teste para documentar
      { path: '/instances', method: 'POST', description: 'Create via /instances (BROKEN)', priority: 'low' },
      { path: '/whatsapp/create', method: 'POST', description: 'WhatsApp Create (BROKEN)', priority: 'low' },
      { path: '/session/create', method: 'POST', description: 'Session Create (BROKEN)', priority: 'low' },
      { path: '/docs', method: 'GET', description: 'Documentation (BROKEN)', priority: 'low' },
      { path: '/api', method: 'GET', description: 'API Info (BROKEN)', priority: 'low' },
    ];

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    console.log(`[VPS Discovery] Testando ${endpointsToTest.length} endpoints (FASE 3)...`);

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
            instanceName: 'test_discovery_fase3',
            sessionName: 'test_discovery_fase3',
            instanceId: 'test_discovery_fase3'
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
        r.endpoint.includes('create')
      )
    );

    console.log(`[VPS Discovery] Descoberta FASE 3 concluída: ${successCount} sucessos, ${errorCount} falhas`);
    console.log(`[VPS Discovery] Endpoints funcionais encontrados: ${workingEndpoints.length}`);
    console.log(`[VPS Discovery] Candidatos para criação: ${creationCandidates.length}`);

    // Gerar recomendações FASE 3
    const recommendations = [];
    
    if (creationCandidates.length > 0) {
      recommendations.push(`✅ FASE 3: Encontrados ${creationCandidates.length} endpoints para criação de instâncias`);
      creationCandidates.forEach(candidate => {
        recommendations.push(`🎯 CONFIRMADO: ${candidate.method} ${candidate.endpoint} (${candidate.status}) - ${candidate.description}`);
      });
    } else {
      recommendations.push('❌ Nenhum endpoint de criação funcional encontrado');
    }

    if (workingEndpoints.length > 2) {
      recommendations.push(`✅ FASE 3: VPS está funcionando - ${workingEndpoints.length} endpoints respondem corretamente`);
      recommendations.push(`🔧 FASE 3: Token de autenticação correto: ${VPS_CONFIG.authToken}`);
    }

    // Endpoints específicos confirmados via SSH
    const confirmedEndpoints = workingEndpoints.filter(e => 
      ['/health', '/status', '/instances', '/instance/create'].includes(e.endpoint)
    );
    
    if (confirmedEndpoints.length >= 4) {
      recommendations.push('✅ FASE 3: Todos endpoints essenciais confirmados via SSH estão funcionando');
    }

    const discoveryResult = {
      success: true,
      phase: 'FASE_3_IMPLEMENTED',
      summary: {
        totalTested: endpointsToTest.length,
        successCount,
        errorCount,
        workingEndpoints: workingEndpoints.length,
        creationCandidates: creationCandidates.length,
        confirmedViaSSH: confirmedEndpoints.length
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
        tokenConfigured: VPS_CONFIG.authToken
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
      phase: 'FASE_3_ERROR',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
