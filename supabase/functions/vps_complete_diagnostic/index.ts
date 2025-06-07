
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

// CORREÇÃO CRÍTICA: Token VPS correto confirmado pelo usuário
function getVPSToken(): string {
  return Deno.env.get('VPS_API_TOKEN') || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';
}

function getVPSHeaders(): Record<string, string> {
  const token = getVPSToken();
  console.log(`[VPS Complete Diagnostic] 🔑 Using token: ${token.substring(0, 10)}...`);
  
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-API-Token': token,
    'apikey': token,
    'User-Agent': 'WhatsApp-Diagnostic-v4.0'
  };
}

// TESTE 1: Conectividade VPS
async function testVPSConnectivity(): Promise<DiagnosticResult> {
  const startTime = Date.now();
  
  try {
    console.log('[VPS Diagnostic] 🔍 Testando conectividade VPS...');
    
    const response = await fetch('http://31.97.24.222:3001/health', {
      method: 'GET',
      headers: getVPSHeaders(),
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
        body: responseText.substring(0, 500),
        url: 'http://31.97.24.222:3001/health'
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

// TESTE 2: Autenticação VPS CORRIGIDA
async function testVPSAuthentication(): Promise<DiagnosticResult> {
  const startTime = Date.now();
  
  try {
    console.log('[VPS Diagnostic] 🔑 Testando autenticação VPS...');
    
    const token = getVPSToken();
    console.log(`[VPS Diagnostic] Token correto sendo usado: ${token.substring(0, 15)}...`);
    
    const response = await fetch('http://31.97.24.222:3001/instances', {
      method: 'GET',
      headers: getVPSHeaders(),
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
        tokenUsed: token.substring(0, 15) + '...',
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

// TESTE 3: Criação e QR Code End-to-End CORRIGIDO
async function testInstanceCreationWithQR(): Promise<DiagnosticResult> {
  const startTime = Date.now();
  
  try {
    console.log('[VPS Diagnostic] 🆕 Testando criação completa com QR...');
    
    const token = getVPSToken();
    const testInstanceId = `diagnostic_${Date.now()}`;
    const webhookUrl = 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web';
    
    // Criar instância na VPS
    const createResponse = await fetch('http://31.97.24.222:3001/instance/create', {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({
        instanceName: testInstanceId,
        sessionName: 'Diagnostic Test',
        webhookUrl: webhookUrl,
        webhook: true,
        webhook_by_events: true,
        webhookEvents: ['messages.upsert', 'qr.update', 'connection.update'],
        qrcode: true,
        markOnlineOnConnect: true
      }),
      signal: AbortSignal.timeout(30000)
    });
    
    const duration = Date.now() - startTime;
    const responseText = await createResponse.text();
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      parsedResponse = { raw: responseText };
    }
    
    // Se criou, aguardar QR Code e depois deletar
    let qrCodeReceived = false;
    if (createResponse.ok && parsedResponse.success) {
      // Aguardar um pouco para ver se QR Code vem via webhook ou resposta
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verificar se QR Code veio na resposta
      if (parsedResponse.qrCode || parsedResponse.qr) {
        qrCodeReceived = true;
      }
      
      // Tentar obter QR Code diretamente
      try {
        const qrResponse = await fetch(`http://31.97.24.222:3001/instance/qr/${testInstanceId}`, {
          method: 'GET',
          headers: getVPSHeaders(),
          signal: AbortSignal.timeout(10000)
        });
        
        if (qrResponse.ok) {
          const qrData = await qrResponse.text();
          if (qrData && qrData.length > 100) {
            qrCodeReceived = true;
          }
        }
      } catch (qrError) {
        console.log('[VPS Diagnostic] QR Code fetch error:', qrError);
      }
      
      // Limpar instância de teste
      try {
        await fetch('http://31.97.24.222:3001/instance/delete', {
          method: 'POST',
          headers: getVPSHeaders(),
          body: JSON.stringify({ instanceId: testInstanceId }),
          signal: AbortSignal.timeout(10000)
        });
        console.log('[VPS Diagnostic] 🧹 Instância de teste removida');
      } catch (cleanupError) {
        console.warn('[VPS Diagnostic] ⚠️ Erro ao limpar:', cleanupError);
      }
    }
    
    return {
      test: 'Instance Creation + QR Code',
      success: createResponse.ok && parsedResponse.success && qrCodeReceived,
      duration,
      details: {
        status: createResponse.status,
        testInstanceId,
        response: parsedResponse,
        qrCodeReceived,
        webhookConfigured: true,
        tokenUsed: token.substring(0, 15) + '...'
      },
      error: (!createResponse.ok || !parsedResponse.success) 
        ? `CREATE FAILED ${createResponse.status}: ${responseText}`
        : !qrCodeReceived 
        ? 'QR Code não foi gerado/recebido'
        : undefined
    };
  } catch (error: any) {
    return {
      test: 'Instance Creation + QR Code',
      success: false,
      duration: Date.now() - startTime,
      details: { error: error.message },
      error: error.message
    };
  }
}

// TESTE 4: Webhook Conectividade
async function testWebhookConnectivity(): Promise<DiagnosticResult> {
  const startTime = Date.now();
  
  try {
    console.log('[VPS Diagnostic] 🔗 Testando webhook...');
    
    const webhookUrl = 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web';
    
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

// TESTE 5: Supabase Database Health
async function testSupabaseDatabase(): Promise<DiagnosticResult> {
  const startTime = Date.now();
  
  try {
    console.log('[VPS Diagnostic] 💾 Testando Supabase Database...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }
    
    // Testar consulta simples
    const response = await fetch(`${supabaseUrl}/rest/v1/whatsapp_instances?select=count`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    const duration = Date.now() - startTime;
    const responseText = await response.text();
    
    return {
      test: 'Supabase Database',
      success: response.ok,
      duration,
      details: {
        status: response.status,
        supabaseUrl: supabaseUrl.substring(0, 30) + '...',
        response: responseText.substring(0, 200)
      },
      error: response.ok ? undefined : `DB FAILED ${response.status}: ${responseText}`
    };
  } catch (error: any) {
    return {
      test: 'Supabase Database',
      success: false,
      duration: Date.now() - startTime,
      details: { error: error.message },
      error: error.message
    };
  }
}

// TESTE 6: End-to-End Integration Test CORRIGIDO
async function testEndToEndIntegration(): Promise<DiagnosticResult> {
  const startTime = Date.now();
  
  try {
    console.log('[VPS Diagnostic] 🔄 Testando integração end-to-end...');
    
    // Teste simples de chamada da edge function whatsapp_web_server
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/whatsapp_web_server`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        action: 'test_connection'
      }),
      signal: AbortSignal.timeout(15000)
    });
    
    const duration = Date.now() - startTime;
    const responseText = await response.text();
    
    return {
      test: 'End-to-End Integration',
      success: response.ok,
      duration,
      details: {
        status: response.status,
        response: responseText.substring(0, 300),
        vpsTokenBeingUsed: getVPSToken().substring(0, 15) + '...'
      },
      error: response.ok ? undefined : `E2E FAILED ${response.status}: ${responseText}`
    };
  } catch (error: any) {
    return {
      test: 'End-to-End Integration',
      success: false,
      duration: Date.now() - startTime,
      details: { error: error.message },
      error: error.message
    };
  }
}

serve(async (req) => {
  console.log('[VPS Complete Diagnostic] 🚀 CORREÇÃO TOTAL - Iniciando diagnóstico com token correto...');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const results: DiagnosticResult[] = [];
    
    console.log('[VPS Complete Diagnostic] 🔄 Executando todos os testes...');
    
    // Executar todos os testes em sequência
    results.push(await testVPSConnectivity());
    results.push(await testVPSAuthentication());
    results.push(await testSupabaseDatabase());
    results.push(await testWebhookConnectivity());
    results.push(await testInstanceCreationWithQR());
    results.push(await testEndToEndIntegration());
    
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
      overallSuccess: successfulTests === totalTests,
      vpsTokenConfirmed: getVPSToken().substring(0, 15) + '...'
    };
    
    console.log('[VPS Complete Diagnostic] 📊 Resumo completo:', summary);
    
    return new Response(
      JSON.stringify({
        success: true,
        diagnostic: {
          summary,
          results,
          recommendations: generateComprehensiveRecommendations(results),
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

function generateComprehensiveRecommendations(results: DiagnosticResult[]): string[] {
  const recommendations: string[] = [];
  
  const connectivity = results.find(r => r.test === 'VPS Connectivity');
  const auth = results.find(r => r.test === 'VPS Authentication');
  const creation = results.find(r => r.test === 'Instance Creation + QR Code');
  const webhook = results.find(r => r.test === 'Webhook Connectivity');
  const database = results.find(r => r.test === 'Supabase Database');
  const e2e = results.find(r => r.test === 'End-to-End Integration');
  
  if (!connectivity?.success) {
    recommendations.push('🚨 CRÍTICO: VPS não está acessível. Servidor pode estar offline ou firewall bloqueando porta 3001.');
    recommendations.push('🔧 AÇÃO: Verificar status do servidor VPS e configuração de rede.');
  }
  
  if (!auth?.success) {
    recommendations.push('🔐 CRÍTICO: Token VPS incorreto ou inválido.');
    recommendations.push('🔧 AÇÃO: Token corrigido para: 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3');
  }
  
  if (!database?.success) {
    recommendations.push('💾 CRÍTICO: Supabase Database não está respondendo.');
    recommendations.push('🔧 AÇÃO: Verificar configuração e credenciais do Supabase.');
  }
  
  if (!webhook?.success) {
    recommendations.push('🔗 CRÍTICO: Webhook não está funcionando.');
    recommendations.push('🔧 AÇÃO: QR Codes e mensagens não serão processados automaticamente.');
  }
  
  if (!creation?.success) {
    recommendations.push('🆕 CRÍTICO: Criação de instâncias e QR Code falhando.');
    recommendations.push('🔧 AÇÃO: Fluxo principal de conexão WhatsApp não funciona.');
  }
  
  if (!e2e?.success) {
    recommendations.push('🔄 CRÍTICO: Integração end-to-end falhando.');
    recommendations.push('🔧 AÇÃO: Edge functions não estão comunicando corretamente.');
  }
  
  if (results.every(r => r.success)) {
    recommendations.push('✅ PERFEITO: Todos os testes passaram!');
    recommendations.push('🚀 Sistema pronto para operação completa.');
    recommendations.push('💡 Pode começar a criar instâncias WhatsApp normalmente.');
  } else {
    const failedCount = results.filter(r => !r.success).length;
    recommendations.push(`⚠️ ${failedCount} de ${results.length} testes falharam.`);
    recommendations.push('🔧 Resolver problemas acima antes de usar o sistema.');
    recommendations.push('🔑 TOKEN CORRIGIDO: 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3');
  }
  
  return recommendations;
}
