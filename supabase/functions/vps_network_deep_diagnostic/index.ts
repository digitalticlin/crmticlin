
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
  alternativePorts: [3001, 8080, 80, 443]
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { testType } = await req.json();
    const diagnosticId = `deep_diag_${Date.now()}`;
    console.log(`[Deep Network Diagnostic] 🔍 INICIANDO TESTE PROFUNDO: ${testType} [${diagnosticId}]`);

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
      edgeFunctionInfo: await getEdgeFunctionInfo()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[Deep Network Diagnostic] ❌ Erro crítico:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function testExternalConnectivity(diagnosticId: string) {
  console.log(`[Deep Diagnostic] 🌐 TESTE 1: Conectividade Externa [${diagnosticId}]`);
  
  const externalSites = [
    'https://httpbin.org/ip',
    'https://api.github.com',
    'https://jsonplaceholder.typicode.com/posts/1'
  ];
  
  const results = [];
  
  for (const site of externalSites) {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(site, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      const content = await response.text();
      
      results.push({
        site,
        success: true,
        status: response.status,
        responseTime,
        contentLength: content.length
      });
      
      console.log(`[Deep Diagnostic] ✅ ${site}: ${response.status} em ${responseTime}ms [${diagnosticId}]`);
      
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      results.push({
        site,
        success: false,
        error: error.message,
        responseTime,
        errorType: error.name
      });
      
      console.error(`[Deep Diagnostic] ❌ ${site}: ${error.message} em ${responseTime}ms [${diagnosticId}]`);
    }
  }
  
  return { 
    test: 'external_connectivity',
    results,
    summary: {
      totalSites: externalSites.length,
      successfulConnections: results.filter(r => r.success).length,
      averageResponseTime: results.filter(r => r.success).reduce((acc, r) => acc + r.responseTime, 0) / results.filter(r => r.success).length || 0
    }
  };
}

async function testPortScanning(diagnosticId: string) {
  console.log(`[Deep Diagnostic] 🔍 TESTE 2: Escaneamento de Portas [${diagnosticId}]`);
  
  const portsToTest = [3001, 3002, 8080, 80, 443, 22];
  const results = [];
  
  for (const port of portsToTest) {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const testUrl = `http://${VPS_CONFIG.ip}:${port}/health`;
      const response = await fetch(testUrl, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      results.push({
        port,
        success: true,
        status: response.status,
        responseTime,
        accessible: true
      });
      
      console.log(`[Deep Diagnostic] ✅ Porta ${port}: acessível (${response.status}) em ${responseTime}ms [${diagnosticId}]`);
      
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      results.push({
        port,
        success: false,
        error: error.message,
        responseTime,
        accessible: false,
        errorType: error.name
      });
      
      console.log(`[Deep Diagnostic] ❌ Porta ${port}: inacessível (${error.message}) em ${responseTime}ms [${diagnosticId}]`);
    }
  }
  
  return {
    test: 'port_scanning',
    results,
    summary: {
      totalPorts: portsToTest.length,
      accessiblePorts: results.filter(r => r.accessible).length,
      recommendedPort: results.find(r => r.accessible)?.port || null
    }
  };
}

async function testDNSResolution(diagnosticId: string) {
  console.log(`[Deep Diagnostic] 🌍 TESTE 3: Resolução DNS [${diagnosticId}]`);
  
  const results = [];
  
  // Teste 1: Resolução do IP
  try {
    const startTime = Date.now();
    const response = await fetch(`http://${VPS_CONFIG.ip}:3002`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000)
    });
    const responseTime = Date.now() - startTime;
    
    results.push({
      test: 'direct_ip_connection',
      success: true,
      responseTime,
      status: response.status
    });
    
  } catch (error: any) {
    results.push({
      test: 'direct_ip_connection',
      success: false,
      error: error.message
    });
  }
  
  // Teste 2: Teste de conectividade básica
  try {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://httpbin.org/ip', {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    const ipInfo = await response.json();
    
    results.push({
      test: 'edge_function_ip_detection',
      success: true,
      responseTime,
      edgeFunctionIP: ipInfo.origin
    });
    
  } catch (error: any) {
    results.push({
      test: 'edge_function_ip_detection',
      success: false,
      error: error.message
    });
  }
  
  return {
    test: 'dns_resolution',
    results
  };
}

