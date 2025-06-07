
import { serve } from "https://deno.land/std@0.177.1/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

interface DiagnosticResult {
  test: string;
  success: boolean;
  details: any;
  duration: number;
  error?: string;
}

async function testVPSConnectivity(): Promise<DiagnosticResult> {
  const startTime = Date.now();
  
  try {
    console.log('[VPS Diagnostic] 🔍 Testando conectividade básica...');
    
    const response = await fetch('http://31.97.24.222:3001/health', {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    });
    
    const duration = Date.now() - startTime;
    const responseText = await response.text();
    
    return {
      test: 'VPS Connectivity',
      success: response.ok,
      duration,
      details: {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText.substring(0, 500)
      },
      error: response.ok ? undefined : `HTTP ${response.status}: ${responseText}`
    };
  } catch (error: any) {
    return {
      test: 'VPS Connectivity',
      success: false,
      duration: Date.now() - startTime,
      details: { error: error.message },
      error: error.message
    };
  }
}

async function testVPSAuthentication(): Promise<DiagnosticResult> {
  const startTime = Date.now();
  
  try {
    console.log('[VPS Diagnostic] 🔑 Testando autenticação...');
    
    const vpsToken = Deno.env.get('VPS_API_TOKEN') || 'default-token';
    console.log(`[VPS Diagnostic] Token usado: ${vpsToken.substring(0, 10)}...`);
    
    const response = await fetch('http://31.97.24.222:3001/instances', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${vpsToken}`,
        'X-API-Token': vpsToken,
        'apikey': vpsToken
      },
      signal: AbortSignal.timeout(15000)
    });
    
    const duration = Date.now() - startTime;
    const responseText = await response.text();
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      parsedResponse = { raw: responseText };
    }
    
    return {
      test: 'VPS Authentication',
      success: response.ok,
      duration,
      details: {
        status: response.status,
        tokenUsed: vpsToken.substring(0, 10) + '...',
        response: parsedResponse,
        headers: Object.fromEntries(response.headers.entries())
      },
      error: response.ok ? undefined : `AUTH FAILED ${response.status}: ${responseText}`
    };
  } catch (error: any) {
    return {
      test: 'VPS Authentication',
      success: false,
      duration: Date.now() - startTime,
      details: { error: error.message },
      error: error.message
    };
  }
}

async function testVPSInstanceCreation(): Promise<DiagnosticResult> {
  const startTime = Date.now();
  
  try {
    console.log('[VPS Diagnostic] 🆕 Testando criação de instância...');
    
    const vpsToken = Deno.env.get('VPS_API_TOKEN') || 'default-token';
    const testInstanceId = `test_diagnostic_${Date.now()}`;
    
    const response = await fetch('http://31.97.24.222:3001/instance/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${vpsToken}`,
        'X-API-Token': vpsToken,
        'apikey': vpsToken
      },
      body: JSON.stringify({
        instanceName: testInstanceId,
        sessionName: 'Diagnostic Test',
        webhook: false,
        qrcode: true
      }),
      signal: AbortSignal.timeout(20000)
    });
    
    const duration = Date.now() - startTime;
    const responseText = await response.text();
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      parsedResponse = { raw: responseText };
    }
    
    // Se criou com sucesso, tentar deletar para limpeza
    if (response.ok && parsedResponse.success) {
      try {
        await fetch('http://31.97.24.222:3001/instance/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${vpsToken}`,
            'X-API-Token': vpsToken,
            'apikey': vpsToken
          },
          body: JSON.stringify({ instanceId: testInstanceId }),
          signal: AbortSignal.timeout(10000)
        });
        console.log('[VPS Diagnostic] 🧹 Instância de teste removida');
      } catch (cleanupError) {
        console.warn('[VPS Diagnostic] ⚠️ Erro ao limpar instância de teste:', cleanupError);
      }
    }
    
    return {
      test: 'VPS Instance Creation',
      success: response.ok && parsedResponse.success,
      duration,
      details: {
        status: response.status,
        testInstanceId,
        response: parsedResponse,
        cleaned: response.ok
      },
      error: response.ok && parsedResponse.success ? undefined : `CREATE FAILED ${response.status}: ${responseText}`
    };
  } catch (error: any) {
    return {
      test: 'VPS Instance Creation',
      success: false,
      duration: Date.now() - startTime,
      details: { error: error.message },
      error: error.message
    };
  }
}

