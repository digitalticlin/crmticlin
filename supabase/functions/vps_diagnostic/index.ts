
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiagnosticRequest {
  test: 'edge_function' | 'vps_connectivity' | 'vps_auth' | 'vps_services' | 'full_flow';
  vpsAction?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[VPS Diagnostic] 🔍 Iniciando diagnóstico');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Capturar o token original do usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    console.log('[VPS Diagnostic] 🔐 Token de usuário capturado para repasse');

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { test, vpsAction }: DiagnosticRequest = await req.json();
    console.log(`[VPS Diagnostic] 🎯 Teste: ${test}`);

    const results: any = {
      test,
      timestamp: new Date().toISOString(),
      success: false,
      details: {},
      errors: [],
      recommendations: []
    };

    switch (test) {
      case 'edge_function':
        results.details = await testEdgeFunction();
        break;
      
      case 'vps_connectivity':
        results.details = await testVPSConnectivity();
        break;
      
      case 'vps_auth':
        results.details = await testVPSAuthentication();
        break;
      
      case 'vps_services':
        results.details = await testVPSServices();
        break;
      
      case 'full_flow':
        console.log('[VPS Diagnostic] 🔄 Chamando whatsapp_web_server com token do usuário');
        results.details = await testFullFlow(vpsAction || 'check_server', authHeader);
        break;
      
      default:
        throw new Error(`Teste desconhecido: ${test}`);
    }

    results.success = results.details.success || false;
    
    // Adicionar recomendações baseadas nos resultados
    addRecommendations(results);

    console.log(`[VPS Diagnostic] ✅ Teste ${test} concluído:`, results.success ? 'SUCESSO' : 'FALHA');

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[VPS Diagnostic] ❌ Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function testEdgeFunction() {
  console.log('[VPS Diagnostic] 🧪 Testando Edge Function...');
  
  const startTime = Date.now();
  const result = {
    success: true,
    duration: 0,
    environment: {},
    secrets: {},
    network: {}
  };

  try {
    // Verificar variáveis de ambiente
    result.environment = {
      supabase_url: !!Deno.env.get('SUPABASE_URL'),
      supabase_service_role: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      deployment_region: Deno.env.get('DENO_REGION') || 'unknown'
    };

    // Verificar secrets VPS
    result.secrets = {
      vps_host: !!Deno.env.get('VPS_HOST'),
      vps_port: !!Deno.env.get('VPS_PORT'),
      vps_api_token: !!Deno.env.get('VPS_API_TOKEN'),
      vps_ssh_key: !!Deno.env.get('VPS_SSH_PRIVATE_KEY')
    };

    // Teste básico de rede
    try {
      const response = await fetch('https://httpbin.org/get', { 
        signal: AbortSignal.timeout(5000) 
      });
      result.network.external_connectivity = response.ok;
    } catch {
      result.network.external_connectivity = false;
    }

    result.duration = Date.now() - startTime;
    
    console.log('[VPS Diagnostic] ✅ Edge Function funcionando');
    return result;

  } catch (error) {
    result.success = false;
    result.error = error.message;
    result.duration = Date.now() - startTime;
    
    console.error('[VPS Diagnostic] ❌ Edge Function com problemas:', error);
    return result;
  }
}

async function testVPSConnectivity() {
  console.log('[VPS Diagnostic] 🌐 Testando conectividade VPS...');
  
  const startTime = Date.now();
  const vpsHost = Deno.env.get('VPS_HOST') || '31.97.24.222';
  const vpsPort = Deno.env.get('VPS_PORT') || '3001';
  const baseUrl = `http://${vpsHost}:${vpsPort}`;

  const result = {
    success: false,
    duration: 0,
    vps_config: { host: vpsHost, port: vpsPort, baseUrl },
    connectivity: {},
    dns_resolution: {},
    port_accessibility: {}
  };

  try {
    // Teste 1: Resolução DNS
    try {
      const dnsStart = Date.now();
      await fetch(`http://${vpsHost}`, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(3000) 
      });
      result.dns_resolution = {
        success: true,
        duration: Date.now() - dnsStart
      };
    } catch (error) {
      result.dns_resolution = {
        success: false,
        error: error.message
      };
    }

    // Teste 2: Conectividade na porta específica
    try {
      const portStart = Date.now();
      const response = await fetch(baseUrl, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) 
      });
      
      result.port_accessibility = {
        success: true,
        status: response.status,
        duration: Date.now() - portStart
      };
    } catch (error) {
      result.port_accessibility = {
        success: false,
        error: error.message
      };
    }

    // Teste 3: Endpoint de health check
    try {
      const healthStart = Date.now();
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });
      
      result.connectivity = {
        success: response.ok,
        status: response.status,
        duration: Date.now() - healthStart,
        response_headers: Object.fromEntries(response.headers.entries())
      };

      if (response.ok) {
        try {
          const body = await response.text();
          result.connectivity.response_body = body.substring(0, 500);
        } catch {}
      }
    } catch (error) {
      result.connectivity = {
        success: false,
        error: error.message
      };
    }

    result.success = result.connectivity.success || false;
    result.duration = Date.now() - startTime;

    console.log('[VPS Diagnostic] 📊 Conectividade testada:', result.success ? 'OK' : 'FALHA');
    return result;

  } catch (error) {
    result.success = false;
    result.error = error.message;
    result.duration = Date.now() - startTime;
    
    console.error('[VPS Diagnostic] ❌ Erro na conectividade:', error);
    return result;
  }
}