async function testTracerouteSimulation(diagnosticId: string) {
  console.log(`[Deep Diagnostic] 🛣️ TESTE 4: Simulação de Traceroute [${diagnosticId}]`);
  
  const hops = [
    'https://httpbin.org/delay/1',
    'https://jsonplaceholder.typicode.com/posts/1',
    `http://${VPS_CONFIG.ip}:3002/health`
  ];
  
  const results = [];
  
  for (let i = 0; i < hops.length; i++) {
    const hop = hops[i];
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(hop, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      results.push({
        hop: i + 1,
        url: hop,
        success: true,
        responseTime,
        status: response.status
      });
      
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      results.push({
        hop: i + 1,
        url: hop,
        success: false,
        responseTime,
        error: error.message
      });
    }
  }
  
  return {
    test: 'traceroute_simulation',
    results,
    analysis: {
      externalConnectivity: results.slice(0, 2).every(r => r.success),
      vpsConnectivity: results[2]?.success || false,
      bottleneck: results.find(r => !r.success)?.hop || null
    }
  };
}

async function testFirewallDetection(diagnosticId: string) {
  console.log(`[Deep Diagnostic] 🛡️ TESTE 5: Detecção de Firewall [${diagnosticId}]`);
  
  const tests = [];
  
  // Teste diferentes métodos HTTP
  const methods = ['GET', 'POST', 'HEAD', 'OPTIONS'];
  
  for (const method of methods) {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${VPS_CONFIG.primaryUrl}/health`, {
        method,
        signal: controller.signal,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {}
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      tests.push({
        method,
        success: true,
        status: response.status,
        responseTime
      });
      
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      tests.push({
        method,
        success: false,
        error: error.message,
        responseTime,
        errorType: error.name
      });
    }
  }
  
  return {
    test: 'firewall_detection',
    results: tests,
    analysis: {
      methodsBlocked: tests.filter(t => !t.success).map(t => t.method),
      potentialFirewall: tests.some(t => !t.success),
      consistentBlocking: tests.every(t => !t.success)
    }
  };
}

async function testSupabaseIPConnection(diagnosticId: string) {
  console.log(`[Deep Diagnostic] 🏢 TESTE 6: Conexão IP Supabase [${diagnosticId}]`);
  
  try {
    // Obter IP da Edge Function
    const ipResponse = await fetch('https://httpbin.org/ip');
    const ipData = await ipResponse.json();
    const edgeIP = ipData.origin;
    
    // Testar conexão com diferentes User-Agents
    const userAgents = [
      'Supabase-Edge-Function/1.0',
      'Mozilla/5.0 (compatible; EdgeFunction)',
      'WhatsApp-Integration/1.0'
    ];
    
    const results = [];
    
    for (const userAgent of userAgents) {
      const startTime = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${VPS_CONFIG.primaryUrl}/health`, {
          method: 'GET',
          headers: {
            'User-Agent': userAgent,
            'X-Forwarded-For': edgeIP,
            'X-Real-IP': edgeIP
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        
        results.push({
          userAgent,
          success: true,
          status: response.status,
          responseTime
        });
        
      } catch (error: any) {
        const responseTime = Date.now() - startTime;
        results.push({
          userAgent,
          success: false,
          error: error.message,
          responseTime
        });
      }
    }
    
    return {
      test: 'supabase_ip_connection',
      edgeFunctionIP: edgeIP,
      results,
      recommendation: results.some(r => r.success) ? 'Configurar User-Agent específico' : 'Problema de conectividade geral'
    };
    
  } catch (error: any) {
    return {
      test: 'supabase_ip_connection',
      success: false,
      error: error.message
    };
  }
}

