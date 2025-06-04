
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiagnosticRequest {
  test: 'edge_function' | 'vps_connectivity' | 'vps_auth' | 'vps_services' | 'full_flow' | 'update_token';
  vpsAction?: string;
  newToken?: string;
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

    const { test, vpsAction, newToken }: DiagnosticRequest = await req.json();
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
      case 'update_token':
        results.details = await updateVPSToken(newToken);
        break;
        
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

async function updateVPSToken(newToken: string) {
  console.log('[VPS Diagnostic] 🔑 Atualizando VPS_API_TOKEN secret...');
  
  if (!newToken) {
    throw new Error('Token não fornecido');
  }

  const result = {
    success: false,
    message: '',
    token_preview: `${newToken.substring(0, 10)}...`,
    timestamp: new Date().toISOString()
  };

  try {
    // Simular atualização do secret (na prática seria via Supabase Management API)
    // Por enquanto, vamos apenas validar o formato do token
    if (newToken.startsWith('wapp_') && newToken.length > 20) {
      result.success = true;
      result.message = 'Token validado e configurado com sucesso (simulado)';
      
      console.log('[VPS Diagnostic] ✅ Token VPS_API_TOKEN configurado:', result.token_preview);
    } else {
      throw new Error('Formato de token inválido. Deve começar com "wapp_" e ter pelo menos 20 caracteres.');
    }

    return result;

  } catch (error) {
    result.success = false;
    result.message = error.message;
    
    console.error('[VPS Diagnostic] ❌ Erro ao atualizar token:', error);
    return result;
  }
}

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
  const apiToken = Deno.env.get('VPS_API_TOKEN') || 'wapp_TYXt5I3uIewmPts4EosF8M5DjbkyP0h4';
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
  const apiToken = Deno.env.get('VPS_API_TOKEN') || 'wapp_TYXt5I3uIewmPts4EosF8M5DjbkyP0h4';
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

    // Calcular sucesso geral
    const serviceResults = Object.values(result.services);
    const successCount = serviceResults.filter((s: any) => s.success).length;
    result.success = successCount > 0; // Pelo menos um serviço deve funcionar
    result.duration = Date.now() - startTime;

    console.log('[VPS Diagnostic] ⚙️ Serviços testados:', `${successCount}/${serviceResults.length} OK`);
    return result;

  } catch (error) {
    result.success = false;
    result.error = error.message;
    result.duration = Date.now() - startTime;
    
    console.error('[VPS Diagnostic] ❌ Erro nos serviços:', error);
    return result;
  }
}

async function testFullFlow(vpsAction: string, authHeader: string) {
  console.log('[VPS Diagnostic] 🔄 Testando fluxo completo via whatsapp_web_server...');
  
  const startTime = Date.now();
  const result = {
    success: false,
    duration: 0,
    vps_action: vpsAction,
    response: {}
  };

  try {
    // Chamar whatsapp_web_server edge function
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/whatsapp_web_server`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: vpsAction
      }),
      signal: AbortSignal.timeout(15000)
    });

    result.response = {
      success: response.ok,
      status: response.status,
      status_text: response.statusText
    };

    if (response.ok) {
      try {
        const body = await response.json();
        result.response.data = body;
        result.success = true;
      } catch {
        const text = await response.text();
        result.response.text = text.substring(0, 200);
        result.success = true;
      }
    } else {
      try {
        const errorBody = await response.text();
        result.response.error_body = errorBody;
      } catch {}
    }

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
  if (!results.success) {
    switch (results.test) {
      case 'edge_function':
        results.recommendations.push('Verificar configuração da Edge Function no Supabase');
        results.recommendations.push('Confirmar se todos os secrets estão configurados');
        break;
      case 'vps_connectivity':
        results.recommendations.push('Verificar se a VPS está online e acessível');
        results.recommendations.push('Confirmar configuração de firewall na VPS');
        break;
      case 'vps_auth':
        results.recommendations.push('Verificar se o token VPS_API_TOKEN está correto');
        results.recommendations.push('Confirmar se o token no servidor VPS corresponde ao configurado');
        break;
      case 'vps_services':
        results.recommendations.push('Verificar se o servidor WhatsApp Web.js está rodando');
        results.recommendations.push('Reiniciar serviços na VPS se necessário');
        break;
      case 'full_flow':
        results.recommendations.push('Verificar integração entre Edge Functions');
        results.recommendations.push('Confirmar configuração de autenticação');
        break;
    }
  }
}
