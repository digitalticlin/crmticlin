
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// DIAGNÓSTICO PROFUNDO: Configuração VPS com múltiplas portas e endpoints
const VPS_DIAGNOSTIC_CONFIG = {
  // CORREÇÃO: Testar ambas as portas que encontramos nos logs
  endpoints: [
    { url: 'http://31.97.24.222:3001', port: 3001, name: 'VPS Porta 3001' },
    { url: 'http://31.97.24.222:3002', port: 3002, name: 'VPS Porta 3002' }
  ],
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 15000,
  testPaths: ['/health', '/status', '/instances', '/version', '/api/health']
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { test, vpsAction } = await req.json();
    console.log(`[VPS Diagnostic] 🔍 FASE 2: Executando teste: ${test}`);

    if (test === 'vps_connectivity') {
      return await testVPSConnectivity();
    }

    if (test === 'vps_auth') {
      return await testVPSAuthentication();
    }

    if (test === 'vps_services') {
      return await testVPSServices();
    }

    if (test === 'full_flow') {
      return await testFullFlow(vpsAction);
    }

    throw new Error(`Teste não reconhecido: ${test}`);

  } catch (error) {
    console.error('[VPS Diagnostic] ❌ Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// TESTE 1: Conectividade VPS (descoberta de endpoints)
async function testVPSConnectivity() {
  console.log('[VPS Diagnostic] 🔍 FASE 2: Testando conectividade VPS...');
  
  const results = [];
  
  for (const endpoint of VPS_DIAGNOSTIC_CONFIG.endpoints) {
    for (const path of VPS_DIAGNOSTIC_CONFIG.testPaths) {
      try {
        console.log(`[VPS Diagnostic] 📡 Testando: ${endpoint.url}${path}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), VPS_DIAGNOSTIC_CONFIG.timeout);
        
        const response = await fetch(`${endpoint.url}${path}`, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Supabase-VPS-Diagnostic/2.0',
            'Accept': 'application/json,text/plain,*/*'
          }
        });
        
        clearTimeout(timeoutId);
        
        const responseText = await response.text();
        
        results.push({
          endpoint: endpoint.name,
          url: `${endpoint.url}${path}`,
          status: response.status,
          ok: response.ok,
          responseTime: Date.now(),
          response: responseText.substring(0, 200),
          headers: Object.fromEntries(response.headers.entries())
        });
        
        console.log(`[VPS Diagnostic] ✅ ${endpoint.name}${path}: HTTP ${response.status}`);
        
        if (response.ok) {
          break; // Se encontrou um endpoint que funciona, não precisa testar outros paths
        }
        
      } catch (error) {
        results.push({
          endpoint: endpoint.name,
          url: `${endpoint.url}${path}`,
          status: 0,
          ok: false,
          error: error.message
        });
        
        console.log(`[VPS Diagnostic] ❌ ${endpoint.name}${path}: ${error.message}`);
      }
    }
  }
  
  const workingEndpoints = results.filter(r => r.ok);
  
  return new Response(JSON.stringify({
    success: workingEndpoints.length > 0,
    duration: Date.now(),
    details: {
      workingEndpoints: workingEndpoints.length,
      totalTested: results.length,
      results: results,
      recommendation: workingEndpoints.length > 0 
        ? `Use: ${workingEndpoints[0].url}` 
        : 'Nenhum endpoint VPS acessível'
    },
    timestamp: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// TESTE 2: Autenticação VPS
async function testVPSAuthentication() {
  console.log('[VPS Diagnostic] 🔐 FASE 2: Testando autenticação VPS...');
  
  const results = [];
  
  for (const endpoint of VPS_DIAGNOSTIC_CONFIG.endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), VPS_DIAGNOSTIC_CONFIG.timeout);
      
      const response = await fetch(`${endpoint.url}/instances`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${VPS_DIAGNOSTIC_CONFIG.authToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Supabase-VPS-Auth-Test/2.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      const responseText = await response.text();
      
      results.push({
        endpoint: endpoint.name,
        authenticated: response.status !== 401 && response.status !== 403,
        status: response.status,
        response: responseText.substring(0, 200)
      });
      
      console.log(`[VPS Diagnostic] 🔐 ${endpoint.name}: Auth ${response.status === 401 ? 'FAILED' : 'OK'}`);
      
    } catch (error) {
      results.push({
        endpoint: endpoint.name,
        authenticated: false,
        error: error.message
      });
    }
  }
  
  const authenticatedEndpoints = results.filter(r => r.authenticated);
  
  return new Response(JSON.stringify({
    success: authenticatedEndpoints.length > 0,
    duration: Date.now(),
    details: {
      authenticatedEndpoints: authenticatedEndpoints.length,
      results: results,
      token: VPS_DIAGNOSTIC_CONFIG.authToken.substring(0, 10) + '...'
    },
    timestamp: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// TESTE 3: Serviços VPS (WhatsApp Web.js)
async function testVPSServices() {
  console.log('[VPS Diagnostic] ⚙️ FASE 2: Testando serviços WhatsApp...');
  
  const results = [];
  
  for (const endpoint of VPS_DIAGNOSTIC_CONFIG.endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), VPS_DIAGNOSTIC_CONFIG.timeout);
      
      // Teste 1: Listar instâncias
      const instancesResponse = await fetch(`${endpoint.url}/instances`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${VPS_DIAGNOSTIC_CONFIG.authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      const instancesData = await instancesResponse.text();
      
      // Teste 2: Verificar capacidade de criação
      const createTestResponse = await fetch(`${endpoint.url}/instance/test`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VPS_DIAGNOSTIC_CONFIG.authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      results.push({
        endpoint: endpoint.name,
        instancesAvailable: instancesResponse.ok,
        instancesStatus: instancesResponse.status,
        instancesData: instancesData.substring(0, 150),
        createCapable: createTestResponse.ok,
        createStatus: createTestResponse.status
      });
      
    } catch (error) {
      results.push({
        endpoint: endpoint.name,
        error: error.message
      });
    }
  }
  
  const workingServices = results.filter(r => r.instancesAvailable);
  
  return new Response(JSON.stringify({
    success: workingServices.length > 0,
    duration: Date.now(),
    details: {
      workingServices: workingServices.length,
      results: results
    },
    timestamp: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// TESTE 4: Fluxo completo (check_server)
async function testFullFlow(action?: string) {
  console.log('[VPS Diagnostic] 🔄 FASE 2: Testando fluxo completo...');
  
  if (action === 'check_server') {
    // Simular verificação completa de servidor
    const connectivityTest = await testVPSConnectivity();
    const connectivityData = await connectivityTest.json();
    
    const authTest = await testVPSAuthentication();
    const authData = await authTest.json();
    
    const servicesTest = await testVPSServices();
    const servicesData = await servicesTest.json();
    
    const overallSuccess = connectivityData.success && authData.success && servicesData.success;
    
    return new Response(JSON.stringify({
      success: overallSuccess,
      duration: Date.now(),
      details: {
        connectivity: connectivityData.success,
        authentication: authData.success,
        services: servicesData.success,
        overallHealth: overallSuccess ? 'healthy' : 'degraded'
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(JSON.stringify({
    success: false,
    error: 'Ação não especificada para teste de fluxo'
  }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
