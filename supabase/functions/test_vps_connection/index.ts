
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const vpsHost = '31.97.24.222';
    const vpsPort = 3001;
    const results = {
      success: false,
      message: '',
      timestamp: new Date().toISOString(),
      vps: {
        host: vpsHost,
        port: vpsPort,
        type: 'Ubuntu 4GB VPS'
      },
      diagnostics: {
        connectivity: {
          basic_ping: { success: false, details: '' },
          node_server: { success: false, details: '' },
          server_info: { success: false, data: null },
          instances_list: { success: false, data: null },
          webhook_url: { success: false, details: '' }
        },
        analysis: {
          server_running: false,
          has_instances: false,
          webhook_reachable: false,
          total_instances: 0
        }
      },
      recommendations: [] as Array<{
        priority: string;
        issue: string;
        solution: string;
      }>,
      verification_script: '',
      summary: {
        server_status: 'OFFLINE',
        total_issues: 0,
        total_warnings: 0,
        next_steps: [] as string[]
      }
    };

    // Test 1: Basic connectivity
    console.log('Testing basic connectivity...');
    try {
      const healthResponse = await fetch(`http://${vpsHost}:${vpsPort}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });
      
      if (healthResponse.ok) {
        results.diagnostics.connectivity.basic_ping.success = true;
        results.diagnostics.connectivity.basic_ping.details = `Servidor acessível via HTTP (${healthResponse.status})`;
        results.diagnostics.analysis.server_running = true;
      } else {
        results.diagnostics.connectivity.basic_ping.details = `HTTP ${healthResponse.status}: ${healthResponse.statusText}`;
      }
    } catch (error: any) {
      results.diagnostics.connectivity.basic_ping.details = `Erro de conectividade: ${error.message}`;
    }

    // Test 2: Node.js server endpoints
    console.log('Testing Node.js server endpoints...');
    try {
      const infoResponse = await fetch(`http://${vpsHost}:${vpsPort}/info`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });
      
      if (infoResponse.ok) {
        const serverInfo = await infoResponse.json();
        results.diagnostics.connectivity.server_info.success = true;
        results.diagnostics.connectivity.server_info.data = serverInfo;
        results.diagnostics.connectivity.node_server.success = true;
        results.diagnostics.connectivity.node_server.details = 'Servidor Node.js respondendo corretamente';
      } else {
        results.diagnostics.connectivity.node_server.details = `Erro HTTP ${infoResponse.status}`;
      }
    } catch (error: any) {
      results.diagnostics.connectivity.node_server.details = `Erro ao acessar /info: ${error.message}`;
    }

    // Test 3: Instances list
    console.log('Testing instances endpoint...');
    try {
      const instancesResponse = await fetch(`http://${vpsHost}:${vpsPort}/instances`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });
      
      if (instancesResponse.ok) {
        const instancesData = await instancesResponse.json();
        results.diagnostics.connectivity.instances_list.success = true;
        results.diagnostics.connectivity.instances_list.data = instancesData;
        results.diagnostics.analysis.total_instances = Array.isArray(instancesData.instances) ? instancesData.instances.length : 0;
        results.diagnostics.analysis.has_instances = results.diagnostics.analysis.total_instances > 0;
      }
    } catch (error: any) {
      results.diagnostics.connectivity.instances_list.details = `Erro ao listar instâncias: ${error.message}`;
    }

    // Test 4: Webhook connectivity
    console.log('Testing webhook connectivity...');
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook_whatsapp_web`;
    try {
      // Test webhook URL accessibility from our side
      const webhookTestResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
        },
        body: JSON.stringify({
          event: 'test',
          instanceId: 'diagnostic_test',
          data: { test: true, message: 'Teste de conectividade do diagnóstico' }
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (webhookTestResponse.ok || webhookTestResponse.status === 200) {
        results.diagnostics.connectivity.webhook_url.success = true;
        results.diagnostics.connectivity.webhook_url.details = 'Webhook Supabase acessível e funcionando';
        results.diagnostics.analysis.webhook_reachable = true;
      } else {
        results.diagnostics.connectivity.webhook_url.details = `Webhook retornou ${webhookTestResponse.status}: ${webhookTestResponse.statusText}`;
      }
    } catch (error: any) {
      results.diagnostics.connectivity.webhook_url.details = `Erro ao testar webhook: ${error.message}`;
    }

    // Generate recommendations based on test results
    console.log('Generating recommendations...');
    
    if (!results.diagnostics.analysis.server_running) {
      results.recommendations.push({
        priority: 'CRÍTICO',
        issue: 'Servidor Node.js não está respondendo',
        solution: 'Execute: pm2 restart whatsapp-server ou reinicie o servidor com npm start'
      });
    }

    if (!results.diagnostics.analysis.webhook_reachable) {
      results.recommendations.push({
        priority: 'ALTO',
        issue: 'Problemas de conectividade SSL/Timeout detectados nos logs',
        solution: 'Atualize o código do servidor para resolver problemas SSL e implementar retry automático'
      });
    }

    if (results.diagnostics.analysis.total_instances === 0) {
      results.recommendations.push({
        priority: 'INFORMATIVO',
        issue: 'Nenhuma instância WhatsApp ativa encontrada',
        solution: 'Crie uma nova instância WhatsApp através do painel de administração'
      });
    }

    // Generate verification script
    results.verification_script = `#!/bin/bash
