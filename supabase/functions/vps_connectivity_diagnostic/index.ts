
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuração da VPS
const VPS_CONFIG = {
  ip: '31.97.24.222',
  port: 3002,
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  baseUrl: 'http://31.97.24.222:3002'
};

serve(async (req) => {
  const startTime = Date.now();
  console.log('[VPS Connectivity Diagnostic] 🚀 Iniciando diagnóstico completo...');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const diagnostic = {
    timestamp: new Date().toISOString(),
    tests: [] as any[],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      duration: 0
    }
  };

  // TESTE 1: Conectividade básica - Health Check
  console.log('[VPS Diagnostic] 🔍 TESTE 1: Health Check básico...');
  const healthTest = await testHealthCheck();
  diagnostic.tests.push(healthTest);

  // TESTE 2: Conectividade com headers mínimos
  console.log('[VPS Diagnostic] 🔍 TESTE 2: Health Check com headers mínimos...');
  const minimalHeadersTest = await testMinimalHeaders();
  diagnostic.tests.push(minimalHeadersTest);

  // TESTE 3: Teste de autenticação
  console.log('[VPS Diagnostic] 🔍 TESTE 3: Teste de autenticação...');
  const authTest = await testAuthentication();
  diagnostic.tests.push(authTest);

  // TESTE 4: Teste de criação de instância (payload mínimo)
  console.log('[VPS Diagnostic] 🔍 TESTE 4: Criação de instância com payload mínimo...');
  const createInstanceTest = await testCreateInstance();
  diagnostic.tests.push(createInstanceTest);

  // TESTE 5: Teste de diferentes timeouts
  console.log('[VPS Diagnostic] 🔍 TESTE 5: Teste com diferentes timeouts...');
  const timeoutTest = await testDifferentTimeouts();
  diagnostic.tests.push(timeoutTest);

  // TESTE 6: Teste de DNS/IP direto
  console.log('[VPS Diagnostic] 🔍 TESTE 6: Teste de resolução DNS...');
  const dnsTest = await testDNSResolution();
  diagnostic.tests.push(dnsTest);

  // Calcular estatísticas
  diagnostic.summary.total = diagnostic.tests.length;
  diagnostic.summary.passed = diagnostic.tests.filter(t => t.success).length;
  diagnostic.summary.failed = diagnostic.summary.total - diagnostic.summary.passed;
  diagnostic.summary.duration = Date.now() - startTime;

  console.log(`[VPS Diagnostic] 📊 Diagnóstico concluído: ${diagnostic.summary.passed}/${diagnostic.summary.total} testes passaram`);

  return new Response(JSON.stringify(diagnostic, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});

// TESTE 1: Health check básico
async function testHealthCheck(): Promise<any> {
  const testStart = Date.now();
  console.log('[VPS Diagnostic] 🔍 Executando health check básico...');
  
  try {
    const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });

    const responseText = await response.text();
    console.log('[VPS Diagnostic] ✅ Health check response:', responseText.substring(0, 100));

    return {
      test: 'Health Check Básico',
      success: response.ok,
      status: response.status,
      duration: Date.now() - testStart,
      details: {
        url: `${VPS_CONFIG.baseUrl}/health`,
        responseBody: responseText,
        headers: Object.fromEntries(response.headers.entries())
      }
    };
  } catch (error) {
    console.error('[VPS Diagnostic] ❌ Health check falhou:', error);
    return {
      test: 'Health Check Básico',
      success: false,
      duration: Date.now() - testStart,
      error: error.message,
      details: {
        url: `${VPS_CONFIG.baseUrl}/health`,
        errorType: error.constructor.name
      }
    };
  }
}

// TESTE 2: Headers mínimos
async function testMinimalHeaders(): Promise<any> {
  const testStart = Date.now();
  console.log('[VPS Diagnostic] 🔍 Testando com headers mínimos...');
  
  try {
    const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    });

    const responseText = await response.text();

    return {
      test: 'Headers Mínimos',
      success: response.ok,
      status: response.status,
      duration: Date.now() - testStart,
      details: {
        responseBody: responseText
      }
    };
  } catch (error) {
    console.error('[VPS Diagnostic] ❌ Teste headers mínimos falhou:', error);
    return {
      test: 'Headers Mínimos',
      success: false,
      duration: Date.now() - testStart,
      error: error.message
    };
  }
}