async function testProductionFlowExact(diagnosticId: string) {
  console.log(`[Deep Diagnostic] 🎯 TESTE 7: Fluxo Produção Exato [${diagnosticId}]`);
  
  const timestamp = Date.now();
  const sessionName = `diagnostic_test_${timestamp}`;
  const payload = {
    instanceId: sessionName,
    sessionName: sessionName,
    webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web'
  };
  
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`[Deep Diagnostic] ⏰ TIMEOUT de 15s atingido [${diagnosticId}]`);
      controller.abort();
    }, 15000);
    
    console.log(`[Deep Diagnostic] 📤 Enviando para VPS: ${VPS_CONFIG.primaryUrl}/instance/create [${diagnosticId}]`);
    
    const response = await fetch(`${VPS_CONFIG.primaryUrl}/instance/create`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
        'User-Agent': 'Supabase-Edge-Function-Diagnostic/1.0'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    const responseText = await response.text();
    
    console.log(`[Deep Diagnostic] 📥 Resposta VPS: ${response.status} em ${responseTime}ms [${diagnosticId}]`);
    
    return {
      test: 'production_flow_exact',
      success: true,
      status: response.status,
      responseTime,
      responseText: responseText.substring(0, 500),
      payload,
      headers: Object.fromEntries(response.headers.entries())
    };

  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.error(`[Deep Diagnostic] ❌ Fluxo falhou em ${responseTime}ms [${diagnosticId}]:`, error.message);
    
    return {
      test: 'production_flow_exact',
      success: false,
      error: error.message,
      responseTime,
      payload,
      errorType: error.name,
      timeoutReached: responseTime >= 14000
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
      functionName: 'vps_network_deep_diagnostic'
    };
  } catch {
    return {
      edgeIP: 'unknown',
      timestamp: new Date().toISOString(),
      region: 'unknown'
    };
  }
}

async function runComprehensiveNetworkDiagnostic(diagnosticId: string) {
  console.log(`[Deep Diagnostic] 🔬 DIAGNÓSTICO COMPLETO [${diagnosticId}]`);
  
  const external = await testExternalConnectivity(diagnosticId);
  const ports = await testPortScanning(diagnosticId);
  const dns = await testDNSResolution(diagnosticId);
  const trace = await testTracerouteSimulation(diagnosticId);
  const firewall = await testFirewallDetection(diagnosticId);
  const supabaseIP = await testSupabaseIPConnection(diagnosticId);
  const production = await testProductionFlowExact(diagnosticId);
  
  return {
    comprehensive: true,
    tests: {
      external,
      ports,
      dns,
      trace,
      firewall,
      supabaseIP,
      production
    },
    analysis: {
      externalConnectivityOK: external.summary.successfulConnections > 0,
      vpsPortsAccessible: ports.summary.accessiblePorts > 0,
      productionFlowWorking: production.success,
      likelyIssue: determineLikelyIssue(external, ports, firewall, production)
    },
    recommendations: generateNetworkRecommendations(external, ports, firewall, production)
  };
}

function determineLikelyIssue(external: any, ports: any, firewall: any, production: any) {
  if (!external.summary.successfulConnections) {
    return 'Edge Function não tem conectividade externa geral';
  }
  
  if (!ports.summary.accessiblePorts) {
    return 'Todas as portas da VPS estão bloqueadas - problema de firewall VPS';
  }
  
  if (firewall.analysis.consistentBlocking) {
    return 'Firewall bloqueando todas as requisições para VPS';
  }
  
  if (production.timeoutReached) {
    return 'Timeout na conexão - latência alta ou perda de pacotes';
  }
  
  if (!production.success) {
    return 'Erro específico no endpoint /instance/create';
  }
  
  return 'Conectividade OK - problema pode ser intermitente';
}

function generateNetworkRecommendations(external: any, ports: any, firewall: any, production: any) {
  const recommendations = [];
  
  if (!external.summary.successfulConnections) {
    recommendations.push('🚨 CRÍTICO: Edge Function sem conectividade externa - contatar Supabase');
  }
  
  if (!ports.summary.accessiblePorts) {
    recommendations.push('🔥 VPS: Liberar portas no firewall da VPS (especialmente 3002)');
    recommendations.push('🔥 VPS: Verificar se serviço WhatsApp está rodando');
  }
  
  if (firewall.analysis.potentialFirewall) {
    recommendations.push('🛡️ FIREWALL: Configurar whitelist para IPs do Supabase');
    recommendations.push('🛡️ FIREWALL: Liberar User-Agent "Supabase-Edge-Function"');
  }
  
  if (production.timeoutReached) {
    recommendations.push('⏱️ TIMEOUT: Aumentar timeout para 20+ segundos');
    recommendations.push('⏱️ TIMEOUT: Implementar retry automático');
  }
  
  if (ports.summary.accessiblePorts > 0 && !production.success) {
    recommendations.push('🔧 ENDPOINT: Verificar configuração específica do /instance/create');
    recommendations.push('🔧 ENDPOINT: Testar com diferentes payloads');
  }
  
  return recommendations;
}
