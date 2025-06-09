
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
    console.log('[VPS Test] 🧪 Testando conexão com servidor webhook na porta 3002...');

    const tests = {
      basic_connection: false,
      health_check: false,
      instances_endpoint: false,
      webhook_status: false
    };

    // 1. Teste básico de conexão
    try {
      const basicResponse = await fetch(WEBHOOK_SERVER_URL, { timeout: 5000 });
      tests.basic_connection = basicResponse.ok;
      console.log(`[VPS Test] ${tests.basic_connection ? '✅' : '❌'} Conexão básica`);
    } catch (error) {
      console.log(`[VPS Test] ❌ Conexão básica falhou: ${error.message}`);
    }

    // 2. Teste de health check
    try {
      const healthResponse = await fetch(`${WEBHOOK_SERVER_URL}/health`, { timeout: 5000 });
      tests.health_check = healthResponse.ok;
      console.log(`[VPS Test] ${tests.health_check ? '✅' : '❌'} Health check`);
    } catch (error) {
      console.log(`[VPS Test] ❌ Health check falhou: ${error.message}`);
    }

    // 3. Teste de endpoint de instâncias
    try {
      const instancesResponse = await fetch(`${WEBHOOK_SERVER_URL}/instances`, { timeout: 5000 });
      tests.instances_endpoint = instancesResponse.ok;
      console.log(`[VPS Test] ${tests.instances_endpoint ? '✅' : '❌'} Endpoint de instâncias`);
    } catch (error) {
      console.log(`[VPS Test] ❌ Endpoint de instâncias falhou: ${error.message}`);
    }

    // 4. Teste de status do webhook
    try {
      const webhookResponse = await fetch(`${WEBHOOK_SERVER_URL}/webhook/global/status`, { timeout: 5000 });
      tests.webhook_status = webhookResponse.ok;
      console.log(`[VPS Test] ${tests.webhook_status ? '✅' : '❌'} Status do webhook`);
    } catch (error) {
      console.log(`[VPS Test] ❌ Status do webhook falhou: ${error.message}`);
    }

    const allPassed = Object.values(tests).every(test => test === true);
    const summary = allPassed ? 'Todos os testes passaram' : 'Alguns testes falharam';

    console.log(`[VPS Test] 📊 Resultado final: ${summary}`);

    return new Response(JSON.stringify({
      success: allPassed,
      tests,
      server_url: WEBHOOK_SERVER_URL,
      server_port: 3002,
      summary,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[VPS Test] ❌ Erro geral:', error);
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