// TESTE 3: Autenticação
async function testAuthentication(): Promise<any> {
  const testStart = Date.now();
  console.log('[VPS Diagnostic] 🔍 Testando autenticação...');
  
  try {
    const response = await fetch(`${VPS_CONFIG.baseUrl}/instances`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(8000)
    });

    const responseText = await response.text();

    return {
      test: 'Teste de Autenticação',
      success: response.ok,
      status: response.status,
      duration: Date.now() - testStart,
      details: {
        url: `${VPS_CONFIG.baseUrl}/instances`,
        responseBody: responseText.substring(0, 200)
      }
    };
  } catch (error) {
    console.error('[VPS Diagnostic] ❌ Teste autenticação falhou:', error);
    return {
      test: 'Teste de Autenticação',
      success: false,
      duration: Date.now() - testStart,
      error: error.message
    };
  }
}

// TESTE 4: Criação de instância
async function testCreateInstance(): Promise<any> {
  const testStart = Date.now();
  const testInstanceId = `diagnostic_test_${Date.now()}`;
  console.log('[VPS Diagnostic] 🔍 Testando criação de instância:', testInstanceId);
  
  try {
    const payload = {
      instanceId: testInstanceId,
      sessionName: testInstanceId,
      webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web',
      companyId: 'diagnostic-test'
    };

    const response = await fetch(`${VPS_CONFIG.baseUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000)
    });

    const responseText = await response.text();

    return {
      test: 'Criação de Instância',
      success: response.ok,
      status: response.status,
      duration: Date.now() - testStart,
      details: {
        url: `${VPS_CONFIG.baseUrl}/instance/create`,
        payload,
        responseBody: responseText
      }
    };
  } catch (error) {
    console.error('[VPS Diagnostic] ❌ Teste criação instância falhou:', error);
    return {
      test: 'Criação de Instância',
      success: false,
      duration: Date.now() - testStart,
      error: error.message
    };
  }
}

// TESTE 5: Diferentes timeouts
async function testDifferentTimeouts(): Promise<any> {
  const testStart = Date.now();
  console.log('[VPS Diagnostic] 🔍 Testando diferentes timeouts...');
  
  const timeouts = [3000, 10000, 20000];
  const results = [];

  for (const timeout of timeouts) {
    try {
      const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(timeout)
      });

      const responseText = await response.text();
      results.push({
        timeout,
        success: response.ok,
        status: response.status,
        response: responseText.substring(0, 50)
      });
    } catch (error) {
      results.push({
        timeout,
        success: false,
        error: error.message
      });
    }
  }

  return {
    test: 'Diferentes Timeouts',
    success: results.some(r => r.success),
    duration: Date.now() - testStart,
    details: {
      results
    }
  };
}

// TESTE 6: DNS Resolution
async function testDNSResolution(): Promise<any> {
  const testStart = Date.now();
  console.log('[VPS Diagnostic] 🔍 Testando resolução DNS...');
  
  try {
    // Teste direto por IP
    const ipResponse = await fetch(`http://${VPS_CONFIG.ip}:${VPS_CONFIG.port}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });

    const ipResponseText = await ipResponse.text();

    return {
      test: 'Resolução DNS/IP',
      success: ipResponse.ok,
      status: ipResponse.status,
      duration: Date.now() - testStart,
      details: {
        directIP: {
          url: `http://${VPS_CONFIG.ip}:${VPS_CONFIG.port}/health`,
          success: ipResponse.ok,
          response: ipResponseText.substring(0, 100)
        }
      }
    };
  } catch (error) {
    console.error('[VPS Diagnostic] ❌ Teste DNS falhou:', error);
    return {
      test: 'Resolução DNS/IP',
      success: false,
      duration: Date.now() - testStart,
      error: error.message
    };
  }
}
