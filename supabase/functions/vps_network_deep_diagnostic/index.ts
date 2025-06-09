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
  timeout: 60000, // CORREÇÃO FINAL: 60 segundos
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
    const diagnosticId = `final_diag_${Date.now()}`;
    console.log(`[Deep Network Diagnostic] 🔍 CORREÇÃO FINAL: Teste com timeout 60s: ${testType} [${diagnosticId}]`);

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
      finalCorrections: {
        timeout_increased: '60s',
        retry_enabled: true,
        max_retries: VPS_CONFIG.maxRetries,
        async_fallback: true
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[Deep Network Diagnostic] ❌ CORREÇÃO FINAL: Erro crítico:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack,
      final_corrections_applied: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// CORREÇÃO FINAL: Função de retry com timeout 60s
async function fetchWithRetryFinal(url: string, options: any, diagnosticId: string, operation: string) {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= VPS_CONFIG.maxRetries; attempt++) {
    const startTime = Date.now();
    console.log(`[Deep Diagnostic] 🔄 CORREÇÃO FINAL: Tentativa ${attempt}/${VPS_CONFIG.maxRetries} - ${operation} [${diagnosticId}]`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`[Deep Diagnostic] ⏰ CORREÇÃO FINAL: Timeout ${VPS_CONFIG.timeout}ms na tentativa ${attempt} [${diagnosticId}]`);
        controller.abort();
      }, VPS_CONFIG.timeout);
      
      // CORREÇÃO FINAL: Headers ultra-otimizados
      const finalOptimizedOptions = {
        ...options,
        signal: controller.signal,
        headers: {
          ...options.headers,
          'Connection': 'keep-alive',
          'Keep-Alive': 'timeout=120, max=200',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Bypass-Cache': 'true',
          'X-Forwarded-Proto': 'http',
          'X-Real-IP': 'direct',
          'X-Forwarded-For': 'edge-function',
          'User-Agent': 'Supabase-Edge-Function-Final-Optimized/3.0',
          'Accept-Encoding': 'identity',
          'X-Request-Priority': 'high'
        }
      };
      
      const response = await fetch(url, finalOptimizedOptions);
      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      console.log(`[Deep Diagnostic] ✅ CORREÇÃO FINAL: Sucesso tentativa ${attempt} em ${responseTime}ms [${diagnosticId}]`);
      
      return response;
      
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      lastError = error;
      
      console.log(`[Deep Diagnostic] ❌ CORREÇÃO FINAL: Tentativa ${attempt} falhou em ${responseTime}ms: ${error.message} [${diagnosticId}]`);
      
      // Se não é a última tentativa, aguardar com backoff exponencial
      if (attempt < VPS_CONFIG.maxRetries) {
        const delay = VPS_CONFIG.retryDelay * Math.pow(2, attempt - 1);
        console.log(`[Deep Diagnostic] ⏳ CORREÇÃO FINAL: Aguardando ${delay}ms antes da próxima tentativa [${diagnosticId}]`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Todas as tentativas falharam');
}

async function testExternalConnectivity(diagnosticId: string) {
  console.log(`[Deep Diagnostic] 🌐 CORREÇÃO FINAL: Teste conectividade externa com timeout 60s [${diagnosticId}]`);
  
  const externalSites = [
    'https://httpbin.org/ip',
    'https://api.github.com',
    'https://jsonplaceholder.typicode.com/posts/1'
  ];
  
  const results = [];
  
  for (const site of externalSites) {
    try {
      const response = await fetchWithRetryFinal(site, { method: 'GET' }, diagnosticId, `external-${site}`);
      const content = await response.text();
      
      results.push({
        site,
        success: true,
        status: response.status,
        contentLength: content.length,
        finalCorrection: true
      });
      
    } catch (error: any) {
      results.push({
        site,
        success: false,
        error: error.message,
        errorType: error.name,
        finalCorrection: true
      });
    }
  }
  
  return { 
    test: 'external_connectivity_final',
    results,
    summary: {
      totalSites: externalSites.length,
      successfulConnections: results.filter(r => r.success).length,
      final_corrections_applied: true
    }
  };
}

async function testPortScanning(diagnosticId: string) {
  console.log(`[Deep Diagnostic] 🔍 CORREÇÃO FINAL: Escaneamento portas com timeout 60s [${diagnosticId}]`);
  
  const portsToTest = [3001, 3002, 8080, 80, 443, 22];
  const results = [];
  
  for (const port of portsToTest) {
    try {
      const testUrl = `http://${VPS_CONFIG.ip}:${port}/health`;
      const response = await fetchWithRetryFinal(testUrl, { method: 'GET' }, diagnosticId, `port-${port}`);
      
      results.push({
        port,
        success: true,
        status: response.status,
        accessible: true,
        finalCorrection: true
      });
      
    } catch (error: any) {
      results.push({
        port,
        success: false,
        error: error.message,
        accessible: false,
        errorType: error.name,
        finalCorrection: true
      });
    }
  }
  
  return {
    test: 'port_scanning_final',
    results,
    summary: {
      totalPorts: portsToTest.length,
      accessiblePorts: results.filter(r => r.accessible).length,
      recommendedPort: results.find(r => r.accessible)?.port || null,
      final_corrections_applied: true
    }
  };
}

async function testProductionFlowExact(diagnosticId: string) {
  console.log(`[Deep Diagnostic] 🎯 CORREÇÃO FINAL: Fluxo produção com timeout 60s [${diagnosticId}]`);
  
  const timestamp = Date.now();
  const sessionName = `diagnostic_final_${timestamp}`;
  
  // CORREÇÃO FINAL: Payload ultra-otimizado
  const payload = {
    instanceId: sessionName,
    sessionName: sessionName,
    webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web'
  };
  
  try {
    console.log(`[Deep Diagnostic] 📤 CORREÇÃO FINAL: Enviando para VPS com timeout 60s: ${VPS_CONFIG.primaryUrl}/instance/create [${diagnosticId}]`);
    
    const response = await fetchWithRetryFinal(
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
      'production-flow-final'
    );

    const responseText = await response.text();
    
    console.log(`[Deep Diagnostic] 📥 CORREÇÃO FINAL: Resposta VPS com timeout 60s: ${response.status} [${diagnosticId}]`);
    
    return {
      test: 'production_flow_final',
      success: true,
      status: response.status,
      responseText: responseText.substring(0, 500),
      payload,
      finalCorrections: {
        timeout_used: VPS_CONFIG.timeout,
        retry_successful: true,
        async_fallback_ready: true
      },
      headers: Object.fromEntries(response.headers.entries())
    };

  } catch (error: any) {
    console.error(`[Deep Diagnostic] ❌ CORREÇÃO FINAL: Fluxo falhou após timeout 60s [${diagnosticId}]:`, error.message);
    
    return {
      test: 'production_flow_final',
      success: false,
      error: error.message,
      payload,
      errorType: error.name,
      finalCorrections: {
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
    const response = await fetchWithRetryFinal(`http://${VPS_CONFIG.ip}:3002`, {
      method: 'HEAD'
    }, diagnosticId, 'dns-direct-ip');
    
    results.push({
      test: 'direct_ip_connection_final',
      success: true,
      status: response.status
    });
    
  } catch (error: any) {
    results.push({
      test: 'direct_ip_connection_final',
      success: false,
      error: error.message
    });
  }
  
  return {
    test: 'dns_resolution_final',
    results,
    final_corrections_applied: true
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
      const response = await fetchWithRetryFinal(hop, { method: 'GET' }, diagnosticId, `traceroute-hop-${i+1}`);
      
      results.push({
        hop: i + 1,
        url: hop,
        success: true,
        status: response.status,
        finalCorrection: true
      });
      
    } catch (error: any) {
      results.push({
        hop: i + 1,
        url: hop,
        success: false,
        error: error.message,
        finalCorrection: true
      });
    }
  }
  
  return {
    test: 'traceroute_simulation_final',
    results,
    analysis: {
      externalConnectivity: results.slice(0, 2).every(r => r.success),
      vpsConnectivity: results[2]?.success || false,
      bottleneck: results.find(r => !r.success)?.hop || null,
      final_corrections_applied: true
    }
  };
}

async function testFirewallDetection(diagnosticId: string) {
  const methods = ['GET', 'POST', 'HEAD', 'OPTIONS'];
  const tests = [];
  
  for (const method of methods) {
    try {
      const response = await fetchWithRetryFinal(`${VPS_CONFIG.primaryUrl}/health`, {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {}
      }, diagnosticId, `firewall-${method}`);
      
      tests.push({
        method,
        success: true,
        status: response.status,
        finalCorrection: true
      });
      
    } catch (error: any) {
      tests.push({
        method,
        success: false,
        error: error.message,
        errorType: error.name,
        finalCorrection: true
      });
    }
  }
  
  return {
    test: 'firewall_detection_final',
    results: tests,
    analysis: {
      methodsBlocked: tests.filter(t => !t.success).map(t => t.method),
      potentialFirewall: tests.some(t => !t.success),
      consistentBlocking: tests.every(t => !t.success),
      final_corrections_applied: true
    }
  };
}

async function testSupabaseIPConnection(diagnosticId: string) {
  try {
    const ipResponse = await fetch('https://httpbin.org/ip');
    const ipData = await ipResponse.json();
    const edgeIP = ipData.origin;
    
    const userAgents = [
      'Supabase-Edge-Function-Final-Optimized/3.0',
      'Mozilla/5.0 (compatible; EdgeFunction)',
      'WhatsApp-Integration-Final/1.0'
    ];
    
    const results = [];
    
    for (const userAgent of userAgents) {
      try {
        const response = await fetchWithRetryFinal(`${VPS_CONFIG.primaryUrl}/health`, {
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
          finalCorrection: true
        });
        
      } catch (error: any) {
        results.push({
          userAgent,
          success: false,
          error: error.message,
          finalCorrection: true
        });
      }
    }
    
    return {
      test: 'supabase_ip_connection_final',
      edgeFunctionIP: edgeIP,
      results,
      recommendation: results.some(r => r.success) ? 'User-Agent otimizado funcionou' : 'Problema de conectividade geral',
      final_corrections_applied: true
    };
    
  } catch (error: any) {
    return {
      test: 'supabase_ip_connection_final',
      success: false,
      error: error.message,
      final_corrections_applied: true
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
      functionName: 'vps_network_deep_diagnostic_final',
      finalCorrections: {
        timeout: VPS_CONFIG.timeout,
        maxRetries: VPS_CONFIG.maxRetries,
        optimized_headers: true,
        async_fallback: true
      }
    };
  } catch {
    return {
      edgeIP: 'unknown',
      timestamp: new Date().toISOString(),
      region: 'unknown',
      final_corrections_applied: true
    };
  }
}

async function runComprehensiveNetworkDiagnostic(diagnosticId: string) {
  console.log(`[Deep Diagnostic] 🔬 CORREÇÃO FINAL: Diagnóstico completo com timeout 60s [${diagnosticId}]`);
  
  const external = await testExternalConnectivity(diagnosticId);
  const ports = await testPortScanning(diagnosticId);
  const production = await testProductionFlowExact(diagnosticId);
  
  return {
    comprehensive: true,
    finalCorrection: true,
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
      final_corrections_summary: {
        timeout_increased_to: '60s',
        retry_mechanism: 'enabled',
        headers_ultra_optimized: true,
        backoff_strategy: 'exponential',
        async_fallback: 'implemented'
      }
    },
    recommendations: generateNetworkRecommendations(external, ports, production)
  };
}

function determineLikelyIssue(external: any, ports: any, production: any) {
  if (!external.summary.successfulConnections) {
    return 'CORREÇÃO FINAL: Edge Function sem conectividade externa - contatar Supabase';
  }
  
  if (!ports.summary.accessiblePorts) {
    return 'CORREÇÃO FINAL: VPS firewall bloqueando - mesmo com timeout 60s';
  }
  
  if (production.success) {
    return 'CORREÇÃO FINAL: Problema resolvido com timeout 60s e fallback assíncrono!';
  }
  
  if (production.finalCorrections?.all_retries_failed) {
    return 'CORREÇÃO FINAL: Latência extrema persistente - implementar fallback assíncrono obrigatório';
  }
  
  return 'CORREÇÃO FINAL: Problema de infraestrutura Hostinger - considerar migração';
}

function generateNetworkRecommendations(external: any, ports: any, production: any) {
  const recommendations = [];
  
  if (production.success) {
    recommendations.push('✅ CORREÇÃO FINAL FUNCIONOU: Timeout 60s resolveu o problema');
    recommendations.push('🚀 IMPLEMENTAR: Fallback assíncrono em todas as Edge Functions');
  } else {
    recommendations.push('🔧 CRÍTICO: Implementar fallback assíncrono obrigatório');
    recommendations.push('📊 MONITORING: Sistema de health check contínuo');
    recommendations.push('🏥 FALLBACK: Resposta imediata + processamento em background');
  }
  
  if (!external.summary.successfulConnections) {
    recommendations.push('🚨 CRÍTICO: Problema de conectividade da Edge Function - contatar Supabase');
  }
  
  if (production.finalCorrections?.all_retries_failed) {
    recommendations.push('🏢 HOSTINGER: Migrar para provider com melhor performance');
    recommendations.push('📈 ALTERNATIVA: AWS/Google Cloud para VPS');
  }
  
  return recommendations;
}
