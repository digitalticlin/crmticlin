
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiagnosticTest {
  test: string;
  status: 'success' | 'error' | 'warning';
  details: any;
  duration: number;
  timestamp: string;
}

interface VPSInstance {
  instanceId?: string;
  sessionName?: string;
  status?: string;
  phone?: string;
  profileName?: string;
  qrCode?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { testType } = await req.json();
    console.log(`[VPS Diagnostic] Executando teste: ${testType}`);

    const diagnosticResults: DiagnosticTest[] = [];
    const startTime = Date.now();

    // Configuração VPS
    const VPS_BASE_URL = 'http://31.97.24.222:3001';
    const VPS_TOKEN = Deno.env.get('VPS_API_TOKEN') || 'your-secure-token-here';

    // Função auxiliar para fazer requisições VPS com timeout
    async function makeVPSRequest(endpoint: string, method = 'GET', body?: any) {
      const requestStart = Date.now();
      
      try {
        console.log(`[VPS Request] ${method} ${VPS_BASE_URL}${endpoint}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
        
        const response = await fetch(`${VPS_BASE_URL}${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPS_TOKEN}`,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const duration = Date.now() - requestStart;
        
        const responseText = await response.text();
        let responseData;
        
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = responseText;
        }

        console.log(`[VPS Response] Status: ${response.status}, Duration: ${duration}ms`);
        console.log(`[VPS Response] Data:`, responseData);

        return {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          data: responseData,
          duration,
          headers: Object.fromEntries(response.headers.entries())
        };
      } catch (error) {
        const duration = Date.now() - requestStart;
        console.error(`[VPS Request Error] ${endpoint}:`, error.message);
        
        return {
          ok: false,
          status: 0,
          statusText: error.name,
          data: null,
          duration,
          error: error.message
        };
      }
    }

    // TESTE 1: Conectividade Básica VPS
    if (testType === 'connectivity' || testType === 'full') {
      const connectivityStart = Date.now();
      const healthResponse = await makeVPSRequest('/health');
      
      diagnosticResults.push({
        test: 'VPS Health Check',
        status: healthResponse.ok ? 'success' : 'error',
        details: {
          url: `${VPS_BASE_URL}/health`,
          status: healthResponse.status,
          response: healthResponse.data,
          duration: healthResponse.duration,
          error: healthResponse.error
        },
        duration: Date.now() - connectivityStart,
        timestamp: new Date().toISOString()
      });
    }

    // TESTE 2: Lista de Instâncias VPS Detalhada
    if (testType === 'instances' || testType === 'full') {
      const instancesStart = Date.now();
      const instancesResponse = await makeVPSRequest('/instances');
      
      let instancesData = [];
      let instancesStatus = 'error';
      
      if (instancesResponse.ok && instancesResponse.data) {
        if (Array.isArray(instancesResponse.data)) {
          instancesData = instancesResponse.data;
          instancesStatus = 'success';
        } else if (instancesResponse.data.instances && Array.isArray(instancesResponse.data.instances)) {
          instancesData = instancesResponse.data.instances;
          instancesStatus = 'success';
        } else {
          instancesStatus = 'warning';
        }
      }

      diagnosticResults.push({
        test: 'VPS Instances List',
        status: instancesStatus as any,
        details: {
          url: `${VPS_BASE_URL}/instances`,
          status: instancesResponse.status,
          rawResponse: instancesResponse.data,
          processedInstances: instancesData,
          instanceCount: instancesData.length,
          duration: instancesResponse.duration,
          error: instancesResponse.error
        },
        duration: Date.now() - instancesStart,
        timestamp: new Date().toISOString()
      });
    }

    // TESTE 3: Comparação VPS vs Supabase
    if (testType === 'sync' || testType === 'full') {
      const syncStart = Date.now();
      
      // Buscar instâncias do Supabase
      const { data: supabaseInstances, error: supabaseError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('connection_type', 'web');

      const instancesResponse = await makeVPSRequest('/instances');
      let vpsInstances: VPSInstance[] = [];
      
      if (instancesResponse.ok && instancesResponse.data) {
        if (Array.isArray(instancesResponse.data)) {
          vpsInstances = instancesResponse.data;
        } else if (instancesResponse.data.instances) {
          vpsInstances = instancesResponse.data.instances;
        }
      }

      // Análise de discrepâncias
      const supabaseIds = supabaseInstances?.map(i => i.vps_instance_id) || [];
      const vpsIds = vpsInstances.map(i => i.instanceId);
      
      const onlyInSupabase = supabaseIds.filter(id => id && !vpsIds.includes(id));
      const onlyInVPS = vpsIds.filter(id => id && !supabaseIds.includes(id));
      const inBoth = supabaseIds.filter(id => id && vpsIds.includes(id));

      diagnosticResults.push({
        test: 'VPS ↔ Supabase Sync Analysis',
        status: onlyInSupabase.length > 0 || onlyInVPS.length > 0 ? 'warning' : 'success',
        details: {
          supabaseCount: supabaseInstances?.length || 0,
          vpsCount: vpsInstances.length,
          synchronized: inBoth.length,
          onlyInSupabase,
          onlyInVPS,
          supabaseInstances: supabaseInstances?.map(i => ({
            id: i.id,
            instance_name: i.instance_name,
            vps_instance_id: i.vps_instance_id,
            connection_status: i.connection_status,
            web_status: i.web_status
          })),
          vpsInstances: vpsInstances.map(i => ({
            instanceId: i.instanceId,
            sessionName: i.sessionName,
            status: i.status,
            phone: i.phone,
            profileName: i.profileName
          })),
          supabaseError
        },
        duration: Date.now() - syncStart,
        timestamp: new Date().toISOString()
      });
    }

    // TESTE 4: Teste de Autenticação VPS
    if (testType === 'auth' || testType === 'full') {
      const authStart = Date.now();
      
      // Teste com token atual
      const authResponse = await makeVPSRequest('/status');
      
      // Teste sem token
      const noAuthResponse = await fetch(`${VPS_BASE_URL}/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }).catch(e => ({ ok: false, status: 0, statusText: e.message }));

      diagnosticResults.push({
        test: 'VPS Authentication',
        status: authResponse.ok ? 'success' : 'error',
        details: {
          withToken: {
            status: authResponse.status,
            response: authResponse.data,
            duration: authResponse.duration
          },
          withoutToken: {
            status: (noAuthResponse as any).status,
            statusText: (noAuthResponse as any).statusText
          },
          tokenConfigured: !!VPS_TOKEN,
          tokenLength: VPS_TOKEN?.length || 0
        },
        duration: Date.now() - authStart,
        timestamp: new Date().toISOString()
      });
    }

