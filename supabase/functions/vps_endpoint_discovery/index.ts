
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EndpointTest {
  endpoint: string;
  method: string;
  description: string;
  payload?: any;
  expected_status?: number[];
}

const VPS_HOST = '31.97.24.222';
const VPS_PORTS = [3001, 80, 8080, 3000, 9000, 5000];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[VPS Discovery] Starting comprehensive VPS endpoint discovery...');
    
    const results = {
      timestamp: new Date().toISOString(),
      vps_host: VPS_HOST,
      tested_ports: VPS_PORTS,
      discoveries: [] as any[],
      working_endpoints: [] as any[],
      recommended_config: null as any,
      whatsapp_structure: null as any
    };

    // Endpoints comuns para testar em cada porta
    const commonEndpoints: EndpointTest[] = [
      // Health/Status endpoints
      { endpoint: '/health', method: 'GET', description: 'Health check' },
      { endpoint: '/status', method: 'GET', description: 'Server status' },
      { endpoint: '/info', method: 'GET', description: 'Server info' },
      { endpoint: '/api/health', method: 'GET', description: 'API health' },
      { endpoint: '/api/status', method: 'GET', description: 'API status' },
      
      // WhatsApp Web.js specific
      { endpoint: '/create', method: 'POST', description: 'Create instance', payload: { instanceId: 'test', sessionName: 'test' } },
      { endpoint: '/create-instance', method: 'POST', description: 'Create instance alt', payload: { instanceName: 'test' } },
      { endpoint: '/instance/create', method: 'POST', description: 'Instance create', payload: { name: 'test' } },
      { endpoint: '/whatsapp/create', method: 'POST', description: 'WhatsApp create', payload: { instance: 'test' } },
      
      // QR Code endpoints
      { endpoint: '/qr', method: 'GET', description: 'Get QR code' },
      { endpoint: '/qr/test', method: 'GET', description: 'Get QR code with instance' },
      { endpoint: '/instance/qr', method: 'GET', description: 'Instance QR' },
      { endpoint: '/whatsapp/qr', method: 'GET', description: 'WhatsApp QR' },
      
      // Instance management
      { endpoint: '/instances', method: 'GET', description: 'List instances' },
      { endpoint: '/instance/list', method: 'GET', description: 'List instances alt' },
      { endpoint: '/whatsapp/instances', method: 'GET', description: 'WhatsApp instances' },
      
      // Delete endpoints
      { endpoint: '/delete', method: 'POST', description: 'Delete instance', payload: { instanceId: 'test' } },
      { endpoint: '/instance/delete', method: 'POST', description: 'Delete instance alt', payload: { name: 'test' } },
      { endpoint: '/whatsapp/delete', method: 'POST', description: 'WhatsApp delete', payload: { instance: 'test' } },
      
      // Evolution API compatibility
      { endpoint: '/instance/create', method: 'POST', description: 'Evolution create', payload: { instanceName: 'test' } },
      { endpoint: '/instance/connect/test', method: 'GET', description: 'Evolution connect' },
      { endpoint: '/instance/qrcode/test', method: 'GET', description: 'Evolution QR' },
      { endpoint: '/instance/logout/test', method: 'DELETE', description: 'Evolution logout' },
      
      // Common patterns
      { endpoint: '/', method: 'GET', description: 'Root endpoint' },
      { endpoint: '/api', method: 'GET', description: 'API root' },
      { endpoint: '/docs', method: 'GET', description: 'Documentation' },
      { endpoint: '/swagger', method: 'GET', description: 'Swagger docs' }
    ];

    console.log(`[VPS Discovery] Testing ${VPS_PORTS.length} ports with ${commonEndpoints.length} endpoints each...`);

    // Testar cada porta
    for (const port of VPS_PORTS) {
      const baseUrl = `http://${VPS_HOST}:${port}`;
      console.log(`[VPS Discovery] Testing port ${port}...`);
      
      const portResults = {
        port,
        baseUrl,
        responding: false,
        endpoints: [] as any[],
        server_info: null as any
      };

      // Teste básico de conectividade
      try {
        const healthResponse = await fetch(`${baseUrl}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        
        portResults.responding = true;
        console.log(`[VPS Discovery] Port ${port} is responding!`);
        
        // Se responde, testar todos os endpoints
        for (const test of commonEndpoints) {
          try {
            const testUrl = `${baseUrl}${test.endpoint}`;
            console.log(`[VPS Discovery] Testing ${test.method} ${testUrl}`);
            
            const response = await fetch(testUrl, {
              method: test.method,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer default-token'
              },
              body: test.payload ? JSON.stringify(test.payload) : undefined,
              signal: AbortSignal.timeout(8000)
            });

            let responseData = null;
            let responseText = '';
            
            try {
              responseText = await response.text();
              responseData = JSON.parse(responseText);
            } catch {
              responseData = responseText;
            }

            const endpointResult = {
              endpoint: test.endpoint,
              method: test.method,
              description: test.description,
              status: response.status,
              success: response.ok,
              response_data: responseData,
              response_headers: Object.fromEntries(response.headers),
              content_type: response.headers.get('content-type'),
              working: response.status < 400 && response.status !== 404
            };

            portResults.endpoints.push(endpointResult);

            if (endpointResult.working) {
              results.working_endpoints.push({
                ...endpointResult,
                full_url: testUrl,
                port
              });
              console.log(`[VPS Discovery] ✅ Working: ${test.method} ${testUrl} (${response.status})`);
            } else {
              console.log(`[VPS Discovery] ❌ Failed: ${test.method} ${testUrl} (${response.status})`);
            }

          } catch (error) {
            console.log(`[VPS Discovery] ⚠️ Error testing ${test.endpoint}: ${error.message}`);
            portResults.endpoints.push({
              endpoint: test.endpoint,
              method: test.method,
              description: test.description,
              status: 0,
              success: false,
              error: error.message,
              working: false
            });
          }
        }

        // Tentar obter informações do servidor
        try {
          const infoResponse = await fetch(`${baseUrl}/status`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
          });
          
          if (infoResponse.ok) {
            const infoData = await infoResponse.json();
            portResults.server_info = infoData;
          }
        } catch (error) {
          console.log(`[VPS Discovery] Could not get server info for port ${port}: ${error.message}`);
        }

      } catch (error) {
        console.log(`[VPS Discovery] Port ${port} not responding: ${error.message}`);
      }

      results.discoveries.push(portResults);
    }

    // Analisar resultados e criar recomendações
    const workingPorts = results.discoveries.filter(d => d.responding);
    const workingEndpoints = results.working_endpoints;

    console.log(`[VPS Discovery] Found ${workingPorts.length} responding ports and ${workingEndpoints.length} working endpoints`);

    // Identificar padrões para WhatsApp
    const whatsappPatterns = {
      create_endpoints: workingEndpoints.filter(e => 
        e.endpoint.includes('create') && e.method === 'POST'
      ),
      qr_endpoints: workingEndpoints.filter(e => 
        e.endpoint.includes('qr') && e.method === 'GET'
      ),
      list_endpoints: workingEndpoints.filter(e => 
        (e.endpoint.includes('instance') || e.endpoint.includes('list')) && e.method === 'GET'
      ),
      delete_endpoints: workingEndpoints.filter(e => 
        e.endpoint.includes('delete') && (e.method === 'POST' || e.method === 'DELETE')
      ),
      status_endpoints: workingEndpoints.filter(e => 
        (e.endpoint.includes('status') || e.endpoint.includes('health')) && e.method === 'GET'
      )
    };

    results.whatsapp_structure = whatsappPatterns;

    // Criar configuração recomendada
    if (workingPorts.length > 0) {
      const bestPort = workingPorts[0];
      const baseUrl = bestPort.baseUrl;
      
      results.recommended_config = {
        baseUrl,
        port: bestPort.port,
        endpoints: {
          health: whatsappPatterns.status_endpoints[0]?.endpoint || '/health',
          create: whatsappPatterns.create_endpoints[0]?.endpoint || '/create',
          qr: whatsappPatterns.qr_endpoints[0]?.endpoint || '/qr',
          instances: whatsappPatterns.list_endpoints[0]?.endpoint || '/instances',
          delete: whatsappPatterns.delete_endpoints[0]?.endpoint || '/delete'
        },
        payload_format: {
          create: whatsappPatterns.create_endpoints[0]?.response_data || 'unknown',
          delete: whatsappPatterns.delete_endpoints[0]?.response_data || 'unknown'
        },
        server_type: 'unknown'
      };

      // Tentar identificar tipo de servidor
      if (bestPort.server_info) {
        if (bestPort.server_info.server?.includes('whatsapp-web.js')) {
          results.recommended_config.server_type = 'whatsapp-web.js';
        } else if (bestPort.server_info.server?.includes('evolution')) {
          results.recommended_config.server_type = 'evolution-api';
        }
      }
    }

    console.log('[VPS Discovery] Discovery complete!');
    console.log(`[VPS Discovery] Working endpoints found: ${workingEndpoints.length}`);
    console.log(`[VPS Discovery] Recommended config:`, results.recommended_config);

    return new Response(
      JSON.stringify({
        success: true,
        data: results,
        summary: {
          total_ports_tested: VPS_PORTS.length,
          responding_ports: workingPorts.length,
          working_endpoints: workingEndpoints.length,
          recommended_base_url: results.recommended_config?.baseUrl,
          next_steps: [
            'Review the working endpoints',
            'Update VPS_CONFIG with recommended settings',
            'Test the recommended endpoints',
            'Update instance management code'
          ]
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('[VPS Discovery] Error:', error);
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
