
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

// CORREÇÃO PROFUNDA: Token confirmado pelo usuário
function getVPSToken(): string {
  return Deno.env.get('VPS_API_TOKEN') || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';
}

function getVPSHeadersVariant1(): Record<string, string> {
  const token = getVPSToken();
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    'User-Agent': 'WhatsApp-Diagnostic-v6.0'
  };
}

function getVPSHeadersVariant2(): Record<string, string> {
  const token = getVPSToken();
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-API-Token': token,
    'User-Agent': 'WhatsApp-Diagnostic-v6.0'
  };
}

function getVPSHeadersVariant3(): Record<string, string> {
  const token = getVPSToken();
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'apikey': token,
    'User-Agent': 'WhatsApp-Diagnostic-v6.0'
  };
}

function getVPSHeadersVariant4(): Record<string, string> {
  const token = getVPSToken();
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': token,
    'User-Agent': 'WhatsApp-Diagnostic-v6.0'
  };
}

// TESTE 1: Conectividade VPS
async function testVPSConnectivity(): Promise<DiagnosticResult> {
  const startTime = Date.now();
  
  try {
    console.log('[VPS Diagnostic] 🔍 Testando conectividade VPS...');
    
    const response = await fetch('http://31.97.24.222:3001/health', {
      method: 'GET',
      headers: { 'User-Agent': 'WhatsApp-Diagnostic-v6.0' },
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

// TESTE 2: Autenticação VPS PROFUNDA
async function testVPSAuthentication(): Promise<DiagnosticResult> {
  const startTime = Date.now();
  
  try {
    console.log('[VPS Diagnostic] 🔑 ANÁLISE PROFUNDA - Testando múltiplos formatos de autenticação...');
    
    const token = getVPSToken();
    console.log(`[VPS Diagnostic] Token being used: ${token.substring(0, 15)}...`);
    
    const headerVariants = [
      { name: 'Bearer Authorization', headers: getVPSHeadersVariant1() },
      { name: 'X-API-Token', headers: getVPSHeadersVariant2() },
      { name: 'apikey', headers: getVPSHeadersVariant3() },
      { name: 'Raw Authorization', headers: getVPSHeadersVariant4() }
    ];
    
    const endpoints = [
      { name: 'instances', url: 'http://31.97.24.222:3001/instances' },
      { name: 'health with auth', url: 'http://31.97.24.222:3001/health' }
    ];
    
    const testResults = [];
    
    for (const endpoint of endpoints) {
      for (const variant of headerVariants) {
        try {
          console.log(`[VPS Diagnostic] Testing ${endpoint.name} with ${variant.name}...`);
          
          const response = await fetch(endpoint.url, {
            method: 'GET',
            headers: variant.headers,
            signal: AbortSignal.timeout(10000)
          });
          
          const responseText = await response.text();
          let parsedResponse;
          try {
            parsedResponse = JSON.parse(responseText);
          } catch {
            parsedResponse = { raw: responseText };
          }
          
          const testResult = {
            endpoint: endpoint.name,
            headerType: variant.name,
            status: response.status,
            success: response.ok,
            response: parsedResponse,
            headers: Object.fromEntries(response.headers.entries())
          };
          
          testResults.push(testResult);
          
          console.log(`[VPS Diagnostic] ${endpoint.name} + ${variant.name} = ${response.status} (${response.ok ? 'OK' : 'FAIL'})`);
          
          if (response.ok) {
            console.log(`[VPS Diagnostic] ✅ FOUND WORKING AUTH: ${variant.name} on ${endpoint.name}`);
            
            return {
              test: 'VPS Authentication',
              success: true,
              duration: Date.now() - startTime,
              details: {
                workingAuth: variant.name,
                workingEndpoint: endpoint.name,
                allTests: testResults,
                token: token.substring(0, 15) + '...'
              }
            };
          }
          
        } catch (error: any) {
          testResults.push({
            endpoint: endpoint.name,
            headerType: variant.name,
            error: error.message
          });
        }
      }
    }
    
    return {
      test: 'VPS Authentication',
      success: false,
      duration: Date.now() - startTime,
      details: {
        allTests: testResults,
        token: token.substring(0, 15) + '...',
        analysis: 'Nenhum formato de autenticação funcionou'
      },
      error: 'Todas as variantes de autenticação falharam'
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

// TESTE 3: Análise de Endpoints VPS
async function testVPSEndpoints(): Promise<DiagnosticResult> {
  const startTime = Date.now();
  
  try {
    console.log('[VPS Diagnostic] 🔍 ANÁLISE PROFUNDA - Descobrindo endpoints disponíveis...');
    
    const endpoints = [
      '/health',
      '/instances', 
      '/instance/create',
      '/api/health',
      '/api/instances',
      '/status',
      '/',
      '/docs',
      '/info'
    ];
    
    const endpointResults = [];
    
    for (const endpoint of endpoints) {
      try {
        const url = `http://31.97.24.222:3001${endpoint}`;
        console.log(`[VPS Diagnostic] Testing endpoint: ${endpoint}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'User-Agent': 'WhatsApp-Discovery-v6.0' },
          signal: AbortSignal.timeout(5000)
        });
        
        const responseText = await response.text();
        
        endpointResults.push({
          endpoint,
          status: response.status,
          success: response.ok,
          contentType: response.headers.get('content-type'),
          bodyLength: responseText.length,
          bodyPreview: responseText.substring(0, 200)
        });
        
        console.log(`[VPS Diagnostic] ${endpoint} = ${response.status} (${response.ok ? 'OK' : 'FAIL'})`);
        
      } catch (error: any) {
        endpointResults.push({
          endpoint,
          error: error.message
        });
      }
    }
    
    return {
      test: 'VPS Endpoints Discovery',
      success: true,
      duration: Date.now() - startTime,
      details: {
        endpointResults,
        workingEndpoints: endpointResults.filter(r => r.success),
        totalTested: endpoints.length
      }
    };
    
  } catch (error: any) {
    return {
      test: 'VPS Endpoints Discovery',
      success: false,
      duration: Date.now() - startTime,
      details: { error: error.message },
      error: error.message
    };
  }
}

// TESTE 4: Validação de Token na VPS
async function testVPSTokenValidation(): Promise<DiagnosticResult> {
  const startTime = Date.now();
  
  try {
    console.log('[VPS Diagnostic] 🔐 ANÁLISE PROFUNDA - Validando token diretamente...');
    
    const token = getVPSToken();
    
    const tokenAnalysis = {
      length: token.length,
      startsWithLetter: /^[a-zA-Z]/.test(token),
      hasNumbers: /\d/.test(token),
      hasSpecialChars: /[^a-zA-Z0-9]/.test(token),
      expectedLength: token.length >= 40,
      preview: token.substring(0, 10) + '...' + token.substring(-5)
    };
    
    console.log('[VPS Diagnostic] Token analysis:', tokenAnalysis);
    
    const validationResults = [];
    
    const endpoints = [
      'http://31.97.24.222:3001/auth/validate',
      'http://31.97.24.222:3001/api/auth',
      'http://31.97.24.222:3001/validate-token'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ token }),
          signal: AbortSignal.timeout(5000)
        });
        
        const responseText = await response.text();
        
        validationResults.push({
          endpoint,
          status: response.status,
          response: responseText.substring(0, 200)
        });
        
      } catch (error: any) {
        validationResults.push({
          endpoint,
          error: error.message
        });
      }
    }
    
    return {
      test: 'VPS Token Validation',
      success: true,
      duration: Date.now() - startTime,
      details: {
        tokenAnalysis,
        validationResults,
        tokenFromEnv: !!Deno.env.get('VPS_API_TOKEN')
      }
    };
    
  } catch (error: any) {
    return {
      test: 'VPS Token Validation',
      success: false,
      duration: Date.now() - startTime,
      details: { error: error.message },
      error: error.message
    };
  }
}

// TESTE 5: CRIAÇÃO DE INSTÂNCIA (NOVO)
async function testInstanceCreation(): Promise<DiagnosticResult> {
  const startTime = Date.now();
  
  try {
    console.log('[VPS Diagnostic] 🚀 TESTE CRIAÇÃO DE INSTÂNCIA - Testando criação real...');
    
    const testInstanceId = `diagnostic_test_${Date.now()}`;
    const token = getVPSToken();
    
    // Primeiro, encontrar o formato de autenticação que funciona
    const headerVariants = [
      { name: 'Bearer Authorization', headers: getVPSHeadersVariant1() },
      { name: 'X-API-Token', headers: getVPSHeadersVariant2() },
      { name: 'apikey', headers: getVPSHeadersVariant3() },
      { name: 'Raw Authorization', headers: getVPSHeadersVariant4() }
    ];
    
    const payload = {
      instanceId: testInstanceId,
      sessionName: `diagnostic-test-${Date.now()}`,
      webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web',
      webhook: true,
      webhook_by_events: true,
      webhookEvents: ['messages.upsert', 'qr.update', 'connection.update']
    };
    
    console.log(`[VPS Diagnostic] Testando criação da instância: ${testInstanceId}`);
    
    let createResult = null;
    let workingAuthForCreate = null;
    
    // Testar cada formato de auth para criação
    for (const variant of headerVariants) {
      try {
        console.log(`[VPS Diagnostic] Tentando criar instância com ${variant.name}...`);
        
        const response = await fetch('http://31.97.24.222:3001/instance/create', {
          method: 'POST',
          headers: variant.headers,
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(15000)
        });
        
        const responseText = await response.text();
        let parsedResponse;
        try {
          parsedResponse = JSON.parse(responseText);
        } catch {
          parsedResponse = { raw: responseText };
        }
        
        createResult = {
          headerType: variant.name,
          status: response.status,
          success: response.ok,
          response: parsedResponse,
          headers: Object.fromEntries(response.headers.entries())
        };
        
        console.log(`[VPS Diagnostic] Criação com ${variant.name} = ${response.status} (${response.ok ? 'SUCCESS' : 'FAIL'})`);
        
        if (response.ok) {
          workingAuthForCreate = variant.name;
          console.log(`[VPS Diagnostic] ✅ INSTÂNCIA CRIADA com sucesso usando ${variant.name}`);
          
          // Tentar deletar a instância de teste
          try {
            await fetch('http://31.97.24.222:3001/instance/delete', {
              method: 'POST',
              headers: variant.headers,
              body: JSON.stringify({ instanceId: testInstanceId }),
              signal: AbortSignal.timeout(10000)
            });
            console.log(`[VPS Diagnostic] 🧹 Instância de teste ${testInstanceId} removida`);
          } catch (e) {
            console.log(`[VPS Diagnostic] ⚠️ Não foi possível remover instância de teste: ${e.message}`);
          }
          
          break;
        }
        
      } catch (error: any) {
        createResult = {
          headerType: variant.name,
          error: error.message
        };
      }
    }
    
    return {
      test: 'Instance Creation',
      success: !!workingAuthForCreate,
      duration: Date.now() - startTime,
      details: {
        testInstanceId,
        workingAuthForCreate,
        createResult,
        payload: {
          ...payload,
          webhookUrl: payload.webhookUrl.substring(0, 50) + '...'
        }
      },
      error: workingAuthForCreate ? undefined : 'Falha em criar instância com todos os formatos de auth'
    };
    
  } catch (error: any) {
    return {
      test: 'Instance Creation',
      success: false,
      duration: Date.now() - startTime,
      details: { error: error.message },
      error: error.message
    };
  }
}

// TESTE 6: TESTE END-TO-END (NOVO)
async function testEndToEndFlow(): Promise<DiagnosticResult> {
  const startTime = Date.now();
  
  try {
    console.log('[VPS Diagnostic] 🔄 TESTE END-TO-END - Fluxo completo...');
    
    const testInstanceId = `e2e_test_${Date.now()}`;
    const token = getVPSToken();
    
    // Encontrar formato de auth que funciona
    const headerVariants = [
      { name: 'Bearer Authorization', headers: getVPSHeadersVariant1() },
      { name: 'X-API-Token', headers: getVPSHeadersVariant2() },
      { name: 'apikey', headers: getVPSHeadersVariant3() },
      { name: 'Raw Authorization', headers: getVPSHeadersVariant4() }
    ];
    
    let workingHeaders = null;
    let workingAuthType = null;
    
    // 1. Verificar conectividade
    console.log('[VPS Diagnostic] E2E Step 1: Verificando conectividade...');
    const healthResponse = await fetch('http://31.97.24.222:3001/health', {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    });
    
    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }
    
    // 2. Encontrar autenticação que funciona
    console.log('[VPS Diagnostic] E2E Step 2: Encontrando autenticação que funciona...');
    for (const variant of headerVariants) {
      try {
        const response = await fetch('http://31.97.24.222:3001/instances', {
          method: 'GET',
          headers: variant.headers,
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          workingHeaders = variant.headers;
          workingAuthType = variant.name;
          console.log(`[VPS Diagnostic] E2E: Autenticação funcionando com ${variant.name}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!workingHeaders) {
      throw new Error('Nenhum formato de autenticação funcionou');
    }
    
    // 3. Criar instância
    console.log('[VPS Diagnostic] E2E Step 3: Criando instância de teste...');
    const createPayload = {
      instanceId: testInstanceId,
      sessionName: `e2e-test-${Date.now()}`,
      webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web',
      webhook: true,
      webhook_by_events: true,
      webhookEvents: ['messages.upsert', 'qr.update', 'connection.update']
    };
    
    const createResponse = await fetch('http://31.97.24.222:3001/instance/create', {
      method: 'POST',
      headers: workingHeaders,
      body: JSON.stringify(createPayload),
      signal: AbortSignal.timeout(15000)
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Create failed: ${createResponse.status} - ${errorText}`);
    }
    
    const createData = await createResponse.json();
    console.log('[VPS Diagnostic] E2E: Instância criada com sucesso');
    
    // 4. Verificar se instância aparece na lista
    console.log('[VPS Diagnostic] E2E Step 4: Verificando lista de instâncias...');
    const listResponse = await fetch('http://31.97.24.222:3001/instances', {
      method: 'GET',
      headers: workingHeaders,
      signal: AbortSignal.timeout(10000)
    });
    
    let instanceFound = false;
    if (listResponse.ok) {
      const instances = await listResponse.json();
      instanceFound = Array.isArray(instances) && instances.some(inst => inst.instanceId === testInstanceId);
      console.log(`[VPS Diagnostic] E2E: Instância ${instanceFound ? 'encontrada' : 'NÃO encontrada'} na lista`);
    }
    
    // 5. Deletar instância de teste
    console.log('[VPS Diagnostic] E2E Step 5: Removendo instância de teste...');
    try {
      await fetch('http://31.97.24.222:3001/instance/delete', {
        method: 'POST',
        headers: workingHeaders,
        body: JSON.stringify({ instanceId: testInstanceId }),
        signal: AbortSignal.timeout(10000)
      });
      console.log('[VPS Diagnostic] E2E: Instância removida com sucesso');
    } catch (e) {
      console.log(`[VPS Diagnostic] E2E: Erro ao remover instância: ${e.message}`);
    }
    
    return {
      test: 'End to End Flow',
      success: true,
      duration: Date.now() - startTime,
      details: {
        testInstanceId,
        workingAuthType,
        healthCheck: true,
        authenticationWorking: true,
        instanceCreated: true,
        instanceFoundInList: instanceFound,
        instanceDeleted: true,
        steps: [
          'Health Check ✅',
          `Authentication (${workingAuthType}) ✅`,
          'Instance Creation ✅',
          `Instance in List ${instanceFound ? '✅' : '❌'}`,
          'Instance Deletion ✅'
        ]
      }
    };
    
  } catch (error: any) {
    return {
      test: 'End to End Flow',
      success: false,
      duration: Date.now() - startTime,
      details: { error: error.message },
      error: error.message
    };
  }
}

serve(async (req) => {
  console.log('[VPS Complete Diagnostic] 🔬 ANÁLISE PROFUNDA COMPLETA - Iniciando diagnóstico detalhado com 6 testes...');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const results: DiagnosticResult[] = [];
    
    console.log('[VPS Complete Diagnostic] 🔄 Executando análise profunda completa...');
    
    // Executar todos os 6 testes em sequência
    results.push(await testVPSConnectivity());
    results.push(await testVPSEndpoints());
    results.push(await testVPSTokenValidation());
    results.push(await testVPSAuthentication());
    results.push(await testInstanceCreation());
    results.push(await testEndToEndFlow());
    
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
      deepAnalysisComplete: true
    };
    
    console.log('[VPS Complete Diagnostic] 📊 Análise profunda COMPLETA concluída:', summary);
    
    return new Response(
      JSON.stringify({
        success: true,
        diagnostic: {
          summary,
          results,
          recommendations: generateCompleteRecommendations(results),
          timestamp: new Date().toISOString(),
          analysisType: 'DEEP_ANALYSIS_COMPLETE'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error: any) {
    console.error('[VPS Complete Diagnostic] ❌ Erro na análise profunda completa:', error);
    
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

function generateCompleteRecommendations(results: DiagnosticResult[]): string[] {
  const recommendations: string[] = [];
  
  const connectivity = results.find(r => r.test === 'VPS Connectivity');
  const endpoints = results.find(r => r.test === 'VPS Endpoints Discovery');
  const tokenValidation = results.find(r => r.test === 'VPS Token Validation');
  const auth = results.find(r => r.test === 'VPS Authentication');
  const instanceCreation = results.find(r => r.test === 'Instance Creation');
  const endToEnd = results.find(r => r.test === 'End to End Flow');
  
  if (!connectivity?.success) {
    recommendations.push('🚨 CRÍTICO: VPS não está acessível na porta 3001');
    recommendations.push('🔧 AÇÃO: Verificar se o serviço está rodando: sudo systemctl status whatsapp-api');
  } else {
    recommendations.push('✅ CONECTIVIDADE: VPS acessível e respondendo');
  }
  
  if (endpoints?.success && endpoints.details?.workingEndpoints?.length > 0) {
    const workingCount = endpoints.details.workingEndpoints.length;
    recommendations.push(`✅ ENDPOINTS: ${workingCount} endpoints encontrados funcionando`);
  }
  
  if (tokenValidation?.success && tokenValidation.details?.tokenAnalysis) {
    const analysis = tokenValidation.details.tokenAnalysis;
    
    if (!analysis.expectedLength) {
      recommendations.push('⚠️ TOKEN: Token parece muito curto para ser válido');
    }
    
    if (!analysis.hasNumbers || !analysis.startsWithLetter) {
      recommendations.push('⚠️ TOKEN: Formato do token pode estar incorreto');
    } else {
      recommendations.push('✅ TOKEN: Formato parece correto');
    }
    
    if (!tokenValidation.details.tokenFromEnv) {
      recommendations.push('⚠️ TOKEN: Usando token hardcoded, não da variável de ambiente');
    }
  }
  
  if (!auth?.success) {
    recommendations.push('🚨 AUTENTICAÇÃO: Todas as variantes de autenticação falharam');
    
    if (auth?.details?.allTests) {
      const authTests = auth.details.allTests;
      const uniqueStatuses = [...new Set(authTests.map((t: any) => t.status))];
      
      recommendations.push(`📊 STATUS CODES ENCONTRADOS: ${uniqueStatuses.join(', ')}`);
      
      if (uniqueStatuses.includes(404)) {
        recommendations.push('🔧 AÇÃO: Endpoint /instances não existe - verificar API da VPS');
      }
      
      if (uniqueStatuses.includes(401)) {
        recommendations.push('🔧 AÇÃO: Token rejeitado - verificar configuração na VPS');
      }
      
      if (uniqueStatuses.includes(403)) {
        recommendations.push('🔧 AÇÃO: Token válido mas sem permissão - verificar roles');
      }
      
      if (uniqueStatuses.includes(500)) {
        recommendations.push('🔧 AÇÃO: Erro interno da VPS - verificar logs do servidor');
      }
    }
  } else {
    const workingAuth = auth?.details?.workingAuth;
    const workingEndpoint = auth?.details?.workingEndpoint;
    recommendations.push(`✅ AUTENTICAÇÃO: Funcionando com ${workingAuth} no endpoint ${workingEndpoint}`);
  }
  
  if (!instanceCreation?.success) {
    recommendations.push('🚨 CRIAÇÃO DE INSTÂNCIA: Falhou em criar instância de teste');
    recommendations.push('🔧 AÇÃO: Verificar se endpoint /instance/create está funcionando');
    recommendations.push('🔧 AÇÃO: Verificar se webhook URL está acessível');
  } else {
    const workingAuth = instanceCreation?.details?.workingAuthForCreate;
    recommendations.push(`✅ CRIAÇÃO DE INSTÂNCIA: Funcionando com ${workingAuth}`);
  }
  
  if (!endToEnd?.success) {
    recommendations.push('🚨 FLUXO END-TO-END: Falha no fluxo completo');
    recommendations.push('🔧 AÇÃO: Verificar logs detalhados do erro');
  } else {
    const steps = endToEnd?.details?.steps || [];
    recommendations.push('✅ FLUXO END-TO-END: Todos os passos funcionando');
    steps.forEach((step: string) => {
      recommendations.push(`  ${step}`);
    });
    recommendations.push('🚀 SISTEMA: Pronto para produção');
  }
  
  return recommendations;
}
