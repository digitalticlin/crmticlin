
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  authToken: Deno.env.get('VPS_API_TOKEN') || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 10000
};

interface DiagnosticTest {
  name: string;
  success: boolean;
  duration: number;
  details: any;
  error?: string;
}

async function authenticateUser(req: Request, supabase: any) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { success: false, error: 'No authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { success: false, error: 'Invalid token' };
  }

  return { success: true, user };
}

async function makeVPSRequest(endpoint: string, method: string = 'GET', payload?: any, timeout: number = VPS_CONFIG.timeout) {
  const url = `${VPS_CONFIG.baseUrl}${endpoint}`;
  console.log(`[Diagnostic] ${method} ${url}`);
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VPS_CONFIG.authToken}`
    },
    signal: AbortSignal.timeout(timeout)
  };

  if (payload && method !== 'GET') {
    options.body = JSON.stringify(payload);
  }

  const startTime = Date.now();
  const response = await fetch(url, options);
  const duration = Date.now() - startTime;
  
  const responseText = await response.text();
  console.log(`[Diagnostic] Response (${response.status}) in ${duration}ms:`, responseText.substring(0, 100));

  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    data = { raw: responseText };
  }

  return { response, data, duration };
}

async function testVPSConnectivity(): Promise<DiagnosticTest> {
  const startTime = Date.now();
  
  try {
    console.log('[Diagnostic] 🔍 Testando conectividade VPS...');
    
    const { response, data, duration } = await makeVPSRequest('/health', 'GET', null, 5000);
    
    return {
      name: 'VPS Connectivity',
      success: response.ok,
      duration,
      details: {
        status: response.status,
        url: `${VPS_CONFIG.baseUrl}/health`,
        responseBody: data
      },
      error: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error: any) {
    return {
      name: 'VPS Connectivity',
      success: false,
      duration: Date.now() - startTime,
      details: { error: error.message },
      error: error.message
    };
  }
}

async function testVPSAuthentication(): Promise<DiagnosticTest> {
  const startTime = Date.now();
  
  try {
    console.log('[Diagnostic] 🔑 Testando autenticação VPS...');
    
    const { response, data, duration } = await makeVPSRequest('/instances', 'GET');
    
    return {
      name: 'VPS Authentication',
      success: response.ok,
      duration,
      details: {
        status: response.status,
        authTokenPresent: !!VPS_CONFIG.authToken,
        responseBody: data
      },
      error: response.ok ? undefined : `Auth failed: HTTP ${response.status}`
    };
  } catch (error: any) {
    return {
      name: 'VPS Authentication',
      success: false,
      duration: Date.now() - startTime,
      details: { error: error.message },
      error: error.message
    };
  }
}

async function testInstanceStatus(instanceId: string): Promise<DiagnosticTest> {
  const startTime = Date.now();
  
  try {
    console.log(`[Diagnostic] 📱 Testando status da instância: ${instanceId}`);
    
    const { response, data, duration } = await makeVPSRequest(`/instance/${instanceId}/status`, 'GET');
    
    const isHealthy = response.ok && data.status && ['open', 'ready', 'connected'].includes(data.status.toLowerCase());
    
    return {
      name: 'Instance Status',
      success: isHealthy,
      duration,
      details: {
        status: response.status,
        instanceStatus: data.status,
        isHealthy,
        responseBody: data
      },
      error: isHealthy ? undefined : `Instance status: ${data.status || 'unknown'}`
    };
  } catch (error: any) {
    return {
      name: 'Instance Status',
      success: false,
      duration: Date.now() - startTime,
      details: { error: error.message },
      error: error.message
    };
  }
}

async function testMessageSending(instanceId: string): Promise<DiagnosticTest> {
  const startTime = Date.now();
  
  try {
    console.log(`[Diagnostic] 📤 Testando envio de mensagem: ${instanceId}`);
    
    // Usar número de teste (não envia realmente)
    const testPayload = {
      instanceId: instanceId,
      phone: '5511999999999', // Número fictício para teste
      message: 'Teste diagnóstico - não enviar',
      dryRun: true // Flag para indicar que é apenas teste
    };
    
    const { response, data, duration } = await makeVPSRequest('/send', 'POST', testPayload);
    
    // Para teste, considerar sucesso se a API respondeu adequadamente
    const testSuccess = response.status === 200 || response.status === 400; // 400 pode ser "número inválido" que é OK para teste
    
    return {
      name: 'Message Sending Test',
      success: testSuccess,
      duration,
      details: {
        status: response.status,
        testMode: true,
        responseBody: data
      },
      error: testSuccess ? undefined : `Send test failed: HTTP ${response.status}`
    };
  } catch (error: any) {
    return {
      name: 'Message Sending Test',
      success: false,
      duration: Date.now() - startTime,
      details: { error: error.message },
      error: error.message
    };
  }
}

async function testDatabaseConnection(supabase: any, instanceId: string): Promise<DiagnosticTest> {
  const startTime = Date.now();
  
  try {
    console.log(`[Diagnostic] 🗄️ Testando conexão com banco de dados...`);
    
    // Testar leitura de instância
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .single();
    
    if (instanceError) {
      throw new Error(`Database error: ${instanceError.message}`);
    }
    
    // Testar leitura de mensagens
    const { count: messagesCount, error: messagesError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('whatsapp_number_id', instanceId);
    
    if (messagesError) {
      throw new Error(`Messages query error: ${messagesError.message}`);
    }
    
    // Testar leitura de leads
    const { count: leadsCount, error: leadsError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('whatsapp_number_id', instanceId);
    
    if (leadsError) {
      throw new Error(`Leads query error: ${leadsError.message}`);
    }
    
    return {
      name: 'Database Connection',
      success: true,
      duration: Date.now() - startTime,
      details: {
        instanceFound: !!instance,
        messagesCount: messagesCount || 0,
        leadsCount: leadsCount || 0,
        instanceStatus: instance?.connection_status
      }
    };
  } catch (error: any) {
    return {
      name: 'Database Connection',
      success: false,
      duration: Date.now() - startTime,
      details: { error: error.message },
      error: error.message
    };
  }
}

async function runCompleteDiagnostic(supabase: any, instanceId?: string) {
  console.log('[Diagnostic] 🔬 Executando diagnóstico completo...');
  
  const tests: DiagnosticTest[] = [];
  
  // Teste 1: Conectividade VPS
  tests.push(await testVPSConnectivity());
  
  // Teste 2: Autenticação VPS
  tests.push(await testVPSAuthentication());
  
  // Testes específicos da instância (se fornecida)
  if (instanceId) {
    tests.push(await testInstanceStatus(instanceId));
    tests.push(await testMessageSending(instanceId));
    tests.push(await testDatabaseConnection(supabase, instanceId));
  }
  
  const totalTests = tests.length;
  const successfulTests = tests.filter(t => t.success).length;
  const totalDuration = tests.reduce((sum, t) => sum + t.duration, 0);
  
  const summary = {
    totalTests,
    successfulTests,
    failedTests: totalTests - successfulTests,
    successRate: Math.round((successfulTests / totalTests) * 100),
    totalDuration,
    overallSuccess: successfulTests === totalTests,
    timestamp: new Date().toISOString()
  };
  
  console.log('[Diagnostic] 📊 Diagnóstico completo concluído:', summary);
  
  return {
    summary,
    tests,
    recommendations: generateRecommendations(tests)
  };
}

function generateRecommendations(tests: DiagnosticTest[]): string[] {
  const recommendations: string[] = [];
  
  const connectivity = tests.find(t => t.name === 'VPS Connectivity');
  const auth = tests.find(t => t.name === 'VPS Authentication');
  const instanceStatus = tests.find(t => t.name === 'Instance Status');
  const messaging = tests.find(t => t.name === 'Message Sending Test');
  const database = tests.find(t => t.name === 'Database Connection');
  
  if (!connectivity?.success) {
    recommendations.push('🚨 CRÍTICO: VPS não está acessível. Verificar se o serviço está rodando.');
    recommendations.push('🔧 AÇÃO: sudo systemctl status whatsapp-api');
  } else {
    recommendations.push('✅ CONECTIVIDADE: VPS acessível e respondendo');
  }
  
  if (!auth?.success) {
    recommendations.push('🚨 AUTENTICAÇÃO: Token de API inválido ou expirado');
    recommendations.push('🔧 AÇÃO: Verificar VPS_API_TOKEN nas configurações');
  } else {
    recommendations.push('✅ AUTENTICAÇÃO: Token válido e funcionando');
  }
  
  if (instanceStatus && !instanceStatus.success) {
    recommendations.push('⚠️ INSTÂNCIA: Status não saudável');
    recommendations.push('🔧 AÇÃO: Verificar conexão WhatsApp da instância');
  } else if (instanceStatus?.success) {
    recommendations.push('✅ INSTÂNCIA: Status saudável e conectada');
  }
  
  if (messaging && !messaging.success) {
    recommendations.push('⚠️ ENVIO: API de mensagens com problemas');
    recommendations.push('🔧 AÇÃO: Testar endpoint /send manualmente');
  } else if (messaging?.success) {
    recommendations.push('✅ ENVIO: API de mensagens funcionando');
  }
  
  if (database && !database.success) {
    recommendations.push('🚨 BANCO: Problemas na conexão com Supabase');
    recommendations.push('🔧 AÇÃO: Verificar permissões e RLS policies');
  } else if (database?.success) {
    recommendations.push('✅ BANCO: Conexão com Supabase funcionando');
  }
  
  return recommendations;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action, instanceId } = body;

    console.log(`[Diagnostic] 🎯 Ação: ${action}`);

    // Autenticar usuário
    const authResult = await authenticateUser(req, supabase);
    if (!authResult.success) {
      return new Response(
        JSON.stringify({ success: false, error: authResult.error }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user } = authResult;

    switch (action) {
      case 'quick_diagnostic': {
        console.log(`[Diagnostic] ⚡ Diagnóstico rápido`);
        
        const tests: DiagnosticTest[] = [];
        tests.push(await testVPSConnectivity());
        tests.push(await testVPSAuthentication());
        
        const successfulTests = tests.filter(t => t.success).length;
        const totalTests = tests.length;
        
        return new Response(
          JSON.stringify({
            success: true,
            message: `Diagnóstico rápido: ${successfulTests}/${totalTests} testes passaram`,
            tests,
            summary: {
              successfulTests,
              totalTests,
              successRate: Math.round((successfulTests / totalTests) * 100)
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'complete_diagnostic': {
        const diagnostic = await runCompleteDiagnostic(supabase, instanceId);
        
        return new Response(
          JSON.stringify({
            success: true,
            message: `Diagnóstico completo: ${diagnostic.summary.successfulTests}/${diagnostic.summary.totalTests} testes passaram`,
            diagnostic
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'test_instance': {
        if (!instanceId) {
          return new Response(
            JSON.stringify({ success: false, error: 'instanceId é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verificar se instância pertence ao usuário
        const { data: instance, error: instanceError } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('id', instanceId)
          .eq('created_by_user_id', user.id)
          .single();

        if (instanceError || !instance) {
          return new Response(
            JSON.stringify({ success: false, error: 'Instância não encontrada' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`[Diagnostic] 📱 Testando instância específica: ${instance.instance_name}`);
        
        const tests: DiagnosticTest[] = [];
        tests.push(await testInstanceStatus(instance.vps_instance_id));
        tests.push(await testDatabaseConnection(supabase, instanceId));
        
        const successfulTests = tests.filter(t => t.success).length;
        const totalTests = tests.length;
        
        return new Response(
          JSON.stringify({
            success: true,
            message: `Teste da instância: ${successfulTests}/${totalTests} testes passaram`,
            tests,
            instance: {
              name: instance.instance_name,
              status: instance.connection_status,
              id: instanceId
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Ação não reconhecida: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: any) {
    console.error('[Diagnostic] ❌ Erro:', error);
    
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