async function testVPSAuthentication() {
  console.log('[VPS Diagnostic] 🔐 Testando autenticação VPS...');
  
  const startTime = Date.now();
  const vpsHost = Deno.env.get('VPS_HOST') || '31.97.24.222';
  const vpsPort = Deno.env.get('VPS_PORT') || '3001';
  const apiToken = Deno.env.get('VPS_API_TOKEN') || 'default-token';
  const baseUrl = `http://${vpsHost}:${vpsPort}`;

  const result = {
    success: false,
    duration: 0,
    auth_config: {
      has_token: !!apiToken,
      token_length: apiToken.length,
      token_preview: `${apiToken.substring(0, 8)}...`
    },
    auth_test: {}
  };

  try {
    // Teste de autenticação com endpoint protegido
    const response = await fetch(`${baseUrl}/instances`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });

    result.auth_test = {
      success: response.ok,
      status: response.status,
      status_text: response.statusText,
      response_headers: Object.fromEntries(response.headers.entries())
    };

    if (response.ok) {
      try {
        const body = await response.text();
        result.auth_test.response_body = body.substring(0, 200);
      } catch {}
    } else {
      try {
        const errorBody = await response.text();
        result.auth_test.error_body = errorBody;
      } catch {}
    }

    result.success = response.ok;
    result.duration = Date.now() - startTime;

    console.log('[VPS Diagnostic] 🔑 Autenticação testada:', result.success ? 'OK' : 'FALHA');
    return result;

  } catch (error) {
    result.success = false;
    result.error = error.message;
    result.duration = Date.now() - startTime;
    
    console.error('[VPS Diagnostic] ❌ Erro na autenticação:', error);
    return result;
  }
}

async function testVPSServices() {
  console.log('[VPS Diagnostic] ⚙️ Testando serviços VPS...');
  
  const startTime = Date.now();
  const vpsHost = Deno.env.get('VPS_HOST') || '31.97.24.222';
  const vpsPort = Deno.env.get('VPS_PORT') || '3001';
  const apiToken = Deno.env.get('VPS_API_TOKEN') || 'default-token';
  const baseUrl = `http://${vpsHost}:${vpsPort}`;

  const result = {
    success: false,
    duration: 0,
    services: {}
  };

  const endpoints = [
    { name: 'health', path: '/health', method: 'GET' },
    { name: 'server_info', path: '/server/info', method: 'GET' },
    { name: 'instances', path: '/instances', method: 'GET' },
    { name: 'status', path: '/status', method: 'GET' }
  ];

  try {
    for (const endpoint of endpoints) {
      try {
        const endpointStart = Date.now();
        const response = await fetch(`${baseUrl}${endpoint.path}`, {
          method: endpoint.method,
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(8000)
        });

        result.services[endpoint.name] = {
          success: response.ok,
          status: response.status,
          duration: Date.now() - endpointStart
        };

        if (response.ok) {
          try {
            const body = await response.text();
            result.services[endpoint.name].response_preview = body.substring(0, 100);
          } catch {}
        }
      } catch (error) {
        result.services[endpoint.name] = {
          success: false,
          error: error.message
        };
      }
    }

    // Determinar sucesso geral
    const successfulServices = Object.values(result.services).filter((s: any) => s.success).length;
    result.success = successfulServices > 0;
    result.duration = Date.now() - startTime;

    console.log('[VPS Diagnostic] ⚙️ Serviços testados:', `${successfulServices}/${endpoints.length} OK`);
    return result;

  } catch (error) {
    result.success = false;
    result.error = error.message;
    result.duration = Date.now() - startTime;
    
    console.error('[VPS Diagnostic] ❌ Erro nos serviços:', error);
    return result;
  }
}

