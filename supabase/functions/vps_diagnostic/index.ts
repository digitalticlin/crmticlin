
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiagnosticRequest {
  test: 'edge_function' | 'vps_connectivity' | 'vps_auth' | 'vps_services' | 'full_flow' | 'update_token' | 'comprehensive_health';
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
      case 'comprehensive_health':
        results.details = await runComprehensiveHealth();
        break;
        
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

async function runComprehensiveHealth() {
  console.log('[VPS Diagnostic] 🏥 Executando diagnóstico de saúde abrangente...');
  
  const startTime = Date.now();
  const result = {
    success: false,
    duration: 0,
    tests: {},
    summary: {},
    overall_status: 'unknown'
  };

  try {
    // Executar todos os testes em paralelo para melhor performance
    const [
      edgeResult,
      connectivityResult,
      authResult,
      servicesResult
    ] = await Promise.allSettled([
      testEdgeFunction(),
      testVPSConnectivity(),
      testVPSAuthentication(),
      testVPSServices()
    ]);

    result.tests = {
      edge_function: edgeResult.status === 'fulfilled' ? edgeResult.value : { success: false, error: edgeResult.reason?.message },
      connectivity: connectivityResult.status === 'fulfilled' ? connectivityResult.value : { success: false, error: connectivityResult.reason?.message },
      authentication: authResult.status === 'fulfilled' ? authResult.value : { success: false, error: authResult.reason?.message },
      services: servicesResult.status === 'fulfilled' ? servicesResult.value : { success: false, error: servicesResult.reason?.message }
    };

    // Calcular métricas de saúde
    const successfulTests = Object.values(result.tests).filter((test: any) => test.success).length;
    const totalTests = Object.keys(result.tests).length;
    const healthPercentage = (successfulTests / totalTests) * 100;

    result.summary = {
      successful_tests: successfulTests,
      total_tests: totalTests,
      health_percentage: Math.round(healthPercentage),
      failed_tests: totalTests - successfulTests
    };

    // Determinar status geral
    if (healthPercentage >= 90) {
      result.overall_status = 'excellent';
      result.success = true;
    } else if (healthPercentage >= 70) {
      result.overall_status = 'good';
      result.success = true;
    } else if (healthPercentage >= 50) {
      result.overall_status = 'warning';
      result.success = false;
    } else {
      result.overall_status = 'critical';
      result.success = false;
    }

    result.duration = Date.now() - startTime;
    
    console.log(`[VPS Diagnostic] 🏥 Saúde abrangente: ${result.overall_status} (${healthPercentage}%)`);
    
    return result;

  } catch (error) {
    result.success = false;
    result.error = error.message;
    result.duration = Date.now() - startTime;
    
    console.error('[VPS Diagnostic] ❌ Erro na saúde abrangente:', error);
    return result;
  }
}

async function updateVPSToken(newToken: string) {
  console.log('[VPS Diagnostic] 🔑 Atualizando VPS_API_TOKEN secret...');
  
  if (!newToken) {
    throw new Error('Token não fornecido');
  }

  const result = {
    success: false,
    message: '',
    token_preview: `${newToken.substring(0, 10)}...`,
    timestamp: new Date().toISOString(),
    validation: {}
  };

  try {
    // Validação mais robusta do token
    result.validation = {
      format_check: newToken.startsWith('wapp_'),
      length_check: newToken.length > 20,
      no_spaces: !newToken.includes(' '),
      alphanumeric: /^[a-zA-Z0-9_]+$/.test(newToken)
    };

    const isValidToken = Object.values(result.validation).every(check => check === true);

    if (isValidToken) {
      result.success = true;
      result.message = 'Token validado e configurado com sucesso (simulado)';
      
      console.log('[VPS Diagnostic] ✅ Token VPS_API_TOKEN configurado:', result.token_preview);
    } else {
      throw new Error('Token inválido. Deve começar com "wapp_", ter pelo menos 20 caracteres e ser alfanumérico.');
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
    network: {},
    performance: {}
  };

  try {
    // Verificar variáveis de ambiente críticas
    result.environment = {
      supabase_url: !!Deno.env.get('SUPABASE_URL'),
      supabase_service_role: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      deployment_region: Deno.env.get('DENO_REGION') || 'unknown',
      deno_version: Deno.version.deno
    };

    // Verificar secrets VPS
    result.secrets = {
      vps_host: !!Deno.env.get('VPS_HOST'),
      vps_port: !!Deno.env.get('VPS_PORT'), 
      vps_api_token: !!Deno.env.get('VPS_API_TOKEN'),
      vps_ssh_key: !!Deno.env.get('VPS_SSH_PRIVATE_KEY'),
      hostinger_token: !!Deno.env.get('HOSTINGER_API_TOKEN')
    };

    // Teste de conectividade externa
    const networkStartTime = Date.now();
    try {
      const response = await fetch('https://httpbin.org/get', { 
        signal: AbortSignal.timeout(5000) 
      });
      result.network = {
        external_connectivity: response.ok,
        response_time: Date.now() - networkStartTime,
        status: response.status
      };
    } catch (networkError) {
      result.network = {
        external_connectivity: false,
        error: networkError.message,
        response_time: Date.now() - networkStartTime
      };
    }

    // Métricas de performance
    result.performance = {
      memory_usage: Deno.memoryUsage(),
      startup_time: Date.now() - startTime
    };

    result.duration = Date.now() - startTime;
    
    // Verificar se todos os componentes críticos estão OK
    const criticalChecks = [
      result.environment.supabase_url,
      result.environment.supabase_service_role,
      result.secrets.vps_api_token,
      result.network.external_connectivity
    ];

    result.success = criticalChecks.every(check => check === true);
    
    console.log('[VPS Diagnostic] ✅ Edge Function testada:', result.success ? 'OK' : 'PROBLEMAS');
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
    port_accessibility: {},
    response_analysis: {}
  };

  try {
    // Teste 1: Resolução DNS melhorada
    try {
      const dnsStart = Date.now();
      const dnsResponse = await fetch(`http://${vpsHost}`, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(3000) 
      });
      result.dns_resolution = {
        success: true,
        duration: Date.now() - dnsStart,
        reachable: true
      };
    } catch (error) {
      result.dns_resolution = {
        success: false,
        error: error.message,
        reachable: false
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
        duration: Date.now() - portStart,
        headers_count: response.headers ? Array.from(response.headers.keys()).length : 0
      };
    } catch (error) {
      result.port_accessibility = {
        success: false,
        error: error.message
      };
    }

    // Teste 3: Endpoint de health check aprimorado
    try {
      const healthStart = Date.now();
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });
      
      const responseTime = Date.now() - healthStart;
      
      result.connectivity = {
        success: response.ok,
        status: response.status,
        duration: responseTime,
        response_headers: Object.fromEntries(response.headers.entries())
      };

      // Análise detalhada da resposta
      if (response.ok) {
        try {
          const contentType = response.headers.get('content-type');
          const body = await response.text();
          
          result.response_analysis = {
            content_type: contentType,
            body_length: body.length,
            contains_json: contentType?.includes('application/json'),
            body_preview: body.substring(0, 200)
          };
          
          result.connectivity.response_body = body.substring(0, 500);
        } catch (parseError) {
          result.response_analysis = {
            parse_error: parseError.message
          };
        }
      }
    } catch (error) {
      result.connectivity = {
        success: false,
        error: error.message
      };
    }

    // Avaliação geral da conectividade
    const connectivityScore = [
      result.dns_resolution.success,
      result.port_accessibility.success,
      result.connectivity.success
    ].filter(Boolean).length;

    result.success = connectivityScore >= 2; // Pelo menos 2 de 3 testes devem passar
    result.duration = Date.now() - startTime;

    console.log('[VPS Diagnostic] 📊 Conectividade testada:', result.success ? 'OK' : 'FALHA', `(${connectivityScore}/3)`);
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
      token_preview: `${apiToken.substring(0, 8)}...`,
      token_format_valid: apiToken.startsWith('wapp_')
    },
    auth_test: {},
    endpoints_tested: []
  };

  try {
    // Testar múltiplos endpoints autenticados
    const endpoints = [
      { path: '/instances', name: 'instances' },
      { path: '/status', name: 'status' },
      { path: '/server/info', name: 'server_info' }
    ];

    for (const endpoint of endpoints) {
      try {
        const endpointStart = Date.now();
        const response = await fetch(`${baseUrl}${endpoint.path}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(8000)
        });

        const endpointResult = {
          name: endpoint.name,
          success: response.ok,
          status: response.status,
          duration: Date.now() - endpointStart,
          response_headers: Object.fromEntries(response.headers.entries())
        };

        if (response.ok) {
          try {
            const body = await response.text();
            endpointResult.response_preview = body.substring(0, 100);
            endpointResult.response_size = body.length;
          } catch {}
        } else {
          try {
            const errorBody = await response.text();
            endpointResult.error_body = errorBody.substring(0, 200);
          } catch {}
        }

        result.endpoints_tested.push(endpointResult);

      } catch (endpointError) {
        result.endpoints_tested.push({
          name: endpoint.name,
          success: false,
          error: endpointError.message
        });
      }
    }

    // Avaliar sucesso geral da autenticação
    const successfulEndpoints = result.endpoints_tested.filter(e => e.success).length;
    result.success = successfulEndpoints > 0; // Pelo menos 1 endpoint deve funcionar

    result.auth_test = {
      successful_endpoints: successfulEndpoints,
      total_endpoints: result.endpoints_tested.length,
      success_rate: `${Math.round((successfulEndpoints / result.endpoints_tested.length) * 100)}%`
    };

    result.duration = Date.now() - startTime;

    console.log('[VPS Diagnostic] 🔑 Autenticação testada:', result.success ? 'OK' : 'FALHA', result.auth_test.success_rate);
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
    services: {},
    service_summary: {}
  };

  const endpoints = [
    { name: 'health', path: '/health', method: 'GET', priority: 'critical' },
    { name: 'server_info', path: '/server/info', method: 'GET', priority: 'high' },
    { name: 'instances', path: '/instances', method: 'GET', priority: 'high' },
    { name: 'status', path: '/status', method: 'GET', priority: 'medium' },
    { name: 'webhooks', path: '/webhooks', method: 'GET', priority: 'low' }
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
          duration: Date.now() - endpointStart,
          priority: endpoint.priority,
          available: true
        };

        if (response.ok) {
          try {
            const body = await response.text();
            result.services[endpoint.name].response_preview = body.substring(0, 100);
            result.services[endpoint.name].response_size = body.length;
          } catch {}
        }

      } catch (error) {
        result.services[endpoint.name] = {
          success: false,
          error: error.message,
          priority: endpoint.priority,
          available: false
        };
      }
    }

    // Análise detalhada dos serviços
    const serviceResults = Object.values(result.services);
    const successCount = serviceResults.filter((s: any) => s.success).length;
    const criticalServices = serviceResults.filter((s: any) => s.priority === 'critical');
    const criticalSuccessCount = criticalServices.filter((s: any) => s.success).length;

    result.service_summary = {
      total_services: serviceResults.length,
      successful_services: successCount,
      failed_services: serviceResults.length - successCount,
      success_rate: `${Math.round((successCount / serviceResults.length) * 100)}%`,
      critical_services_ok: criticalSuccessCount === criticalServices.length,
      critical_success_rate: criticalServices.length > 0 ? `${Math.round((criticalSuccessCount / criticalServices.length) * 100)}%` : 'N/A'
    };

    // Critério de sucesso: todos os serviços críticos devem funcionar + pelo menos 60% do total
    result.success = result.service_summary.critical_services_ok && (successCount / serviceResults.length) >= 0.6;
    result.duration = Date.now() - startTime;

    console.log('[VPS Diagnostic] ⚙️ Serviços testados:', `${successCount}/${serviceResults.length} OK`, result.success ? 'SUCESSO' : 'FALHA');
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
    response: {},
    flow_analysis: {}
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

    const responseTime = Date.now() - startTime;

    result.response = {
      success: response.ok,
      status: response.status,
      status_text: response.statusText,
      response_time: responseTime,
      headers: Object.fromEntries(response.headers.entries())
    };

    if (response.ok) {
      try {
        const body = await response.json();
        result.response.data = body;
        result.success = true;
        
        // Análise do fluxo de dados
        result.flow_analysis = {
          has_data: !!body,
          data_type: typeof body,
          contains_success_field: 'success' in body,
          contains_error_field: 'error' in body,
          data_size: JSON.stringify(body).length
        };
        
      } catch (parseError) {
        const text = await response.text();
        result.response.text = text.substring(0, 200);
        result.success = true;
        
        result.flow_analysis = {
          response_type: 'text',
          content_length: text.length,
          parse_error: parseError.message
        };
      }
    } else {
      try {
        const errorBody = await response.text();
        result.response.error_body = errorBody.substring(0, 500);
        
        result.flow_analysis = {
          error_response: true,
          error_length: errorBody.length,
          status_indicates_auth_issue: response.status === 401 || response.status === 403,
          status_indicates_server_issue: response.status >= 500
        };
      } catch {}
    }

    result.duration = Date.now() - startTime;

    console.log('[VPS Diagnostic] 🔄 Fluxo completo testado:', result.success ? 'OK' : 'FALHA', `(${responseTime}ms)`);
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
        if (!results.details.network?.external_connectivity) {
          results.recommendations.push('Verificar conectividade de rede da Edge Function');
        }
        break;
      case 'vps_connectivity':
        results.recommendations.push('Verificar se a VPS está online e acessível');
        results.recommendations.push('Confirmar configuração de firewall na VPS');
        results.recommendations.push('Testar conectividade manual com a VPS');
        break;
      case 'vps_auth':
        results.recommendations.push('Verificar se o token VPS_API_TOKEN está correto');
        results.recommendations.push('Confirmar se o token no servidor VPS corresponde ao configurado');
        results.recommendations.push('Testar token manualmente com curl');
        break;
      case 'vps_services':
        results.recommendations.push('Verificar se o servidor WhatsApp Web.js está rodando');
        results.recommendations.push('Reiniciar serviços na VPS se necessário');
        results.recommendations.push('Verificar logs do servidor VPS');
        break;
      case 'full_flow':
        results.recommendations.push('Verificar integração entre Edge Functions');
        results.recommendations.push('Confirmar configuração de autenticação');
        results.recommendations.push('Revisar logs das Edge Functions');
        break;
      case 'comprehensive_health':
        results.recommendations.push('Executar testes individuais para identificar problemas específicos');
        results.recommendations.push('Verificar status de todos os componentes do sistema');
        break;
    }
  } else {
    results.recommendations.push('Sistema funcionando corretamente');
    results.recommendations.push('Monitorar performance regularmente');
  }
}
