import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VPS_CONFIG = {
  ip: '31.97.24.222',
  port: 3002,
  primaryUrl: 'http://31.97.24.222:3002',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 45000,
  maxRetries: 3,
  retryDelay: 2000,
  alternativePorts: [3001, 8080, 80, 443]
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { testType } = await req.json();
    const diagnosticId = `deep_diag_${Date.now()}`;
    console.log(`[Deep Network Diagnostic] 🔍 CORREÇÃO: Teste com timeout 45s e retry: ${testType} [${diagnosticId}]`);

    let result: any = {};

    switch (testType) {
      case 'external_connectivity':
        result = await testExternalConnectivity(diagnosticId);
        break;
      case 'port_scanning':
        result = await testPortScanning(diagnosticId);
        break;
      case 'dns_resolution':
        result = await testDNSResolution(diagnosticId);
        break;
      case 'traceroute_simulation':
        result = await testTracerouteSimulation(diagnosticId);
        break;
      case 'firewall_detection':
        result = await testFirewallDetection(diagnosticId);
        break;
      case 'supabase_ip_test':
        result = await testSupabaseIPConnection(diagnosticId);
        break;
      case 'production_flow_exact':
        result = await testProductionFlowExact(diagnosticId);
        break;
      default:
        result = await runComprehensiveNetworkDiagnostic(diagnosticId);
    }

    return new Response(JSON.stringify({
      success: true,
      diagnosticId,
      testType,
      result,
      timestamp: new Date().toISOString(),
      edgeFunctionInfo: await getEdgeFunctionInfo(),
      corrections: {
        timeout_increased: '45s',
        retry_enabled: true,
        max_retries: VPS_CONFIG.maxRetries
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[Deep Network Diagnostic] ❌ CORREÇÃO: Erro crítico:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack,
      corrections_applied: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// CORREÇÃO: Função de retry com backoff exponencial
async function fetchWithRetry(url: string, options: any, diagnosticId: string, operation: string) {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= VPS_CONFIG.maxRetries; attempt++) {
    const startTime = Date.now();
    console.log(`[Deep Diagnostic] 🔄 CORREÇÃO: Tentativa ${attempt}/${VPS_CONFIG.maxRetries} - ${operation} [${diagnosticId}]`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`[Deep Diagnostic] ⏰ CORREÇÃO: Timeout ${VPS_CONFIG.timeout}ms na tentativa ${attempt} [${diagnosticId}]`);
        controller.abort();
      }, VPS_CONFIG.timeout);
      
      // CORREÇÃO: Headers otimizados para bypass de proxies
      const optimizedOptions = {
        ...options,
        signal: controller.signal,
        headers: {
          ...options.headers,
          'Connection': 'keep-alive',
          'Keep-Alive': 'timeout=60, max=100',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache',
          'X-Bypass-Cache': 'true',
          'X-Forwarded-Proto': 'http',
          'User-Agent': 'Supabase-Edge-Function-Optimized/2.0'
        }
      };
      
      const response = await fetch(url, optimizedOptions);
      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      console.log(`[Deep Diagnostic] ✅ CORREÇÃO: Sucesso tentativa ${attempt} em ${responseTime}ms [${diagnosticId}]`);
      
      return response;
      
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      lastError = error;
      
      console.log(`[Deep Diagnostic] ❌ CORREÇÃO: Tentativa ${attempt} falhou em ${responseTime}ms: ${error.message} [${diagnosticId}]`);
      
      // Se não é a última tentativa, aguardar com backoff exponencial
      if (attempt < VPS_CONFIG.maxRetries) {
        const delay = VPS_CONFIG.retryDelay * Math.pow(2, attempt - 1);
        console.log(`[Deep Diagnostic] ⏳ CORREÇÃO: Aguardando ${delay}ms antes da próxima tentativa [${diagnosticId}]`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Todas as tentativas falharam');
}

async function testExternalConnectivity(diagnosticId: string) {
  console.log(`[Deep Diagnostic] 🌐 CORREÇÃO: Teste conectividade externa com retry [${diagnosticId}]`);
  
  const externalSites = [
    'https://httpbin.org/ip',
    'https://api.github.com',
    'https://jsonplaceholder.typicode.com/posts/1'
  ];
  
  const results = [];
  
  for (const site of externalSites) {
    try {
      const response = await fetchWithRetry(site, { method: 'GET' }, diagnosticId, `external-${site}`);
      const content = await response.text();
      
      results.push({
        site,
        success: true,
        status: response.status,
        contentLength: content.length,
        corrected: true
      });
      
    } catch (error: any) {
      results.push({
        site,
        success: false,
        error: error.message,
        errorType: error.name,
        corrected: true
      });
    }
  }
  
  return { 
    test: 'external_connectivity_corrected',
    results,
    summary: {
      totalSites: externalSites.length,
      successfulConnections: results.filter(r => r.success).length,
      corrections_applied: true
    }
  };
}

async function testPortScanning(diagnosticId: string) {
  console.log(`[Deep Diagnostic] 🔍 CORREÇÃO: Escaneamento portas com timeout 45s [${diagnosticId}]`);
  
  const portsToTest = [3001, 3002, 8080, 80, 443, 22];
  const results = [];
  
  for (const port of portsToTest) {
    try {
      const testUrl = `http://${VPS_CONFIG.ip}:${port}/health`;
      const response = await fetchWithRetry(testUrl, { method: 'GET' }, diagnosticId, `port-${port}`);
      
      results.push({
        port,
        success: true,
        status: response.status,
        accessible: true,
        corrected: true
      });
      
    } catch (error: any) {
      results.push({
        port,
        success: false,
        error: error.message,
        accessible: false,
        errorType: error.name,
        corrected: true
      });
    }
  }
  
  return {
    test: 'port_scanning_corrected',
    results,
    summary: {
      totalPorts: portsToTest.length,
      accessiblePorts: results.filter(r => r.accessible).length,
      recommendedPort: results.find(r => r.accessible)?.port || null,
      corrections_applied: true
    }
  };
}

async function testProductionFlowExact(diagnosticId: string) {
  console.log(`[Deep Diagnostic] 🎯 CORREÇÃO: Fluxo produção com timeout 45s e retry [${diagnosticId}]`);
  
  const timestamp = Date.now();
  const sessionName = `diagnostic_corrected_${timestamp}`;
  
  // CORREÇÃO: Payload otimizado (reduzido)
  const payload = {
    instanceId: sessionName,
    sessionName: sessionName,
    webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web'
  };
  
  try {
    console.log(`[Deep Diagnostic] 📤 CORREÇÃO: Enviando para VPS com retry: ${VPS_CONFIG.primaryUrl}/instance/create [${diagnosticId}]`);
    
    const response = await fetchWithRetry(
      `${VPS_CONFIG.primaryUrl}/instance/create`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VPS_CONFIG.authToken}`
        },
        body: JSON.stringify(payload)
      },
      diagnosticId,
      'production-flow'
    );

    const responseText = await response.text();
    
    console.log(`[Deep Diagnostic] 📥 CORREÇÃO: Resposta VPS com sucesso: ${response.status} [${diagnosticId}]`);
    
    return {
      test: 'production_flow_corrected',
      success: true,
      status: response.status,
      responseText: responseText.substring(0, 500),
      payload,
      corrections: {
        timeout_used: VPS_CONFIG.timeout,
        retry_successful: true
      },
      headers: Object.fromEntries(response.headers.entries())
    };

  } catch (error: any) {
    console.error(`[Deep Diagnostic] ❌ CORREÇÃO: Fluxo falhou após retry [${diagnosticId}]:`, error.message);
    
    return {
      test: 'production_flow_corrected',
      success: false,
      error: error.message,
      payload,
      errorType: error.name,
      corrections: {
        timeout_used: VPS_CONFIG.timeout,
        retry_attempted: true,
        all_retries_failed: true
      }
    };
  }
}

async function testDNSResolution(diagnosticId: string) {
  const results = [];
  
  try {
    const response = await fetchWithRetry(`http://${VPS_CONFIG.ip}:3002`, {
      method: 'HEAD'
    }, diagnosticId, 'dns-direct-ip');
    
    results.push({
      test: 'direct_ip_connection_corrected',
      success: true,
      status: response.status
    });
    
  } catch (error: any) {
    results.push({
      test: 'direct_ip_connection_corrected',
      success: false,
      error: error.message
    });
  }
  
  return {
    test: 'dns_resolution_corrected',
    results,
    corrections_applied: true
  };
}

async function testTracerouteSimulation(diagnosticId: string) {
  const hops = [
    'https://httpbin.org/delay/1',
    'https://jsonplaceholder.typicode.com/posts/1',
    `http://${VPS_CONFIG.ip}:3002/health`
  ];
  
  const results = [];
  
  for (let i = 0; i < hops.length; i++) {
    const hop = hops[i];
    
    try {
      const response = await fetchWithRetry(hop, { method: 'GET' }, diagnosticId, `traceroute-hop-${i+1}`);
      
      results.push({
        hop: i + 1,
        url: hop,
        success: true,
        status: response.status,
        corrected: true
      });
      
    } catch (error: any) {
      results.push({
        hop: i + 1,
        url: hop,
        success: false,
        error: error.message,
        corrected: true
      });
    }
  }
  
  return {
    test: 'traceroute_simulation_corrected',
    results,
    analysis: {
      externalConnectivity: results.slice(0, 2).every(r => r.success),
      vpsConnectivity: results[2]?.success || false,
      bottleneck: results.find(r => !r.success)?.hop || null,
      corrections_applied: true
    }
  };
}

async function testFirewallDetection(diagnosticId: string) {
  const methods = ['GET', 'POST', 'HEAD', 'OPTIONS'];
  const tests = [];
  
  for (const method of methods) {
    try {
      const response = await fetchWithRetry(`${VPS_CONFIG.primaryUrl}/health`, {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {}
      }, diagnosticId, `firewall-${method}`);
      
      tests.push({
        method,
        success: true,
        status: response.status,
        corrected: true
      });
      
    } catch (error: any) {
      tests.push({
        method,
        success: false,
        error: error.message,
        errorType: error.name,
        corrected: true
      });
    }
  }
  
  return {
    test: 'firewall_detection_corrected',
    results: tests,
    analysis: {
      methodsBlocked: tests.filter(t => !t.success).map(t => t.method),
      potentialFirewall: tests.some(t => !t.success),
      consistentBlocking: tests.every(t => !t.success),
      corrections_applied: true
    }
  };
}

async function testSupabaseIPConnection(diagnosticId: string) {
  try {
    const ipResponse = await fetch('https://httpbin.org/ip');
    const ipData = await ipResponse.json();
    const edgeIP = ipData.origin;
    
    const userAgents = [
      'Supabase-Edge-Function-Corrected/2.0',
      'Mozilla/5.0 (compatible; EdgeFunction)',
      'WhatsApp-Integration-Optimized/1.0'
    ];
    
    const results = [];
    
    for (const userAgent of userAgents) {
      try {
        const response = await fetchWithRetry(`${VPS_CONFIG.primaryUrl}/health`, {
          method: 'GET',
          headers: {
            'User-Agent': userAgent,
            'X-Forwarded-For': edgeIP,
            'X-Real-IP': edgeIP
          }
        }, diagnosticId, `supabase-ip-${userAgent.split('/')[0]}`);
        
        results.push({
          userAgent,
          success: true,
          status: response.status,
          corrected: true
        });
        
      } catch (error: any) {
        results.push({
          userAgent,
          success: false,
          error: error.message,
          corrected: true
        });
      }
    }
    
    return {
      test: 'supabase_ip_connection_corrected',
      edgeFunctionIP: edgeIP,
      results,
      recommendation: results.some(r => r.success) ? 'User-Agent otimizado funcionou' : 'Problema de conectividade geral',
      corrections_applied: true
    };
    
  } catch (error: any) {
    return {
      test: 'supabase_ip_connection_corrected',
      success: false,
      error: error.message,
      corrections_applied: true
    };
  }
}

async function getEdgeFunctionInfo() {
  try {
    const ipResponse = await fetch('https://httpbin.org/ip');
    const ipData = await ipResponse.json();
    
    return {
      edgeIP: ipData.origin,
      timestamp: new Date().toISOString(),
      region: Deno.env.get('SUPABASE_REGION') || 'unknown',
      functionName: 'vps_network_deep_diagnostic_corrected',
      corrections: {
        timeout: VPS_CONFIG.timeout,
        maxRetries: VPS_CONFIG.maxRetries,
        optimized_headers: true
      }
    };
  } catch {
    return {
      edgeIP: 'unknown',
      timestamp: new Date().toISOString(),
      region: 'unknown',
      corrections_applied: true
    };
  }
}

async function runComprehensiveNetworkDiagnostic(diagnosticId: string) {
  console.log(`[Deep Diagnostic] 🔬 CORREÇÃO: Diagnóstico completo com timeouts otimizados [${diagnosticId}]`);
  
  const external = await testExternalConnectivity(diagnosticId);
  const ports = await testPortScanning(diagnosticId);
  const production = await testProductionFlowExact(diagnosticId);
  
  return {
    comprehensive: true,
    corrected: true,
    tests: {
      external,
      ports,
      production
    },
    analysis: {
      externalConnectivityOK: external.summary.successfulConnections > 0,
      vpsPortsAccessible: ports.summary.accessiblePorts > 0,
      productionFlowWorking: production.success,
      likelyIssue: determineLikelyIssue(external, ports, production),
      corrections_summary: {
        timeout_increased_to: '45s',
        retry_mechanism: 'enabled',
        headers_optimized: true,
        backoff_strategy: 'exponential'
      }
    },
    recommendations: generateNetworkRecommendations(external, ports, production)
  };
}

function determineLikelyIssue(external: any, ports: any, production: any) {
  if (!external.summary.successfulConnections) {
    return 'CORREÇÃO: Edge Function sem conectividade externa - contatar Supabase';
  }
  
  if (!ports.summary.accessiblePorts) {
    return 'CORREÇÃO: VPS firewall bloqueando - mesmo com timeout 45s';
  }
  
  if (production.success) {
    return 'CORREÇÃO: Problema resolvido com timeout 45s e retry!';
  }
  
  if (production.corrections?.all_retries_failed) {
    return 'CORREÇÃO: Latência extrema persistente - problema de infraestrutura Hostinger';
  }
  
  return 'CORREÇÃO: Problema pode estar relacionado à performance de rede';
}

function generateNetworkRecommendations(external: any, ports: any, production: any) {
  const recommendations = [];
  
  if (production.success) {
    recommendations.push('✅ CORREÇÃO FUNCIONOU: Timeout 45s e retry resolveram o problema');
    recommendations.push('🚀 SUCESSO: Implementar essas configurações em todas as Edge Functions');
  } else {
    recommendations.push('🔧 PRÓXIMO PASSO: Implementar as correções em whatsapp_instance_manager');
    recommendations.push('📊 MONITORING: Adicionar logging de latência para identificar padrões');
    recommendations.push('🏥 FALLBACK: Considerar endpoint alternativo ou cache');
  }
  
  if (!external.summary.successfulConnections) {
    recommendations.push('🚨 CRÍTICO: Problema de conectividade da Edge Function - contatar Supabase');
  }
  
  if (production.corrections?.all_retries_failed) {
    recommendations.push('🏢 HOSTINGER: Solicitar otimização de roteamento de rede');
    recommendations.push('📈 UPGRADE: Considerar plano VPS com melhor performance de rede');
  }
  
  return recommendations;
}
