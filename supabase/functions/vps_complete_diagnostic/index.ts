
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

// CORREÇÃO PROFUNDA: Múltiplos formatos de token para testar
function getVPSToken(): string {
  return Deno.env.get('VPS_API_TOKEN') || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';
}

function getVPSHeadersVariant1(): Record<string, string> {
  const token = getVPSToken();
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    'User-Agent': 'WhatsApp-Diagnostic-v5.0'
  };
}

function getVPSHeadersVariant2(): Record<string, string> {
  const token = getVPSToken();
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-API-Token': token,
    'User-Agent': 'WhatsApp-Diagnostic-v5.0'
  };
}

function getVPSHeadersVariant3(): Record<string, string> {
  const token = getVPSToken();
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'apikey': token,
    'User-Agent': 'WhatsApp-Diagnostic-v5.0'
  };
}

function getVPSHeadersVariant4(): Record<string, string> {
  const token = getVPSToken();
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': token,
    'User-Agent': 'WhatsApp-Diagnostic-v5.0'
  };
}

// TESTE 1: Conectividade VPS (mantido)
async function testVPSConnectivity(): Promise<DiagnosticResult> {
  const startTime = Date.now();
  
  try {
    console.log('[VPS Diagnostic] 🔍 Testando conectividade VPS...');
    
    const response = await fetch('http://31.97.24.222:3001/health', {
      method: 'GET',
      headers: { 'User-Agent': 'WhatsApp-Diagnostic-v5.0' },
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

// TESTE 2: Autenticação VPS PROFUNDA - Testar múltiplos formatos
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
          
          // Se encontrou um que funciona, usar este
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
    
    // Se chegou aqui, nenhum formato funcionou
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
          headers: { 'User-Agent': 'WhatsApp-Discovery-v5.0' },
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
    
    // Testar se o token tem formato correto
    const tokenAnalysis = {
      length: token.length,
      startsWithLetter: /^[a-zA-Z]/.test(token),
      hasNumbers: /\d/.test(token),
      hasSpecialChars: /[^a-zA-Z0-9]/.test(token),
      expectedLength: token.length >= 40,
      preview: token.substring(0, 10) + '...' + token.substring(-5)
    };
    
    console.log('[VPS Diagnostic] Token analysis:', tokenAnalysis);
    
    // Testar endpoint específico de validação de token (se existir)
    const endpoints = [
      'http://31.97.24.222:3001/auth/validate',
      'http://31.97.24.222:3001/api/auth',
      'http://31.97.24.222:3001/validate-token'
    ];
    
    const validationResults = [];
    
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

serve(async (req) => {
  console.log('[VPS Complete Diagnostic] 🔬 ANÁLISE PROFUNDA - Iniciando diagnóstico detalhado...');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const results: DiagnosticResult[] = [];
    
    console.log('[VPS Complete Diagnostic] 🔄 Executando análise profunda...');
    
    // Executar análise profunda em sequência
    results.push(await testVPSConnectivity());
    results.push(await testVPSEndpoints());
    results.push(await testVPSTokenValidation());
    results.push(await testVPSAuthentication());
    
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
    
    console.log('[VPS Complete Diagnostic] 📊 Análise profunda concluída:', summary);
    
    return new Response(
      JSON.stringify({
        success: true,
        diagnostic: {
          summary,
          results,
          recommendations: generateDeepAnalysisRecommendations(results),
          timestamp: new Date().toISOString(),
          analysisType: 'DEEP_ANALYSIS'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error: any) {
    console.error('[VPS Complete Diagnostic] ❌ Erro na análise profunda:', error);
    
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

function generateDeepAnalysisRecommendations(results: DiagnosticResult[]): string[] {
  const recommendations: string[] = [];
  
  const connectivity = results.find(r => r.test === 'VPS Connectivity');
  const endpoints = results.find(r => r.test === 'VPS Endpoints Discovery');
  const tokenValidation = results.find(r => r.test === 'VPS Token Validation');
  const auth = results.find(r => r.test === 'VPS Authentication');
  
  if (!connectivity?.success) {
    recommendations.push('🚨 CRÍTICO: VPS não está acessível na porta 3001');
    recommendations.push('🔧 AÇÃO: Verificar se o serviço está rodando: sudo systemctl status whatsapp-api');
  } else {
    recommendations.push('✅ CONECTIVIDADE: VPS acessível e respondendo');
  }
  
  if (endpoints?.success && endpoints.details?.workingEndpoints?.length > 0) {
    const workingCount = endpoints.details.workingEndpoints.length;
    recommendations.push(`✅ ENDPOINTS: ${workingCount} endpoints encontrados funcionando`);
    
    endpoints.details.workingEndpoints.forEach((ep: any) => {
      recommendations.push(`  📍 ${ep.endpoint} (${ep.status})`);
    });
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
    
    recommendations.push('🔧 PRÓXIMOS PASSOS:');
    recommendations.push('  1. SSH na VPS e verificar logs: sudo journalctl -u whatsapp-api -f');
    recommendations.push('  2. Verificar se token está configurado no servidor');
    recommendations.push('  3. Confirmar se API está configurada para aceitar este token');
    
  } else {
    const workingAuth = auth?.details?.workingAuth;
    const workingEndpoint = auth?.details?.workingEndpoint;
    recommendations.push(`✅ AUTENTICAÇÃO: Funcionando com ${workingAuth} no endpoint ${workingEndpoint}`);
    recommendations.push('🚀 SISTEMA: Pronto para criação de instâncias');
  }
  
  return recommendations;
}