async function testFullFlow(action: string, userAuthHeader: string) {
  console.log(`[VPS Diagnostic] 🔄 Testando fluxo completo: ${action}`);
  
  const startTime = Date.now();
  const result = {
    success: false,
    duration: 0,
    action,
    edge_function_call: {},
    flow_steps: []
  };

  try {
    // Criar cliente Supabase usando token do usuário (não SERVICE_ROLE)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            'Authorization': userAuthHeader
          }
        }
      }
    );

    result.flow_steps.push({ step: 'edge_function_invocation', timestamp: new Date().toISOString() });

    console.log('[VPS Diagnostic] 📞 Chamando whatsapp_web_server com token do usuário...');

    const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
      body: {
        action,
        instanceData: action === 'get_status' ? { instanceId: 'test' } : {}
      }
    });

    result.edge_function_call = {
      success: !error,
      data,
      error: error?.message
    };

    result.flow_steps.push({ 
      step: 'edge_function_response', 
      timestamp: new Date().toISOString(),
      success: !error
    });

    result.success = !error;
    result.duration = Date.now() - startTime;

    console.log('[VPS Diagnostic] 🔄 Fluxo completo testado:', result.success ? 'OK' : 'FALHA');
    return result;

  } catch (error) {
    result.success = false;
    result.error = error.message;
    result.duration = Date.now() - startTime;
    
    console.error('[VPS Diagnostic] ❌ Erro no fluxo completo:', error);
    return result;
  }
}

function addRecommendations(results: any) {
  results.recommendations = [];

  if (results.test === 'edge_function') {
    if (!results.details.secrets.vps_api_token) {
      results.recommendations.push('Configurar VPS_API_TOKEN nas secrets do Supabase');
    }
    if (!results.details.network.external_connectivity) {
      results.recommendations.push('Verificar conectividade de rede da Edge Function');
    }
  }

  if (results.test === 'vps_connectivity') {
    if (!results.details.dns_resolution.success) {
      results.recommendations.push('Verificar resolução DNS do host VPS');
    }
    if (!results.details.port_accessibility.success) {
      results.recommendations.push('Verificar se a porta VPS está acessível externamente');
    }
    if (!results.details.connectivity.success) {
      results.recommendations.push('Verificar se o serviço WhatsApp está rodando na VPS');
    }
  }

  if (results.test === 'vps_auth') {
    if (!results.details.success) {
      results.recommendations.push('Verificar token de autenticação VPS');
      results.recommendations.push('Confirmar se o token está configurado corretamente na VPS');
    }
  }

  if (results.test === 'vps_services') {
    const failedServices = Object.entries(results.details.services)
      .filter(([_, service]: [string, any]) => !service.success)
      .map(([name, _]) => name);
    
    if (failedServices.length > 0) {
      results.recommendations.push(`Verificar serviços com falha: ${failedServices.join(', ')}`);
    }
  }

  if (results.test === 'full_flow') {
    if (!results.details.success) {
      results.recommendations.push('Executar testes individuais para identificar o problema');
      results.recommendations.push('Verificar logs da Edge Function whatsapp_web_server');
    }
  }
}
