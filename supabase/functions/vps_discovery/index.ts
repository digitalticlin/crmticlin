
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

// Configurações possíveis da VPS para testar
const VPS_CONFIGS = [
  {
    name: 'Configuração Padrão',
    baseUrl: 'http://31.97.24.222:3001',
    headers: { 'Content-Type': 'application/json' }
  },
  {
    name: 'Configuração com Token',
    baseUrl: 'http://31.97.24.222:3001',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('VPS_API_TOKEN') || 'default-token'}`
    }
  },
  {
    name: 'Configuração Porta 3000',
    baseUrl: 'http://31.97.24.222:3000',
    headers: { 'Content-Type': 'application/json' }
  }
];

async function testVPSEndpoint(config: any, endpoint: string, method: string = 'GET', body?: any) {
  try {
    console.log(`[VPS Discovery] Testando ${config.name} - ${method} ${endpoint}`);
    
    const options: RequestInit = {
      method,
      headers: config.headers,
      signal: AbortSignal.timeout(10000)
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${config.baseUrl}${endpoint}`, options);
    const responseText = await response.text();
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    return {
      success: response.ok,
      status: response.status,
      data: responseData,
      config: config.name
    };
  } catch (error: any) {
    console.error(`[VPS Discovery] Erro testando ${config.name}:`, error);
    return {
      success: false,
      error: error.message,
      config: config.name
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[VPS Discovery] 🔍 Iniciando descoberta automática da VPS');

    const results = [];

    // Testar endpoints básicos em todas as configurações
    const endpoints = [
      { path: '/', method: 'GET', name: 'Root' },
      { path: '/health', method: 'GET', name: 'Health Check' },
      { path: '/status', method: 'GET', name: 'Status' },
      { path: '/api/status', method: 'GET', name: 'API Status' },
      { path: '/instance/list', method: 'GET', name: 'List Instances' },
      { path: '/api/instance/list', method: 'GET', name: 'API List Instances' }
    ];

    for (const config of VPS_CONFIGS) {
      console.log(`[VPS Discovery] 📡 Testando configuração: ${config.name}`);
      
      for (const endpoint of endpoints) {
        const result = await testVPSEndpoint(config, endpoint.path, endpoint.method);
        results.push({
          ...result,
          endpoint: endpoint.name,
          path: endpoint.path,
          method: endpoint.method
        });
      }
    }

    // Testar criação de instância (apenas teste)
    console.log('[VPS Discovery] 🧪 Testando endpoint de criação...');
    
    const testPayloads = [
      { instanceName: 'test_discovery_instance' },
      { instance: 'test_discovery_instance' },
      { name: 'test_discovery_instance' },
      { sessionName: 'test_discovery_instance' }
    ];

    for (const config of VPS_CONFIGS) {
      for (const payload of testPayloads) {
        const createResult = await testVPSEndpoint(
          config, 
          '/instance/create', 
          'POST', 
          payload
        );
        results.push({
          ...createResult,
          endpoint: 'Create Instance Test',
          path: '/instance/create',
          method: 'POST',
          payload: payload
        });

        // Também testar /api/instance/create
        const apiCreateResult = await testVPSEndpoint(
          config, 
          '/api/instance/create', 
          'POST', 
          payload
        );
        results.push({
          ...apiCreateResult,
          endpoint: 'API Create Instance Test',
          path: '/api/instance/create',
          method: 'POST',
          payload: payload
        });
      }
    }

    // Analisar resultados e encontrar melhor configuração
    const workingEndpoints = results.filter(r => r.success);
    const bestConfig = workingEndpoints.length > 0 ? workingEndpoints[0] : null;

    console.log('[VPS Discovery] ✅ Descoberta concluída:', {
      totalTests: results.length,
      workingEndpoints: workingEndpoints.length,
      bestConfig: bestConfig?.config
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Descoberta VPS concluída',
        summary: {
          totalTests: results.length,
          workingEndpoints: workingEndpoints.length,
          bestConfig: bestConfig,
          timestamp: new Date().toISOString()
        },
        allResults: results,
        recommendation: bestConfig ? {
          config: bestConfig.config,
          endpoint: bestConfig.path,
          method: bestConfig.method
        } : null
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error('[VPS Discovery] ❌ Erro geral:', error);
    
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