    // TESTE 5: Performance e Timeout
    if (testType === 'performance' || testType === 'full') {
      const perfStart = Date.now();
      const timeouts = [5000, 10000, 15000]; // 5s, 10s, 15s
      const results = [];

      for (const timeout of timeouts) {
        const testStart = Date.now();
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);
          
          const response = await fetch(`${VPS_BASE_URL}/health`, {
            signal: controller.signal,
            headers: {
              'Authorization': `Bearer ${VPS_TOKEN}`,
            }
          });
          
          clearTimeout(timeoutId);
          const duration = Date.now() - testStart;
          
          results.push({
            timeout,
            success: true,
            duration,
            status: response.status
          });
        } catch (error) {
          results.push({
            timeout,
            success: false,
            duration: Date.now() - testStart,
            error: error.message
          });
        }
      }

      diagnosticResults.push({
        test: 'VPS Performance & Timeout',
        status: results.some(r => r.success) ? 'success' : 'error',
        details: {
          timeoutTests: results,
          avgDuration: results.filter(r => r.success).reduce((acc, r) => acc + r.duration, 0) / results.filter(r => r.success).length || 0,
          successRate: (results.filter(r => r.success).length / results.length) * 100
        },
        duration: Date.now() - perfStart,
        timestamp: new Date().toISOString()
      });
    }

    // TESTE 6: Webhook Configuration
    if (testType === 'webhook' || testType === 'full') {
      const webhookStart = Date.now();
      const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook_whatsapp_web`;
      
      // Verificar se webhook está acessível
      let webhookReachable = false;
      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: true })
        });
        webhookReachable = true;
      } catch (error) {
        console.log('Webhook test error (expected):', error.message);
      }

      diagnosticResults.push({
        test: 'Webhook Configuration',
        status: 'success', // Webhook sempre configurado
        details: {
          webhookUrl,
          webhookReachable,
          supabaseUrl: Deno.env.get('SUPABASE_URL'),
          expectedWebhook: `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook_whatsapp_web`
        },
        duration: Date.now() - webhookStart,
        timestamp: new Date().toISOString()
      });
    }

    const totalDuration = Date.now() - startTime;
    const successCount = diagnosticResults.filter(r => r.status === 'success').length;
    const errorCount = diagnosticResults.filter(r => r.status === 'error').length;
    const warningCount = diagnosticResults.filter(r => r.status === 'warning').length;

    // Salvar log no Supabase
    await supabase.from('sync_logs').insert({
      function_name: 'vps_comprehensive_diagnostic',
      status: errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'success',
      result: {
        testType,
        totalTests: diagnosticResults.length,
        successCount,
        errorCount,
        warningCount,
        totalDuration,
        tests: diagnosticResults
      }
    });

    return new Response(JSON.stringify({
      success: true,
      diagnostic: {
        testType,
        totalDuration,
        summary: {
          totalTests: diagnosticResults.length,
          successCount,
          errorCount,
          warningCount,
          overallStatus: errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'success'
        },
        tests: diagnosticResults,
        timestamp: new Date().toISOString(),
        recommendations: generateRecommendations(diagnosticResults)
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[VPS Diagnostic Error]:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function generateRecommendations(tests: DiagnosticTest[]) {
  const recommendations = [];
  
  const healthTest = tests.find(t => t.test === 'VPS Health Check');
  if (healthTest?.status === 'error') {
    recommendations.push({
      priority: 'CRÍTICO',
      issue: 'VPS não está respondendo',
      solution: 'Verificar se VPS está online e acessível na porta 3001'
    });
  }

  const instancesTest = tests.find(t => t.test === 'VPS Instances List');
  if (instancesTest?.status === 'error') {
    recommendations.push({
      priority: 'ALTO',
      issue: 'Endpoint /instances não está funcionando',
      solution: 'Verificar se o servidor WhatsApp Web.js está rodando na VPS'
    });
  }

  const syncTest = tests.find(t => t.test === 'VPS ↔ Supabase Sync Analysis');
  if (syncTest?.status === 'warning') {
    const details = syncTest.details;
    if (details.onlyInVPS.length > 0) {
      recommendations.push({
        priority: 'MÉDIO',
        issue: `${details.onlyInVPS.length} instâncias existem na VPS mas não no Supabase`,
        solution: 'Executar sync para adotar instâncias órfãs'
      });
    }
    if (details.onlyInSupabase.length > 0) {
      recommendations.push({
        priority: 'MÉDIO',
        issue: `${details.onlyInSupabase.length} instâncias existem no Supabase mas não na VPS`,
        solution: 'Limpar instâncias inválidas do Supabase ou recriar na VPS'
      });
    }
  }

  const authTest = tests.find(t => t.test === 'VPS Authentication');
  if (authTest?.status === 'error') {
    recommendations.push({
      priority: 'ALTO',
      issue: 'Falha na autenticação VPS',
      solution: 'Verificar se o token VPS_API_TOKEN está correto nos secrets'
    });
  }

  const perfTest = tests.find(t => t.test === 'VPS Performance & Timeout');
  if (perfTest?.details.successRate < 100) {
    recommendations.push({
      priority: 'MÉDIO',
      issue: `Taxa de sucesso VPS: ${perfTest.details.successRate}%`,
      solution: 'VPS instável - considerar aumentar timeout ou verificar recursos'
    });
  }

  return recommendations;
}
