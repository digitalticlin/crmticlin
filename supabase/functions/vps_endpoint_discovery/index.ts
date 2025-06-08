
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 15000
};

async function testEndpoint(method: string, endpoint: string, body?: any): Promise<any> {
  const url = `${VPS_CONFIG.baseUrl}${endpoint}`;
  
  try {
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      },
      signal: AbortSignal.timeout(VPS_CONFIG.timeout)
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, requestOptions);
    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    return {
      success: response.ok,
      status: response.status,
      method,
      endpoint,
      data,
      working: response.ok && response.status !== 404
    };
  } catch (error: any) {
    return {
      success: false,
      status: 0,
      method,
      endpoint,
      error: error.message,
      working: false
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[VPS Endpoint Discovery] 🔍 Iniciando descoberta completa...');
    
    const { action, testInstanceId } = await req.json();
    
    if (action === 'discover_all_endpoints') {
      const testInstance = testInstanceId || 'discovery_test';
      
      console.log(`[VPS Endpoint Discovery] 🧪 Testando com instância: ${testInstance}`);
      
      // 1. Criar instância de teste
      const createResult = await testEndpoint('POST', '/instance/create', {
        instanceId: testInstance,
        sessionName: 'discovery_test'
      });
      
      console.log('[VPS Endpoint Discovery] 🏗️ Criação:', createResult.working);
      
      // 2. Testar todos os endpoints de QR Code possíveis
      const qrTests = [
        await testEndpoint('GET', `/qr/${testInstance}`),
        await testEndpoint('GET', `/instance/${testInstance}/qr`),
        await testEndpoint('POST', '/instance/qr', { instanceId: testInstance }),
        await testEndpoint('POST', '/qr', { instanceId: testInstance }),
        await testEndpoint('GET', `/instance/qr/${testInstance}`),
      ];
      
      // 3. Testar endpoints de envio de mensagem
      const sendTests = [
        await testEndpoint('POST', '/send', { 
          instanceId: testInstance, 
          to: 'test@c.us', 
          message: 'test' 
        }),
        await testEndpoint('POST', '/message', { 
          instanceId: testInstance, 
          to: 'test@c.us', 
          message: 'test' 
        }),
        await testEndpoint('POST', `/instance/${testInstance}/send`, { 
          to: 'test@c.us', 
          message: 'test' 
        }),
      ];
      
      // 4. Testar endpoints de status
      const statusTests = [
        await testEndpoint('GET', `/instance/${testInstance}/status`),
        await testEndpoint('POST', '/status', { instanceId: testInstance }),
        await testEndpoint('GET', `/status/${testInstance}`),
      ];
      
      // 5. Testar endpoints de deleção
      const deleteTests = [
        await testEndpoint('POST', '/instance/delete', { instanceId: testInstance }),
        await testEndpoint('DELETE', `/instance/${testInstance}`),
        await testEndpoint('POST', '/delete', { instanceId: testInstance }),
        await testEndpoint('DELETE', `/instances/${testInstance}`),
      ];
      
      // Encontrar endpoints que funcionam
      const workingEndpoints: any = {};
      
      const workingQR = qrTests.find(test => test.working);
      if (workingQR) {
        workingEndpoints.qrCode = `${workingQR.method} ${workingQR.endpoint}`;
      }
      
      const workingSend = sendTests.find(test => test.working);
      if (workingSend) {
        workingEndpoints.sendMessage = `${workingSend.method} ${workingSend.endpoint}`;
      }
      
      const workingStatus = statusTests.find(test => test.working);
      if (workingStatus) {
        workingEndpoints.status = `${workingStatus.method} ${workingStatus.endpoint}`;
      }
      
      const workingDelete = deleteTests.find(test => test.working);
      if (workingDelete) {
        workingEndpoints.deleteInstance = `${workingDelete.method} ${workingDelete.endpoint}`;
      }
      
      // Tentar limpar instância de teste
      if (workingDelete) {
        console.log('[VPS Endpoint Discovery] 🧹 Limpando instância de teste...');
        await testEndpoint(
          workingDelete.method, 
          workingDelete.endpoint, 
          workingDelete.method === 'POST' ? { instanceId: testInstance } : undefined
        );
      }
      
      const fullReport = {
        create: createResult,
        qrTests,
        sendTests,
        statusTests,
        deleteTests,
        summary: {
          totalTests: qrTests.length + sendTests.length + statusTests.length + deleteTests.length + 1,
          workingTests: [workingQR, workingSend, workingStatus, workingDelete].filter(Boolean).length + (createResult.working ? 1 : 0)
        }
      };
      
      console.log('[VPS Endpoint Discovery] 📊 Endpoints funcionais encontrados:', Object.keys(workingEndpoints).length);
      
      return new Response(
        JSON.stringify({
          success: Object.keys(workingEndpoints).length > 0,
          workingEndpoints,
          fullReport,
          message: `Descoberta concluída: ${Object.keys(workingEndpoints).length} endpoints funcionais encontrados`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Ação não reconhecida: ${action}`,
        available_actions: ['discover_all_endpoints']
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[VPS Endpoint Discovery] ❌ Erro:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        service: 'vps_endpoint_discovery'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
