
import { serve } from 'https://deno.land/std@0.177.1/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  timeout: 15000
};

async function testVPSConnectivity() {
  console.log('[VPS Diagnostic] 🔍 Testando conectividade com VPS...');
  
  try {
    const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(VPS_CONFIG.timeout)
    });

    const isOnline = response.ok;
    let responseData = null;
    
    try {
      responseData = await response.text();
      if (responseData.startsWith('{')) {
        responseData = JSON.parse(responseData);
      }
    } catch (e) {
      // Texto simples ou HTML
    }

    return {
      connectivity: isOnline,
      status: response.status,
      statusText: response.statusText,
      responseData,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.error('[VPS Diagnostic] ❌ Erro de conectividade:', error);
    return {
      connectivity: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function testVPSEndpoints() {
  console.log('[VPS Diagnostic] 🔍 Testando endpoints da VPS...');
  
  const endpoints = [
    { path: '/health', method: 'GET', description: 'Health Check' },
    { path: '/instances', method: 'GET', description: 'Lista Instâncias' },
    { path: '/info', method: 'GET', description: 'Informações do Servidor' }
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${VPS_CONFIG.baseUrl}${endpoint.path}`, {
        method: endpoint.method,
        signal: AbortSignal.timeout(VPS_CONFIG.timeout)
      });

      const isWorking = response.ok;
      let responseData = null;
      
      try {
        const text = await response.text();
        responseData = text.startsWith('{') ? JSON.parse(text) : text;
      } catch (e) {
        responseData = 'Invalid JSON response';
      }

      results.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        description: endpoint.description,
        working: isWorking,
        status: response.status,
        response: responseData
      });

    } catch (error: any) {
      results.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        description: endpoint.description,
        working: false,
        error: error.message
      });
    }
  }

  return results;
}

async function testInstanceCreation() {
  console.log('[VPS Diagnostic] 🔍 Testando criação de instância...');
  
  const testInstanceId = `diagnostic_test_${Date.now()}`;
  
  try {
    const payload = {
      instanceId: testInstanceId,
      sessionName: 'diagnostic-test',
      webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web',
      webhook: true,
      webhook_by_events: true,
      webhookEvents: ['messages.upsert', 'qr.update', 'connection.update']
    };

    const response = await fetch(`${VPS_CONFIG.baseUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(VPS_CONFIG.timeout)
    });

    const responseText = await response.text();
    let responseData = responseText;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      // Texto simples
    }

    // Tentar deletar a instância de teste
    if (response.ok) {
      try {
        await fetch(`${VPS_CONFIG.baseUrl}/instance/delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ instanceId: testInstanceId }),
          signal: AbortSignal.timeout(5000)
        });
        console.log('[VPS Diagnostic] 🧹 Instância de teste removida');
      } catch (e) {
        console.log('[VPS Diagnostic] ⚠️ Não foi possível remover instância de teste');
      }
    }

    return {
      canCreateInstances: response.ok,
      status: response.status,
      response: responseData,
      testInstanceId
    };

  } catch (error: any) {
    return {
      canCreateInstances: false,
      error: error.message,
      testInstanceId
    };
  }
}

serve(async (req) => {
  console.log('[VPS Comprehensive Diagnostic] 🚀 Iniciando diagnóstico completo');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();

    // Executar todos os testes
    const [connectivity, endpoints, instanceCreation] = await Promise.all([
      testVPSConnectivity(),
      testVPSEndpoints(),
      testInstanceCreation()
    ]);

    const duration = Date.now() - startTime;

    // Análise dos resultados
    const workingEndpoints = endpoints.filter(e => e.working).length;
    const totalEndpoints = endpoints.length;
    
    const overallHealth = 
      connectivity.connectivity && 
      workingEndpoints === totalEndpoints && 
      instanceCreation.canCreateInstances;

    const diagnostic = {
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      overallHealth,
      summary: {
        connectivity: connectivity.connectivity,
        endpointsWorking: `${workingEndpoints}/${totalEndpoints}`,
        canCreateInstances: instanceCreation.canCreateInstances
      },
      details: {
        connectivity,
        endpoints,
        instanceCreation
      },
      recommendations: []
    };

    // Gerar recomendações
    if (!connectivity.connectivity) {
      diagnostic.recommendations.push('🔧 VPS não está acessível - verificar se está online');
    }
    
    if (workingEndpoints < totalEndpoints) {
      diagnostic.recommendations.push('🔧 Alguns endpoints não estão funcionando - verificar configuração do servidor');
    }
    
    if (!instanceCreation.canCreateInstances) {
      if (instanceCreation.status === 401) {
        diagnostic.recommendations.push('🔐 Problema de autenticação - verificar se é necessário token');
      } else {
        diagnostic.recommendations.push('🔧 Não é possível criar instâncias - verificar configuração WhatsApp Web.js');
      }
    }

    if (overallHealth) {
      diagnostic.recommendations.push('✅ VPS está funcionando corretamente!');
    }

    console.log('[VPS Comprehensive Diagnostic] ✅ Diagnóstico concluído:', {
      health: overallHealth,
      duration,
      issues: diagnostic.recommendations.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        diagnostic
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[VPS Comprehensive Diagnostic] ❌ Erro:', error);
    
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
