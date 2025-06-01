
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== INICIANDO DIAGNÓSTICO COMPLETO DA VPS ===');
    
    const vpsConfig = {
      host: '31.97.24.222',
      port: 3001,
      sshPort: 22,
      type: 'Ubuntu 4GB VPS'
    };

    console.log(`Testando VPS: ${vpsConfig.host}:${vpsConfig.port}`);

    // === TESTE 1: CONECTIVIDADE BÁSICA ===
    console.log('\n--- TESTE 1: CONECTIVIDADE BÁSICA ---');
    
    let pingTest = false;
    let pingResponse = '';
    try {
      const response = await fetch(`http://${vpsConfig.host}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      pingTest = true;
      pingResponse = `Host acessível - Status: ${response.status}`;
      console.log('✅ Ping básico: SUCESSO');
    } catch (error) {
      pingResponse = `Erro: ${error.message}`;
      console.log('❌ Ping básico: FALHOU -', error.message);
    }

    // === TESTE 2: SERVIDOR NODE.JS RODANDO ===
    console.log('\n--- TESTE 2: SERVIDOR NODE.JS ---');
    
    let nodeServerTest = false;
    let nodeServerResponse = '';
    try {
      const response = await fetch(`http://${vpsConfig.host}:${vpsConfig.port}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const data = await response.json();
        nodeServerTest = true;
        nodeServerResponse = JSON.stringify(data, null, 2);
        console.log('✅ Servidor Node.js: RODANDO');
        console.log('Resposta /health:', data);
      } else {
        nodeServerResponse = `HTTP ${response.status}: ${response.statusText}`;
        console.log('❌ Servidor Node.js: ERRO -', response.status);
      }
    } catch (error) {
      nodeServerResponse = `Erro de conexão: ${error.message}`;
      console.log('❌ Servidor Node.js: NÃO ACESSÍVEL -', error.message);
    }

    // === TESTE 3: INFORMAÇÕES DO SERVIDOR ===
    console.log('\n--- TESTE 3: INFORMAÇÕES DO SERVIDOR ---');
    
    let serverInfoTest = false;
    let serverInfo = null;
    try {
      const response = await fetch(`http://${vpsConfig.host}:${vpsConfig.port}/info`, {
        method: 'GET',
        signal: AbortSignal.timeout(8000)
      });
      
      if (response.ok) {
        serverInfo = await response.json();
        serverInfoTest = true;
        console.log('✅ Informações do servidor obtidas:');
        console.log(JSON.stringify(serverInfo, null, 2));
      } else {
        console.log('❌ Erro ao obter informações do servidor:', response.status);
      }
    } catch (error) {
      console.log('❌ Falha ao obter informações do servidor:', error.message);
    }

    // === TESTE 4: INSTÂNCIAS ATIVAS ===
    console.log('\n--- TESTE 4: INSTÂNCIAS WHATSAPP ATIVAS ---');
    
    let instancesTest = false;
    let instancesData = null;
    try {
      const response = await fetch(`http://${vpsConfig.host}:${vpsConfig.port}/instances`, {
        method: 'GET',
        signal: AbortSignal.timeout(8000)
      });
      
      if (response.ok) {
        instancesData = await response.json();
        instancesTest = true;
        console.log('✅ Lista de instâncias obtida:');
        console.log(JSON.stringify(instancesData, null, 2));
      } else {
        console.log('❌ Erro ao listar instâncias:', response.status);
      }
    } catch (error) {
      console.log('❌ Falha ao listar instâncias:', error.message);
    }

    // === TESTE 5: WEBHOOK DE TESTE ===
    console.log('\n--- TESTE 5: CONFIGURAÇÃO DE WEBHOOK ---');
    
    const webhookUrl = `https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web`;
    let webhookTest = false;
    let webhookResponse = '';
    
    try {
      // Simular um evento de webhook para testar se a URL está acessível
      const testPayload = {
        event: 'test',
        instanceId: 'test_instance',
        data: { message: 'Teste de conectividade webhook' },
        timestamp: new Date().toISOString()
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZ3llYnJoZm9sam55ZGZpcGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMDU0OTUsImV4cCI6MjA2MjY4MTQ5NX0.348qSsRPai26TFU87MDv0yE4i_pQmLYMQW9d7n5AN-A`
        },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const result = await response.json();
        webhookTest = true;
        webhookResponse = `Webhook acessível - Resposta: ${JSON.stringify(result)}`;
        console.log('✅ Webhook URL acessível');
      } else {
        webhookResponse = `HTTP ${response.status}: ${response.statusText}`;
        console.log('❌ Webhook URL com erro:', response.status);
      }
    } catch (error) {
      webhookResponse = `Erro: ${error.message}`;
      console.log('❌ Webhook URL inacessível:', error.message);
    }

    // === ANÁLISE DOS RESULTADOS ===
    console.log('\n=== ANÁLISE DOS RESULTADOS ===');
    
    const diagnostics = {
      connectivity: {
        basic_ping: { success: pingTest, details: pingResponse },
        node_server: { success: nodeServerTest, details: nodeServerResponse },
        server_info: { success: serverInfoTest, data: serverInfo },
        instances_list: { success: instancesTest, data: instancesData },
        webhook_url: { success: webhookTest, details: webhookResponse }
      },
      analysis: {
        server_running: nodeServerTest,
        has_instances: instancesData?.instances?.length > 0 || false,
        webhook_reachable: webhookTest,
        total_instances: instancesData?.total || 0
      }
    };

    // === RECOMENDAÇÕES ===
    const recommendations = [];
    
    if (!nodeServerTest) {
      recommendations.push({
        priority: 'CRÍTICO',
        issue: 'Servidor Node.js não está rodando na porta 3001',
        solution: 'Executar: cd /root/whatsapp-server && npm start ou pm2 start ecosystem.config.js'
      });
    }

    if (nodeServerTest && (!instancesData || instancesData.total === 0)) {
      recommendations.push({
        priority: 'ALTO',
        issue: 'Servidor rodando mas sem instâncias WhatsApp ativas',
        solution: 'Verificar se as instâncias foram criadas corretamente e se estão conectadas'
      });
    }

    if (!webhookTest) {
      recommendations.push({
        priority: 'ALTO',
        issue: 'URL do webhook não está acessível ou configurada incorretamente',
        solution: 'Verificar se a VPS consegue fazer POST para o webhook do Supabase'
      });
    }

    if (nodeServerTest && instancesData?.total > 0) {
      recommendations.push({
        priority: 'INFORMATIVO',
        issue: 'Servidor e instâncias funcionando, verificar sincronização',
        solution: 'Testar reconexão de uma instância para verificar se os eventos chegam ao webhook'
      });
    }

    // === SCRIPT DE VERIFICAÇÃO ATUALIZADO ===
    const verificationScript = `#!/bin/bash

echo "=== DIAGNÓSTICO VPS WHATSAPP WEB.JS ==="
echo "Host: ${vpsConfig.host}"
echo "Porta: ${vpsConfig.port}"
echo ""

# Verificar se o Node.js está instalado
echo "1. Verificando Node.js..."
node --version
npm --version

# Verificar se o PM2 está rodando
echo "2. Verificando PM2..."
pm2 status

# Verificar se a porta 3001 está escutando
echo "3. Verificando porta 3001..."
netstat -tlnp | grep :3001

# Verificar logs do servidor
echo "4. Últimos logs do servidor..."
pm2 logs whatsapp-server --lines 20

# Testar endpoints locais
echo "5. Testando endpoints..."
curl -s http://localhost:3001/health | jq .
curl -s http://localhost:3001/info | jq .
curl -s http://localhost:3001/instances | jq .

# Verificar conectividade com Supabase
echo "6. Testando webhook Supabase..."
curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZ3llYnJoZm9sam55ZGZpcGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMDU0OTUsImV4cCI6MjA2MjY4MTQ5NX0.348qSsRPai26TFU87MDv0yE4i_pQmLYMQW9d7n5AN-A" \\
  -d '{"event":"test","instanceId":"diagnostic","data":{"test":true}}'

echo ""
echo "=== FIM DO DIAGNÓSTICO ==="
`;

    console.log('\n=== DIAGNÓSTICO CONCLUÍDO ===');

    return new Response(
      JSON.stringify({
        success: true,
        message: "Diagnóstico completo da VPS executado",
        timestamp: new Date().toISOString(),
        vps: vpsConfig,
        diagnostics,
        recommendations,
        verification_script: verificationScript,
        summary: {
          server_status: nodeServerTest ? "ONLINE" : "OFFLINE",
          total_issues: recommendations.filter(r => r.priority === 'CRÍTICO').length,
          total_warnings: recommendations.filter(r => r.priority === 'ALTO').length,
          next_steps: recommendations.slice(0, 3).map(r => r.solution)
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Erro no diagnóstico da VPS:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: "Falha no diagnóstico da VPS"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