async function testWebhookConnectivity(): Promise<DiagnosticResult> {
  const startTime = Date.now();
  
  try {
    console.log('[VPS Diagnostic] 🔗 Testando webhook...');
    
    const webhookUrl = 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web';
    
    // Testar se nosso próprio webhook responde
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'diagnostic_test',
        instanceId: 'test_diagnostic',
        data: { test: true }
      }),
      signal: AbortSignal.timeout(10000)
    });
    
    const duration = Date.now() - startTime;
    const responseText = await response.text();
    
    return {
      test: 'Webhook Connectivity',
      success: response.ok,
      duration,
      details: {
        status: response.status,
        webhookUrl,
        response: responseText.substring(0, 300)
      },
      error: response.ok ? undefined : `WEBHOOK FAILED ${response.status}: ${responseText}`
    };
  } catch (error: any) {
    return {
      test: 'Webhook Connectivity',
      success: false,
      duration: Date.now() - startTime,
      details: { error: error.message },
      error: error.message
    };
  }
}

serve(async (req) => {
  console.log('[VPS Complete Diagnostic] 🚀 Iniciando diagnóstico completo...');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const results: DiagnosticResult[] = [];
    
    // Executar todos os testes em sequência
    console.log('[VPS Complete Diagnostic] 🔄 Executando testes...');
    
    results.push(await testVPSConnectivity());
    results.push(await testVPSAuthentication());
    results.push(await testVPSInstanceCreation());
    results.push(await testWebhookConnectivity());
    
    // Calcular resumo
    const totalTests = results.length;
    const successfulTests = results.filter(r => r.success).length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    
    const summary = {
      totalTests,
      successfulTests,
      failedTests: totalTests - successfulTests,
      successRate: Math.round((successfulTests / totalTests) * 100),
      totalDuration,
      overallSuccess: successfulTests === totalTests
    };
    
    console.log('[VPS Complete Diagnostic] 📊 Resumo:', summary);
    
    return new Response(
      JSON.stringify({
        success: true,
        diagnostic: {
          summary,
          results,
          recommendations: generateRecommendations(results),
          timestamp: new Date().toISOString()
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error: any) {
    console.error('[VPS Complete Diagnostic] ❌ Erro geral:', error);
    
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

function generateRecommendations(results: DiagnosticResult[]): string[] {
  const recommendations: string[] = [];
  
  const connectivity = results.find(r => r.test === 'VPS Connectivity');
  const auth = results.find(r => r.test === 'VPS Authentication');
  const creation = results.find(r => r.test === 'VPS Instance Creation');
  const webhook = results.find(r => r.test === 'Webhook Connectivity');
  
  if (!connectivity?.success) {
    recommendations.push('❌ VPS não está acessível. Verifique se o servidor está online na porta 3001.');
  }
  
  if (!auth?.success) {
    recommendations.push('❌ Token VPS incorreto. Atualize o secret VPS_API_TOKEN no Supabase.');
    recommendations.push('💡 O token deve começar com "3" para este servidor específico.');
  }
  
  if (!creation?.success) {
    recommendations.push('❌ Criação de instâncias falhou. Verifique endpoints da API VPS.');
  }
  
  if (!webhook?.success) {
    recommendations.push('❌ Webhook não está respondendo. Verifique configuração do Supabase.');
  }
  
  if (results.every(r => r.success)) {
    recommendations.push('✅ Todos os testes passaram! Sistema pronto para integração completa.');
  }
  
  return recommendations;
}