echo "=== DIAGNÓSTICO VPS WHATSAPP WEB.JS ==="
echo "Data: $(date)"
echo ""

echo "=== 1. STATUS DO SERVIDOR ==="
ps aux | grep node | grep -v grep
echo ""

echo "=== 2. PORTAS EM USO ==="
netstat -tlnp | grep :3001
echo ""

echo "=== 3. TESTE ENDPOINTS ==="
echo "Health Check:"
curl -s -w "Status: %{http_code}\\n" http://localhost:3001/health | head -5
echo ""

echo "Server Info:"
curl -s -w "Status: %{http_code}\\n" http://localhost:3001/info | head -5
echo ""

echo "Instances:"
curl -s -w "Status: %{http_code}\\n" http://localhost:3001/instances | head -5
echo ""

echo "=== 4. TESTE WEBHOOK SUPABASE ==="
curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}" \\
  -w "Status: %{http_code}\\n" \\
  -d '{"event":"test","instanceId":"diagnostic","data":{"test":true,"message":"Teste manual VPS"}}'
echo ""

echo "=== 5. LOGS PM2 ==="
pm2 logs whatsapp-server --lines 10 --nostream
echo ""

echo "=== 6. CORREÇÃO SSL/TIMEOUT ==="
echo "Execute o seguinte código para corrigir problemas SSL:"
echo ""
cat << 'EOF'
// Adicione ao início do server.js:
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// Substitua a função sendWebhook por:
async function sendWebhook(event, instanceId, data, retries = 3) {
  const webhookUrl = 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web';
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZ3llYnJoZm9sam55ZGZpcGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMDU0OTUsImV4cCI6MjA2MjY4MTQ5NX0.348qSsRPai26TFU87MDv0yE4i_pQmLYMQW9d7n5AN-A'
        },
        body: JSON.stringify({
          event,
          instanceId,
          data
        }),
        timeout: 30000
      });

      if (response.ok) {
        console.log(\`✅ Webhook enviado (tentativa \${attempt}): \${event}\`);
        return;
      } else {
        console.log(\`⚠️ Webhook falhou (tentativa \${attempt}): \${response.status}\`);
      }
    } catch (error) {
      console.log(\`❌ Erro webhook (tentativa \${attempt}): \${error.message}\`);
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }
  console.log(\`🔥 Webhook falhou após \${retries} tentativas\`);
}
EOF
echo ""
echo "=== FIM DO DIAGNÓSTICO ==="`;

    // Calculate summary
    let totalIssues = 0;
    let totalWarnings = 0;

    results.recommendations.forEach(rec => {
      if (rec.priority === 'CRÍTICO') totalIssues++;
      else if (rec.priority === 'ALTO') totalWarnings++;
    });

    results.summary.total_issues = totalIssues;
    results.summary.total_warnings = totalWarnings;

    if (results.diagnostics.analysis.server_running) {
      results.summary.server_status = 'ONLINE';
      results.success = true;
      results.message = 'Diagnóstico concluído - Servidor online';
    } else {
      results.summary.server_status = 'OFFLINE';
      results.message = 'Diagnóstico concluído - Problemas detectados';
    }

    // Generate next steps
    if (totalIssues > 0) {
      results.summary.next_steps.push('Corrigir problemas críticos identificados');
    }
    if (totalWarnings > 0) {
      results.summary.next_steps.push('Resolver avisos de configuração');
    }
    if (results.diagnostics.analysis.server_running && !results.diagnostics.analysis.webhook_reachable) {
      results.summary.next_steps.push('Implementar correções SSL/Timeout no código do servidor');
    }

    console.log('Diagnostic completed:', results);

    return new Response(
      JSON.stringify(results),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Diagnostic error:', error);
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
