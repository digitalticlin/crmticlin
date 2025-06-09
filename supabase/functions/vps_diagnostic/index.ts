
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CONFIGURAÇÃO ATUALIZADA: Servidor Webhook na porta 3002
const WEBHOOK_SERVER_URL = 'http://31.97.24.222:3002';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[VPS Diagnostic] 🔍 Iniciando diagnóstico completo do servidor webhook...');

    const diagnostics = {
      server_info: {
        url: WEBHOOK_SERVER_URL,
        port: 3002,
        timestamp: new Date().toISOString()
      },
      connectivity: {
        basic_ping: false,
        health_endpoint: false,
        instances_endpoint: false,
        webhook_config: false
      },
      functionality: {
        can_list_instances: false,
        webhook_active: false,
        endpoints_responding: false
      },
      performance: {
        response_time_ms: 0,
        health_check_time: 0
      }
    };

    // 1. Teste de conectividade básica
    const startTime = Date.now();
    try {
      const pingResponse = await fetch(WEBHOOK_SERVER_URL, { timeout: 5000 });
      diagnostics.connectivity.basic_ping = pingResponse.ok;
      diagnostics.performance.response_time_ms = Date.now() - startTime;
    } catch (error) {
      console.log(`[VPS Diagnostic] ❌ Ping falhou: ${error.message}`);
    }

    // 2. Health check
    const healthStart = Date.now();
    try {
      const healthResponse = await fetch(`${WEBHOOK_SERVER_URL}/health`, { timeout: 5000 });
      diagnostics.connectivity.health_endpoint = healthResponse.ok;
      diagnostics.performance.health_check_time = Date.now() - healthStart;
    } catch (error) {
      console.log(`[VPS Diagnostic] ❌ Health check falhou: ${error.message}`);
    }

    // 3. Teste de instâncias
    try {
      const instancesResponse = await fetch(`${WEBHOOK_SERVER_URL}/instances`, { timeout: 5000 });
      if (instancesResponse.ok) {
        const instancesData = await instancesResponse.json();
        diagnostics.connectivity.instances_endpoint = true;
        diagnostics.functionality.can_list_instances = true;
        diagnostics.functionality.endpoints_responding = true;
      }
    } catch (error) {
      console.log(`[VPS Diagnostic] ❌ Instâncias falhou: ${error.message}`);
    }

    // 4. Status do webhook
    try {
      const webhookResponse = await fetch(`${WEBHOOK_SERVER_URL}/webhook/global/status`, { timeout: 5000 });
      if (webhookResponse.ok) {
        diagnostics.connectivity.webhook_config = true;
        diagnostics.functionality.webhook_active = true;
      }
    } catch (error) {
      console.log(`[VPS Diagnostic] ❌ Webhook status falhou: ${error.message}`);
    }

    // Análise dos resultados
    const totalTests = 
      Object.values(diagnostics.connectivity).filter(v => typeof v === 'boolean').length +
      Object.values(diagnostics.functionality).filter(v => typeof v === 'boolean').length;
    
    const passedTests = 
      Object.values(diagnostics.connectivity).filter(v => v === true).length +
      Object.values(diagnostics.functionality).filter(v => v === true).length;

    const healthScore = Math.round((passedTests / totalTests) * 100);
    const overallStatus = healthScore >= 80 ? 'healthy' : healthScore >= 50 ? 'warning' : 'critical';

    console.log(`[VPS Diagnostic] 📊 Score de saúde: ${healthScore}% (${overallStatus})`);

    return new Response(JSON.stringify({
      success: healthScore >= 50,
      diagnostics,
      summary: {
        health_score: healthScore,
        status: overallStatus,
        tests_passed: passedTests,
        total_tests: totalTests,
        recommendations: healthScore < 80 ? [
          'Verificar se o servidor webhook está rodando na porta 3002',
          'Confirmar se todos os endpoints estão ativos',
          'Testar conectividade de rede'
        ] : ['Sistema funcionando normalmente']
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[VPS Diagnostic] ❌ Erro no diagnóstico:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      server_url: WEBHOOK_SERVER_URL
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
