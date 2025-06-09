
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VPS_CONFIG = {
  primaryUrl: 'http://31.97.24.222:3002',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeouts: [3000, 5000, 10000, 15000] // Progressive timeouts
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { testType } = await req.json();
    const diagnosticId = `diag_${Date.now()}`;
    console.log(`[VPS Diagnostic] 🔍 Iniciando teste: ${testType} [${diagnosticId}]`);

    let result: any = {};

    switch (testType) {
      case 'simple_ping':
        result = await testSimplePing(diagnosticId);
        break;
      case 'progressive_timeout':
        result = await testProgressiveTimeout(diagnosticId);
        break;
      case 'health_check':
        result = await testHealthCheck(diagnosticId);
        break;
      case 'create_instance_simulation':
        result = await testCreateInstanceSimulation(diagnosticId);
        break;
      case 'network_analysis':
        result = await testNetworkAnalysis(diagnosticId);
        break;
      default:
        result = await runFullDiagnostic(diagnosticId);
    }

    return new Response(JSON.stringify({
      success: true,
      diagnosticId,
      testType,
      result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[VPS Diagnostic] ❌ Erro geral:', error);
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

async function testSimplePing(diagnosticId: string) {
  console.log(`[VPS Diagnostic] 🏓 Teste de ping simples [${diagnosticId}]`);
  
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${VPS_CONFIG.primaryUrl}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
        'User-Agent': 'Supabase-Edge-Diagnostic/1.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    const responseText = await response.text();

    console.log(`[VPS Diagnostic] ✅ Ping OK: ${response.status} em ${responseTime}ms [${diagnosticId}]`);

    return {
      success: true,
      status: response.status,
      responseTime,
      responseText: responseText.substring(0, 500),
      headers: Object.fromEntries(response.headers.entries())
    };

  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.error(`[VPS Diagnostic] ❌ Ping falhou em ${responseTime}ms [${diagnosticId}]:`, error.message);
    
    return {
      success: false,
      error: error.message,
      responseTime,
      errorType: error.name
    };
  }
}

async function testProgressiveTimeout(diagnosticId: string) {
  console.log(`[VPS Diagnostic] ⏱️ Teste de timeout progressivo [${diagnosticId}]`);
  
  const results = [];
  
  for (const timeout of VPS_CONFIG.timeouts) {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(`${VPS_CONFIG.primaryUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VPS_CONFIG.authToken}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      results.push({
        timeout,
        success: true,
        status: response.status,
        responseTime
      });
      
      console.log(`[VPS Diagnostic] ✅ Timeout ${timeout}ms: sucesso em ${responseTime}ms [${diagnosticId}]`);
      break; // Se um timeout funcionou, não precisa testar os maiores
      
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      results.push({
        timeout,
        success: false,
        error: error.message,
        responseTime
      });
      
      console.log(`[VPS Diagnostic] ❌ Timeout ${timeout}ms: falhou em ${responseTime}ms [${diagnosticId}]`);
    }
  }
  
  return { results };
}

async function testHealthCheck(diagnosticId: string) {
  console.log(`[VPS Diagnostic] 🔍 Teste de health check detalhado [${diagnosticId}]`);
  
  const endpoints = ['/health', '/status', '/instances'];
  const results = [];
  
  for (const endpoint of endpoints) {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${VPS_CONFIG.primaryUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VPS_CONFIG.authToken}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      const responseText = await response.text();
      
      results.push({
        endpoint,
        success: true,
        status: response.status,
        responseTime,
        responseText: responseText.substring(0, 200)
      });
      
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      results.push({
        endpoint,
        success: false,
        error: error.message,
        responseTime
      });
    }
  }
  
  return { results };
}

async function testCreateInstanceSimulation(diagnosticId: string) {
  console.log(`[VPS Diagnostic] 🎯 Simulação de criação de instância [${diagnosticId}]`);
  
  const payload = {
    instanceId: `diagnostic_test_${diagnosticId}`,
    sessionName: `diagnostic_test_${diagnosticId}`,
    webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web'
  };
  
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(`${VPS_CONFIG.primaryUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    const responseText = await response.text();
    
    console.log(`[VPS Diagnostic] 📊 Simulação: ${response.status} em ${responseTime}ms [${diagnosticId}]`);
    
    return {
      success: true,
      status: response.status,
      responseTime,
      responseText: responseText.substring(0, 500),
      payload
    };

  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.error(`[VPS Diagnostic] ❌ Simulação falhou em ${responseTime}ms [${diagnosticId}]:`, error.message);
    
    return {
      success: false,
      error: error.message,
      responseTime,
      payload,
      errorType: error.name
    };
  }
}

async function testNetworkAnalysis(diagnosticId: string) {
  console.log(`[VPS Diagnostic] 🌐 Análise de rede [${diagnosticId}]`);
  
  const tests = [];
  
  // Teste 1: DNS Resolution (simulado)
  try {
    const dnsStart = Date.now();
    const response = await fetch('http://31.97.24.222:3002', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    const dnsTime = Date.now() - dnsStart;
    
    tests.push({
      test: 'dns_resolution',
      success: true,
      time: dnsTime,
      status: response.status
    });
  } catch (error: any) {
    tests.push({
      test: 'dns_resolution',
      success: false,
      error: error.message
    });
  }
  
  // Teste 2: Conectividade básica
  try {
    const connectStart = Date.now();
    const response = await fetch(`${VPS_CONFIG.primaryUrl}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000)
    });
    const connectTime = Date.now() - connectStart;
    
    tests.push({
      test: 'basic_connectivity',
      success: true,
      time: connectTime,
      status: response.status
    });
  } catch (error: any) {
    tests.push({
      test: 'basic_connectivity',
      success: false,
      error: error.message
    });
  }
  
  return { tests };
}

async function runFullDiagnostic(diagnosticId: string) {
  console.log(`[VPS Diagnostic] 🔬 Diagnóstico completo [${diagnosticId}]`);
  
  const ping = await testSimplePing(diagnosticId);
  const timeout = await testProgressiveTimeout(diagnosticId);
  const health = await testHealthCheck(diagnosticId);
  const simulation = await testCreateInstanceSimulation(diagnosticId);
  const network = await testNetworkAnalysis(diagnosticId);
  
  return {
    ping,
    timeout,
    health,
    simulation,
    network,
    summary: {
      pingWorking: ping.success,
      bestTimeout: timeout.results.find(r => r.success)?.timeout || 'none',
      healthEndpoints: health.results.filter(r => r.success).length,
      createInstanceWorking: simulation.success,
      networkIssues: network.tests.filter(t => !t.success).length
    }
  };
}
